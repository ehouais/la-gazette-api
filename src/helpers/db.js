const mongo = require("mongodb")
const mongoClient = mongo.MongoClient;

const DbError = class MyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MyError';
  }
}

module.exports = (url, dbName) => {
  const collection = collectionName =>
    action => mongoClient.connect(url+'/'+dbName, { useNewUrlParser: true })
      .then(client => new Promise((resolve, reject) => {
        let db
        try {
          db = client.db(dbName)
        } catch(e) {
          reject(new DbError('Error accessing database "'+dbName+'": '+e.message))
        }
        let collection
        try {
          collection = db.collection(collectionName)
        } catch(e) {
          reject(new DbError('Error accessing collection "'+collectionName+'": '+e.message))
        }
        action(collection).then(result => {
          client.close()
          resolve(result)
        }).catch(e => {
          reject(new DbError(e.message))
        })
      }))

  return { DbError, collection, ObjectId: mongo.ObjectId }
}
