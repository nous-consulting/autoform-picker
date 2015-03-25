AutoForm.addInputType 'toic-picker',
  template: 'clientPicker'
  valueOut: -> @data("selected-value")

Template.clientPicker.created = ->
  @picker = @
  @current_position = new ReactiveVar 1
  @cache = []
  @position = null
  @selected = new ReactiveVar null # Selected element (usually ID) in the list
  @original_id = @data.value

  @search_query = new ReactiveVar null
  @inline_form = new ReactiveVar false
  @current_search = new ReactiveVar []
  @chosen = new ReactiveVar true # True if needed stuff is already found and chosen
  @opened = new ReactiveVar false # If true show autocomplete items
  @autorun =>
    @opened.set false if @chosen.get()
  @autorun =>
    @opened.set !! @search_query.get()

  # Magic. We love AutoForm. Look at Schema.
  _class = @data.atts.class ? Object
  _collection = @data.atts.collection
  @choose = @data.atts.choose
  @collection = @getCollection _collection
  filter = new ReactiveVar null
  @autorun =>
    filter.set Template.currentData().atts.filter ? undefined

  @_setSearch = (txt, chosen) =>
    @search_query.set txt
    @find('[data-schema-key]').value = txt
    @chosen.set chosen?
    @input.data("selected-value", chosen)

    unless chosen?
      if txt.trim() is ''
        @current_search.set []
      else
        Meteor.call 'searchIn', _collection, txt, filter.get(), (error, result) =>
          if error
            alert error.reason
          else
            _.each result, (r) ->
              r.__proto__ = _class::
            @current_search.set result
    else
      @current_search.set []

  @setSearch = _.debounce(@_setSearch, 300)

Template.clientPicker.rendered = ->
  @input = $ @find "[data-schema-key]"
  @input.data "selected-value", @data.value


Template.clientPicker.helpers
  inline_form_name: -> @atts.inline_template ? "toicPicker_inline_form"
  picker_value: ->
    tpl = Template.instance()
    tpl.choose.call tpl.collection.findOne @value
  atts: ->
    'data-schema-key': @atts['data-schema-key']
    'collection': @atts['collection']
    'fields': @atts['fields'] ? undefined
  autocomplete_items: ->
    tpl = Template.instance()

    result = tpl.cache = tpl.current_search.get()
    # Don't show any results if nothing typed in search box
    if result.length is 0
      return false

    tpl.position = null if tpl.position isnt -1

    id = tpl.selected.get()
    if id?
      tmp_id = id
      id = null
      for c, i in tpl.cache when c._id is tmp_id
        tpl.position = i
        id = c._id
    unless id? or tpl.position is -1
      unless tpl.cache.length is 0
        c = tpl.cache[0]
        id = c._id
        tpl.position = 0
    tpl.selected.set id

    return result
  active: ->
    if Template.instance().selected.get() is @_id
      "active"
    else
      undefined
  active_new: ->
    ## TODO Find how to invalidate helper properly
    if Template.instance().position is -1
      "active"
    else
      undefined
  search_query: -> Template.instance().search_query.get()
  opened: ->  Template.instance().opened.get()
  inline_form: -> Template.instance().inline_form.get()
  choose: -> Template.instance().choose.call @

Template.clientPicker.events
  'keydown .search': (event, template) ->
    if event.keyCode is 13 #ENTER
      if template.chosen.get()
        return true

      event.preventDefault()
      if template.position is -1
        template.inline_form.set true
      else
        id = template.selected.get()
        item = template.collection.findOne id
        template._setSearch(template.choose.call(item), id)
      return false
  'keyup .search': (event, template) ->
    event.preventDefault()
    switch event.keyCode
      when 38
        if template.position > -1
          template.position--
          if template.position >= 0
            template.selected.set template.cache[template.position]._id
          else
            template.selected.set null
      when 40
        if template.position < (Math.min 10, template.cache.length) - 1
          template.position++
          template.selected.set template.cache[template.position]._id
      when 13 # Do nothing on ENTER
        return
      when 27 # ESCAPE
        id = template.original_id
        item = template.collection.findOne id
        template._setSearch (template.choose.call item), id
      else
        template.chosen.set null
        txt = template.find('[name="search-client"]').value
        template.setSearch txt
  'blur .search': (event, template) ->
    setTimeout ->
      unless template.inline_form.get()
        template.opened.set false
    , 300
  'focus .search': (event, tpl) ->
    if tpl.opened.get() is false and !tpl.chosen.get()
      tpl.opened.set true
  'click a.back': (event, tpl) ->
    tpl.inline_form.set false
  'click .add-client': (event, tpl) ->
    tpl.inline_form.set true
  'click a.client-item': (event, tpl) ->
    tpl._setSearch tpl.choose.call(@), @_id
  'click .clear-search': (event, tpl) ->
    tpl._setSearch '', null


AutoForm.addHooks ["toicPickerInsert"],
  onSuccess: (operation, result) ->
    tpl = @template.get("picker")
    item = tpl.collection.findOne result
    tpl._setSearch(tpl.choose.call(item), result)
    tpl.inline_form.set false
