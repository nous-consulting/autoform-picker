# AutoForm Picker

Meteor AutoForm widget which allow to pick (or create new) document from given Mongo Collection.

## Motivation

We needed an AutoForm plugin which:
 - would allow to select some value from given collection
 - could work with big amount of data (e.g. 100 000 entries/docs)
 - while filtering/searching, would transliterate search phrase
 - would allow to create new document in DB right from widget

The closest solution at that time was `aldeed:autoform-select2`, but it's not good when you work with big amount of data (it's not good idea to subscribe for 100 000 docs and find/filter them on client. Also autoform-select2 not support possibility to create new document/enty in DB while filling form.

## How does it work? (Features)

- Creates index of fields we will use to search/filter.
- Do filter/search on server and then send to client max 20 filtered results.
- Supports transliteration. E.g. allow search for `Rīga` by typing `riga` or `Рига`.
- Uses quickForm to create new entry into DB (you can also create own form template with autoForm if you need).


## Usage manual

1. Install package: `meteor add nous:autoform-picker` (previously known as `chompomonim:autoform-picker`)

1. To get possibility to search on server (using some kind of index), you'll need to register your Collection:

 ``` JavaScript
 // lib/collection.js
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import searchIn from 'meteor/nous:search-in';

/* This is optional. In case you use Colection transformations, we also support them.
export class ClientBase {
    get name() {
        return `${this.first_name} ${this.last_name}`
    }
    ...
}

export const Clients = new Mongo.Collection('clients', {
    transform: function(doc) {
        return _.extend(new ClientBase, doc)
    }
});
*/

export const Clients = new Mongo.Collection('clients');

// Your schema here

if (Meteor.isServer) {
  searchIn.register(Clients, function () {
    return {
      name: `${this.first_name} ${this.last_name}`,
      address: this.address,
      email: ((this.emails != null) ? this.emails : []).join(' ')
    }
  });
}
```

1. In your schema you should add `toic-picker` autoform type.

```JavaScript

SomeSchema = new SimpleSchema({
  ...
  client_id: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    autoform: {
      type: "toic-picker",
      afFieldInput: {
        collection: 'clients',           // Collection name
        choose: ()=> function () { return this.name }, // What you want to see as a item name/label of select results. Yes, it's function as a parametr for other function.
        class: ()=> ClientBase,          // (optional) Function which returns collection base.
        fields: ["name", "category_ids"] // (optional) If you'll use default template (quickForm), you can select which fielts do you need there.
      }
    }
  }
})
  ...
```

Example project: https://github.com/chompomonim/autoform-picker-example
