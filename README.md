# AutoForm Picker

Meteor AutoForm plugin which allow to pick (or create new) document from given Mongo Collection.

## Motivation

We needed an AutoForm plugin which would:
 - would allow to select some value from given collection
 - work with big amount of data (e.g. 100 000 entries/docs)
 - would allow to create new document in DB right from plugin

The closest solution would use `aldeed:autoform-select2`, but it's not good when you work with big amount of data (it's not good idea to subscribe for 100 000 docs and find/filter them on client. Also it not support possibility to create new document/enty in DB while filling form.

## How does it work? (Features)

- Creates index of fields we will search from.
- Do filter/search on server and then send to client only max 20 filtered results.
- Uses quickForm to create new entry into DB (you can also create own form with autoForm if you need).

## Usage manual

1. To have possibility to search on server and have needed indexes, you'll need to add `@searchIn.register "CollectionName" right after creating it. E.g.:
 
``` CoffeeScript
class @ClientBase
  name: -> "#{@first_name} #{@last_name}"
  ...
      
@Clients = new Mongo.Collection 'clients',
  transform: (doc) -> _.extend new ClientBase, doc
  
if Meteor.isServer
  @searchIn.register "Clients", ->
    name: "#{@first_name} #{@last_name}"
    code: @code
    id: @id.toString()
    contacts: (@contacts?.emails ? []).join(' ')
```

2. In your schema you should add `toic-picker` autoform type. 
 
```CoffeeScript
@SomeSchema = new SimpleSchema
  ...
  client_id:
    type: String
    regEx: SimpleSchema.RegEx.Id
    autoform:
      type: "toic-picker"
      afFieldInput:
        collection: 'Clients'    # Collection name
        class: => @ClientBase    # Collection's class (if needed)
        choose: -> -> "#{@name}" # What you want to see as a label of select. Yes, it's function as a parametr for other function.
        inline_template: 'clientAddInsidePicker'  # (optional), if you need some additional template.
        fields: ["name", "category_ids"]          # (optional) I you'll use default template (quickForm), you can select which fielts do you need there.
 ...
```

