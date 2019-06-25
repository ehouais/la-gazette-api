const mongo = require("mongodb")
const DB = require('./helpers/mongo-utils')
const { collection, getAll, map, count, find, findOne, insertOne, updateOne, deleteOne } = DB(process.env.MONGO_URL, process.env.MONGO_DATABASE)
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});

const { log } = require('./helpers/logger')

const adverts = () => collection('adverts')
const photos = () => collection('photos')
const users = () => collection('users')

const S3 = new AWS.S3({apiVersion: '2006-03-01'})
const s3Params = key => ({Bucket: process.env.S3_BUCKET_NAME, Key: key})

const removeId = data => { if (data) delete data._id; return data }
const transformId = data => { if (data) data.id = data._id.toString(); return removeId(data) }

module.exports = {
  test: () => adverts().then(count),

  createAdvert: params => adverts().then(insertOne({ ...params, photos: [] })).then(transformId),
  getAdverts: () => adverts().then(getAll).then(map(transformId)),
  getAdvert: id => adverts().then(findOne({ _id: mongo.ObjectId(id) })).then(advert => advert && transformId(advert)),
  deleteAdvert: id => adverts().then(deleteOne({ _id: mongo.ObjectId(id) })), // delete corresponding photos

  getAdvertPhotos: id => photos().then(find({ advert_id: id })).then(map(removeId)),
  uploadPhoto: (key, advertId, data) => new Promise((resolve, reject) => {
    S3.putObject({ ...s3Params(key), Body: data }, err => {
      if (err) return reject(err)
      photos().then(insertOne({ key, advert_id: advertId })).then(removeId).then(resolve)
    })
  }),

  getPhotos: () => photos().then(getAll),
  getPhoto: key => photos().then(findOne({ key })).then(removeId),
  getPhotoStream: key => Promise.resolve(S3.getObject(s3Params(key)).createReadStream()),
  deletePhoto: key => new Promise((resolve, reject) => {
    S3.deleteObject(s3Params(key), err => {
      if (err) return reject(err)
      photos().then(deleteOne({ key })).then(resolve)
    })
  }),

  createUser: (email, passhash) => users().then(insertOne({ email, passhash })),
  getUsers: () => users().then(getAll),
  getUserByEmail: email => users().then(findOne({ email })).then(removeId),
  patchUser: (email, data) => users().then(updateOne({ email }, { $set: data })),
  deleteUser: email => users().then(deleteOne({ email }))
}