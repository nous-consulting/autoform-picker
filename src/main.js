import _ from 'lodash'

import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { AutoForm } from 'meteor/aldeed:autoform'
import { Blaze } from 'meteor/blaze'
import { getCollectionByName } from './utils'


Template.itemPicker.onCreated(function() {
    this.picker = this
    this.current_position = new ReactiveVar(1)
    this.cache = []
    this.position = null
    this.selected = new ReactiveVar(null)  // Selected element (usually ID) in the list
    this.original_id = this.data.value

    this.search_query = new ReactiveVar(null)
    this.inline_form = new ReactiveVar(false)
    this.current_search = new ReactiveVar([])
    this.chosen = new ReactiveVar(true)    // True if needed stuff is already found and chosen
    this.opened = new ReactiveVar(false)   // If true show autocomplete items

    this.autorun(() => {
        if (this.chosen.get())
            this.opened.set(false)
    })
    this.autorun(() => this.opened.set(!!this.search_query.get()))

    // Magic. We love AutoForm. Look at Schema.
    let _class = this.data.atts["class"] || Object
    let _collection = this.data.atts["collection"]
    this.choose = this.data.atts["choose"]
    this.collection = getCollectionByName(_collection)

    let filter = new ReactiveVar(null)
    this.autorun(function () {
        let current_filter = (Template.currentData().atts["filter"]) ? Template.currentData().atts["filter"] : undefined
        filter.set(current_filter)
    })

    this._setSearch = (txt, chosen) => {
        this.search_query.set(txt)
        this.find('[data-schema-key]').value = txt
        this.chosen.set(typeof chosen !== "undefined" && chosen !== null)
        this.input.data("selected-value", chosen)

        if (typeof chosen === "undefined" || chosen === null) {
            if (txt.trim() === '') {
                this.current_search.set([])
            } else {
                Meteor.call('searchIn', _collection, txt, filter.get(), (error, result) => {
                    if (error) {
                        alert(error.reason)
                    } else {
                        _.each(result, function (r) {
                            r.__proto__ = _class.prototype
                        })
                        this.current_search.set(result)
                    }
                })
            }
        } else {
            this.current_search.set([])
        }
    }

    this.setSearch = _.debounce(this._setSearch, 300)
 })

Template.itemPicker.onRendered(function() {
    this.input = $(this.find("[data-schema-key]"))
    this.input.data("selected-value", this.data.value)
})

Template.itemPicker.helpers({
    atts: function() {
        let fields = this.atts['fields']
        return {
            'data-schema-key': this.atts['data-schema-key'],
            'collection': this.atts['collection'],
            'fields': (fields) ? fields : undefined
        }
    },

    form_data: function() {
        const template = Template.instance()
        return {
            'collection': template.collection,
            'fields': template.data.atts['fields']
        }
    },

    inline_form_name: function() {
        if (this.atts.inline_template != null) {
            return this.atts.inline_template
        } else {
            return "toicPicker_inline_form"
        }
    },

    picker_value: function() {
        const tpl = Template.instance()
        return tpl.choose.call(tpl.collection.findOne(this.value))
    },

    autocomplete_items: function() {
        let tpl = Template.instance()

        let result = tpl.cache = tpl.current_search.get()
        // Don't show any results if nothing typed in search box
        if (result.length === 0)
            return false

        if (tpl.position !== -1)
            tpl.position = null

        let id = tpl.selected.get()
        let tmp_id
        if (typeof id !== "undefined" && id !== null) {
            tmp_id = id
            id = null
            for (let index in tpl.cache) {
                if (tpl.cache[index]._id === tmp_id) {
                    tpl.position = index
                    id = tpl.cache[index]._id
                }
            }
        }

        if (!((typeof id !== "undefined" && id !== null) || tpl.position === -1)) {
            if (tpl.cache.length !== 0) {
                let c = tpl.cache[0]
                id = c._id
                tpl.position = 0
            }
        }
        tpl.selected.set(id)
        return result
    },

    active: function() {
        if (Template.instance().selected.get() === this._id) {
            return 'active'
        } else {
            return undefined
        }
    },

    active_new: function() {
        // TODO Find how to invalidate helper properly
        if (Template.instance().position === -1) {
            return 'active'
        } else {
            return undefined
        }
    },

    search_query: function() {
        return Template.instance().search_query.get()
    },

    opened: function() {
        return Template.instance().opened.get()
    },

    inline_form: function() {
        return Template.instance().inline_form.get()
    },

    choose: function() {
        return Template.instance().choose.call(this)
    }
})

Template.itemPicker.events({
    'keydown .search': function(event, template) {
        if (event.keyCode === 13) { // ENTER
            if (template.chosen.get())
                return true

            event.preventDefault()
            if (template.position === -1) {
                template.inline_form.set(true)
            } else {
                let id = template.selected.get()
                let item = template.collection.findOne(id)
                template._setSearch(template.choose.call(item), id)
            }

            return false
        }
    },

    'keyup .search': function(event, template) {
        event.preventDefault()

        switch (event.keyCode) {
            case 38:
                if (template.position > -1) {
                    template.position--
                    if (template.position >= 0) {
                        template.selected.set(template.cache[template.position]._id)
                    } else {
                        template.selected.set(null)
                    }
                }
                break
            case 40:
                if (template.position < (Math.min(10), template.cache.length) - 1) {
                    template.position++
                    template.selected.set(template.cache[template.position]._id)
                }
                break
            case 13: // Do nothing on ENTER
                return
            case 27: // ESCAPE
                let id = template.original_id
                let item = template.collection.findOne(id)
                template._setSearch(template.choose.call(item), id)
                break
            default:
                template.chosen.set(null)
                let txt = template.find('[name="search-client"]').value
                template.setSearch(txt)
        }
    },

    'blur .search': function(event, template) {
        setTimeout(function(){
            if (!template.inline_form.get()) {
                template.opened.set(false)
            }
        }, 300)
    },

    'focus .search': function(event, template) {
        if (template.opened.get() === false && !template.chosen.get()) {
            template.opened.set(true)
        }
    },

    'click a.back': function(event, template) {
        template.inline_form.set(false)
    },

    'click .add-client': function(event, template) {
        template.inline_form.set(true)
    },

    'click a.client-item': function(event, template) {
        template._setSearch(template.choose.call(this), this._id)
    },

    'click .clear-search': function(event, template) {
        template._setSearch('', null)
    }
})

AutoForm.addInputType('toic-picker', {
    template: 'itemPicker',
    valueOut: function () { return this.data("selected-value") }
})

AutoForm.addHooks(["toicPickerInsert"], {
    onSuccess: function(operation, result) {
        let tpl = this.template.get('picker')
        let item = tpl.collection.findOne(result)
        tpl._setSearch(tpl.choose.call(item), result)
        tpl.inline_form.set(false)
    }
})
