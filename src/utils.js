import { CollectionExtensions } from 'meteor/lai:collection-extensions'

let instances = []
CollectionExtensions.addExtension(function (name, options) {
  instances.push({
    name: name,
    instance: this,
    options: options
  });
});

export function getCollectionByName(collecion_name) {
    var collection = _.find(instances, function(instance) {
        return instance.name === collecion_name
    });

    return collection.instance
}
