const mongo = require("mongodb")
const DB = require('./helpers/mongo-utils')
const { collection, getAll, map, count, find, findOne, insertOne, deleteOne } = DB(process.env.MONGO_URL, process.env.MONGO_DATABASE)
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});

const { log } = require('./helpers/logger')

const S3 = new AWS.S3({apiVersion: '2006-03-01'})
const s3Params = key => ({Bucket: process.env.S3_BUCKET_NAME, Key: key})

const removeId = data => { delete data._id; return data }
const transformId = data => { data.id = data._id.toString(); return removeId(data) }

module.exports = {
  test: () => collection('adverts').then(count),

  createAdvert: params => collection('adverts').then(insertOne({ ...params, photos: [] })).then(transformId),
  getAdverts: () => collection('adverts').then(getAll).then(map(transformId)),
  getAdvert: id => collection('adverts').then(findOne({ _id: mongo.ObjectId(id) })).then(advert => advert && transformId(advert)),
  deleteAdvert: id => collection('adverts').then(deleteOne({ _id: mongo.ObjectId(id) })), // delete corresponding photos

  getAdvertPhotos: id => collection('photos').then(find({ advert_id: id })).then(map(removeId)),
  uploadPhoto: (key, advertId, data) => new Promise((resolve, reject) => {
    S3.putObject({ ...s3Params(key), Body: data }, err => {
      if (err) return reject(err)
      collection('photos').then(insertOne({ key, advert_id: advertId })).then(removeId).then(resolve)
    })
  }),

  getPhotos: () => collection('photos').then(getAll),
  getPhoto: key => collection('photos').then(findOne({ key })).then(removeId),
  getPhotoStream: key => Promise.resolve(S3.getObject(s3Params(key)).createReadStream()),
  deletePhoto: key => new Promise((resolve, reject) => {
    S3.deleteObject(s3Params(key), err => {
      if (err) return reject(err)
      collection('photos').then(deleteOne({ key })).then(resolve)
    })
  }),

  createUser: (email, passhash) => collection('users').then(insertOne({ email, passhash })),
  getUsers: () => collection('users').then(getAll),
  getUserByEmail: email => collection('users').then(findOne({ email })).then(removeId)
}