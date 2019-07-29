const { DB, objectId } = require('./helpers/mongo-utils')
const { createIndex, status, collection, get, getAll, map, count, find, findOne, insertOne, updateOne, deleteOne } = DB(process.env.MONGO_URL, process.env.MONGO_DATABASE)
const AWS = require('aws-sdk');
//AWS.config.update({ region: process.env.S3_REGION });

const { log } = require('./helpers/logger')

const collectionLog = name => action => { log(`Accessing collection "${name}"`); return collection(name).then(action) }
const adverts = collectionLog('adverts')
const photos = collectionLog('photos')
const users = collectionLog('users')

const S3 = new AWS.S3({ apiVersion: '2006-03-01', ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT }) })
const s3Params = key => ({ Bucket: process.env.S3_BUCKET_NAME, Key: key })

const removeId = data => { if (data) delete data._id; return data }
const transformId = data => { if (data) data.id = data._id.toString(); return removeId(data) }

module.exports = {
  version: () => status().then(info => info.version),
  timestamp: value => Math.round((value.getTime ? value.getTime() : value) / 1000),

  ensureAdvertsIndex: () => adverts(createIndex({ text: 'text' }, { default_language: 'french' })),
  createAdvert: params => adverts(insertOne(params)).then(transformId),
  getAdverts: (from, contains) => adverts(
    get({
      ...(from && { creation_date: { $lte: new Date(from) } }),
      ...(contains && { $text: { $search: contains } })
    }, +process.env.NB_ADVERTS_MAX))
    .then(map(transformId)),
  getAdvert: id => adverts(findOne({ _id: objectId(id) })).then(advert => advert && transformId(advert)),
  patchAdvert: (id, data) => adverts(updateOne({ _id: objectId(id) }, { $set: data })),
  deleteAdvert: id => adverts(deleteOne({ _id: objectId(id) })), // TODO: delete corresponding photos
  getNbAdverts: () => adverts(count),

  getAdvertPhotos: id => photos(find({ advert_id: id })).then(map(removeId)),
  uploadPhoto: (key, advertId, data) => new Promise((resolve, reject) => {
    S3.putObject({ ...s3Params(key), Body: data }, err => {
      if (err) return reject(err)
      photos(insertOne({ key, advert_id: advertId })).then(removeId).then(resolve)
    })
  }),

  getPhotos: () => photos(getAll(+process.env.NB_PHOTOS_MAX)),
  getPhoto: key => photos(findOne({ key })).then(removeId),
  getPhotoStream: key => Promise.resolve(S3.getObject(s3Params(key)).createReadStream()),
  deletePhoto: key => new Promise((resolve, reject) => {
    S3.deleteObject(s3Params(key), err => {
      if (err) return reject(err)
      photos(deleteOne({ key })).then(resolve)
    })
  }),
  getNbPhotos: () => photos(count),

  createUser: (email, passhash) => users(insertOne({ email, passhash })),
  getUsers: () => users(getAll(+process.env.NB_USERS_MAX)),
  getUserByEmail: email => users(findOne({ email })).then(removeId),
  patchUser: (email, data) => users(updateOne({ email }, { $set: data })),
  deleteUser: email => users(deleteOne({ email })),
  getNbUsers: () => users(count)
}