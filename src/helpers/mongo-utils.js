const mongo = require("mongodb")
const mongoClient = mongo.MongoClient;

module.exports = (dbUrl, dbName) => {
  let DB
  const db = () => {
    if (DB) return Promise.resolve(DB)
    // DB name in connection URL is necessary when using mLab cloud storage, where user account is linked to DB
    return mongoClient.connect(`${dbUrl}/${dbName}`, { useNewUrlParser: true })
      .then(client => DB = client.db(dbName))
  }
  
  return {
    collection: name => db().then(db => db.collection(name)),
    getAll: collection => collection.find({}).limit(100).toArray(),
    map: mapper => items => items.map(mapper),
    count: collection => collection.countDocuments(),
    find: query => collection => collection.find(query).toArray(),
    findOne: query => collection => collection.findOne(query),
    insertOne: doc => collection => collection
      .insertOne({ ...doc, creation_date: new Date().getTime() })
      .then(result => result.ops[0]),
    updateOne: (query, patch) => collection => collection.updateOne(query, patch),
    deleteOne: query => collection => collection.deleteOne(query)
  }
}