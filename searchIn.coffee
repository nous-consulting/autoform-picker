@buildIndex = (doc, projection) ->
  if Meteor.server
    fields = projection.call doc
    uc = Meteor.npmRequire 'unidecode'
    search = []
    pos = 0
    positions = {}
    inverse = {}
    inv = 0

    for own key, value of fields
      value ?= ''
      transliterated = uc value
      search.push transliterated
      positions[key] = pos
      for i in [0...value.length]
        part = value.substr(0,i)
        part_t = uc part
        inverse[part_t.length+inv] = i + pos
      pos += value.length
      inv += transliterated.length+1
      inverse[inv-1] = pos

    search = search.join(' ').toLowerCase()
    doc.search_strings = search
    doc.positions = positions
    doc.inverse = inverse

@searchIn = (collection_name, txt, filter) ->
  collection = searchIn.collections[collection_name]
  unless collection?
    throw new Error "This collection is not registered in buildIndex"

  uc = Meteor.npmRequire 'unidecode'
  normalized = uc(txt).toLowerCase()

  query = normalized.split(' ').map (x) ->
    search_strings: new RegExp x.replace /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"
  query.push filter if filter?
  collection.find({$and: query}, {limit : 10}).fetch()


@searchIn.collections = {}
@searchIn.register = (collection_name, index_by) =>
  collection = @[collection_name]
  unless collection instanceof Mongo.Collection
    throw new Error "#{collection_name} is not collection in global scope."

  collection.before.insert (userId, doc) ->
    buildIndex doc, index_by

  @searchIn.collections[collection_name] = collection


Meteor.methods
  searchIn: @searchIn
