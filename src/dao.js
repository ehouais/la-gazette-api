const { log } = require('./helpers/logger')

const {
  MONGO_HOST: dbHost,
  MONGO_PORT: dbPort,
  MONGO_WEBSERVER_USERNAME: dbLogin,
  MONGO_WEBSERVER_PASSWORD: dbPassword,
  MONGO_DATABASE: dbName,
  MONGO_ADVERTS_COLLECTION_NAME: collectionName
} = process.env
const url = "mongodb://" + dbLogin + ":" + dbPassword + "@" + dbHost + ":" + dbPort;
const db = require('./helpers/db')(url, dbName)
const query = db.collection(collectionName)

const filterId = data => {
  data.id = data._id.toString()
  delete data._id
  return data
}

module.exports = {
  advertExists: id => query(collection => {
    try {
      const _id = db.ObjectId(id)
      return collection
        .find({ _id }, { _id: 1 })
        .limit(1)
        .hasNext()
    } catch(e) {
      return Promise.resolve(false)
    }
  }),
  createAdvert: params => query(collection =>
    collection
      .insertOne({
        ...params,
        creation_date: new Date().getTime()
      })
      .then(result => filterId(result.ops[0]))
  ),
  getAllAdverts: () => query(collection => 
    collection
      .find({})
      .map(filterId)
      .toArray()
  ),
  getAdvert: id => query(collection =>
    collection
      .findOne({ _id: db.ObjectId(id) })
      .then(filter => filter && filterId(filter))
  ),
  // const updateAdvert = (id, params) => query(collection => collection.(),
  deleteAdvert: id => query(collection =>
    collection
      .deleteOne({ id })
  )
}