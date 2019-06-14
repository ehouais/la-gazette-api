const mongo = require("mongodb")
const mongoClient = mongo.MongoClient;
const { log } = require('./helpers/logger')

const db = ((dbUrl, dbName) => {
  let db
  return () => {
    if (db) return Promise.resolve(db)
    // DB name in connection URL is necessary when using mLab cloud storage, where user account is linked to DB
    log(`Connecting to database ${dbUrl}/${dbName}...`)
    return mongoClient.connect(`${dbUrl}/${dbName}`, { useNewUrlParser: true })
      .then(client => db = client.db(dbName))
  }
})(process.env.MONGO_URL, process.env.MONGO_DATABASE)

const adverts = () => db().then(db => db.collection(process.env.MONGO_ADVERTS_COLLECTION_NAME))

const filterId = data => {
  data.id = data._id.toString()
  delete data._id
  return data
}

module.exports = {
  test: () => adverts().then(adverts => adverts
    .countDocuments()
  ),
  advertExists: id => adverts().then(adverts => adverts
    .find({ _id: db.ObjectId(id) }, { _id: 1 })
    .limit(1)
    .hasNext()
  ),
  createAdvert: params => adverts().then(adverts => adverts
    .insertOne({ ...params, creation_date: new Date().getTime() })
    .then(result => filterId(result.ops[0]))
  ),
  getAllAdverts: () => adverts().then(adverts => adverts
    .find({})
    .map(filterId)
    .toArray()
  ),
  getAdvert: id => adverts().then(adverts => adverts
    .findOne({ _id: db.ObjectId(id) })
    .then(filter => filter && filterId(filter))
  ),
  // const updateAdvert = (id, params) => query(collection => collection.(),
  deleteAdvert: id => adverts().then(adverts => adverts
    .deleteOne({ id })
  )
}