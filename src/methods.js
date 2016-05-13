import { Meteor } from 'meteor/meteor'
import { searchIn, getCollectionByName } from 'meteor/nous:search-in'

// Register method to access search function from frontend.
Meteor.methods({
    searchIn: function (collection_name, txt, filter) {
        let collection = getCollectionByName(collection_name)
        return searchIn(collection, txt, filter)
    }
})
