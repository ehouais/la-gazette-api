const mongo = require("mongodb")
const mongoClient = mongo.MongoClient;

module.exports = {
  objectId: id => mongo.ObjectId(id),
  idIsValid: id => mongo.ObjectID.isValid(id),
  DB: (dbUrl, dbName) => {
    let DB
    const db = () => {
      if (DB) return Promise.resolve(DB)
      // DB name in connection URL is necessary when using mLab cloud storage, where user account is linked to DB
      return mongoClient.connect(`${dbUrl}/${dbName}`, { useNewUrlParser: true })
        .then(client => DB = client.db(dbName))
    }
    const get = (query, limit) => collection => collection.find(query).limit(limit).sort({ creation_date: -1 }).toArray()
    
    return {
      status: () => db().then(db => db.admin().serverStatus()),
      collection: name => db().then(db => db.collection(name)),
      get,
      getAll: limit => get({}, limit),
      map: mapper => items => items.map(mapper),
      count: collection => collection.countDocuments(),
      find: query => collection => collection.find(query).toArray(),
      findOne: query => collection => collection.findOne(query),
      insertOne: doc => collection => collection
        .insertOne({ ...doc, creation_date: new Date() })
        .then(result => result.ops[0]),
      updateOne: (query, patch) => collection => collection.updateOne(query, { ...patch, $currentDate: { last_modif_date: true } }),
      deleteOne: query => collection => collection.deleteOne(query),
      createIndex: (cols, options) => collection => collection.createIndex(cols, options)
    }
  }
}