const { DB, objectId } = require('./helpers/mongo-utils')
const { collection, getAll, map, count, find, findOne, insertOne, updateOne, deleteOne } = DB(process.env.MONGO_URL, process.env.MONGO_DATABASE)
const AWS = require('aws-sdk');
//AWS.config.update({ region: process.env.S3_REGION });

const { log } = require('./helpers/logger')

const collectionLog = name => { log(`Accessing collection "${name}"`); return collection(name) }
const adverts = () => collectionLog('adverts')
const photos = () => collectionLog('photos')
const users = () => collectionLog('users')

const S3 = new AWS.S3({ apiVersion: '2006-03-01', ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT }) })
const s3Params = key => ({ Bucket: process.env.S3_BUCKET_NAME, Key: key })

const removeId = data => { if (data) delete data._id; return data }
const transformId = data => { if (data) data.id = data._id.toString(); return removeId(data) }

module.exports = {
  test: () => adverts().then(count),
  timestamp: value => Math.round((value.getTime ? value.getTime() : value) / 1000),

  createAdvert: params => adverts().then(insertOne(params)).then(transformId),
  getAdverts: () => adverts().then(getAll(process.env.NB_ADVERTS_MAX)).then(map(transformId)),
  getAdvert: id => adverts().then(findOne({ _id: objectId(id) })).then(advert => advert && transformId(advert)),
  patchAdvert: (id, data) => adverts().then(updateOne({ _id: objectId(id) }, { $set: data })),
  deleteAdvert: id => adverts().then(deleteOne({ _id: objectId(id) })), // TODO: delete corresponding photos
  getNbAdverts: () => adverts().then(count),

  getAdvertPhotos: id => photos().then(find({ advert_id: id })).then(map(removeId)),
  uploadPhoto: (key, advertId, data) => new Promise((resolve, reject) => {
    S3.putObject({ ...s3Params(key), Body: data }, err => {
      if (err) return reject(err)
      photos().then(insertOne({ key, advert_id: advertId })).then(removeId).then(resolve)
    })
  }),

  getPhotos: () => photos().then(getAll(process.env.NB_PHOTOS_MAX)),
  getPhoto: key => photos().then(findOne({ key })).then(removeId),
  getPhotoStream: key => Promise.resolve(S3.getObject(s3Params(key)).createReadStream()),
  deletePhoto: key => new Promise((resolve, reject) => {
    S3.deleteObject(s3Params(key), err => {
      if (err) return reject(err)
      photos().then(deleteOne({ key })).then(resolve)
    })
  }),
  getNbPhotos: () => photos().then(count),

  createUser: (email, passhash) => users().then(insertOne({ email, passhash })),
  getUsers: () => users().then(getAll(process.env.NB_USERS_MAX)),
  getUserByEmail: email => users().then(findOne({ email })).then(removeId),
  patchUser: (email, data) => users().then(updateOne({ email }, { $set: data })),
  deleteUser: email => users().then(deleteOne({ email })),
  getNbUsers: () => users().then(count)
}