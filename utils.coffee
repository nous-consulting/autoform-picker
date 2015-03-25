Blaze.TemplateInstance::getCollection = (name) =>
  collection = @[name]
  unless collection instanceof Mongo.Collection
    throw new Error "#{name} is not collection in global scope."
  collection
