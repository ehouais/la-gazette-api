const { DB, objectId } = require('./helpers/mongo-utils')
const { createIndex, collection, get, getAll, map, count, find, findOne, insertOne, updateOne, deleteOne } = DB(process.env.MONGO_URL, process.env.MONGO_DATABASE)
const AWS = require('aws-sdk');

const { log } = require('./helpers/logger')

const collectionLog = name => action => { log(`Accessing collection "${name}"`); return collection(name).then(action) }
const adverts = collectionLog('adverts')
const photos = collectionLog('photos')
const users = collectionLog('users')

const crypto = require('crypto')
const keygen = filename => crypto.randomBytes(8).toString('hex')+'-'+filename
const S3 = new AWS.S3({ apiVersion: '2006-03-01', ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT }) })
const s3Params = key => ({ Bucket: process.env.S3_BUCKET_NAME, Key: key })

const removeId = data => { if (data) delete data._id; return data }
const transformId = data => { if (data) data.id = data._id.toString(); return removeId(data) }
const getRawAdvert = id => adverts(findOne({ _id: objectId(id) }))
const patchAdvert = (id, data) => adverts(updateOne({ _id: objectId(id) }, { $set: data }))

module.exports = {
  timestamp: value => Math.round((value.getTime ? value.getTime() : value) / 1000),

  ensureAdvertsIndex: () => adverts(createIndex({ text: 'text' }, { default_language: 'french' })),
  createAdvert: params => adverts(insertOne(params)).then(transformId),
  getAdverts: async (from, contains) => {
    const limAdverts = await adverts(get({
      ...(from && { creation_date: { $lte: new Date(from) } }),
      ...(contains && { text: { $regex: contains, $options: 'i' } })
    }, +process.env.NB_ADVERTS_MAX))
    return limAdverts.map(transformId)
  },
  getAdvert: id => getRawAdvert(id).then(advert => advert && transformId(advert)),
  patchAdvert,
  deleteAdvert: async id => {
    await adverts(deleteOne({ _id: objectId(id) }))
    // TODO: delete corresponding photo resources
  },
  getNbAdverts: () => adverts(count),

  getAdvertPhotos: async id => {
    const advert = await getRawAdvert(id)
    // Get all advert photos except the one used as thumbnail
    const advPhotos = await photos(find({ advert_id: id, key: { $ne: advert.thumbnail } }))
    return advPhotos.map(removeId)
  },
  uploadPhoto: async (filename, advertId, data, isThumbnail) => {
    const key = keygen(filename) // Create unique key from filename
    await S3.putObject({ ...s3Params(key), Body: data }).promise() // Upload image to S3    
    const photo = removeId(await photos(insertOne({ key, advert_id: advertId }))) // Create metadata in mongo
    if (isThumbnail) await patchAdvert(advertId, { thumbnail: photo.key }) // Patch advert if image is new thumbnail
    return photo
  },

  getPhotos: () => photos(getAll(+process.env.NB_PHOTOS_MAX)),
  getPhoto: key => photos(findOne({ key })).then(removeId),
  getPhotoStream: key => Promise.resolve(S3.getObject(s3Params(key)).createReadStream()),
  deletePhoto: async key => {
    await S3.deleteObject(s3Params(key)).promise()
    await photos(deleteOne({ key }))
  },
  getNbPhotos: () => photos(count),

  createUser: (email, passhash) => users(insertOne({ email, passhash })),
  getUsers: () => users(getAll(+process.env.NB_USERS_MAX)),
  getUserByEmail: email => users(findOne({ email })).then(removeId),
  getUserAdverts: email => adverts(get({ from: { $eq: email } }, +process.env.NB_ADVERTS_MAX)).then(map(transformId)),
  patchUser: (email, data) => users(updateOne({ email }, { $set: data })),
  deleteUser: email => users(deleteOne({ email })),
  getNbUsers: () => users(count)
}