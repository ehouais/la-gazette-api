const { advertUri, advertPhotosUri, userUri, userAdvertsUri, photoUri } = require('./routes')

// Temporary: DB date fields may be a timestamp or a date
// returns in both cases a timestamp in seconds since EPOCH
const timestamp = value => Math.round((value.getTime ? value.getTime() : value) / 1000)

const _formatAdvert = data => ({
  self: advertUri(data.id),
  text: data.text,
  ...(data.thumbnail && { thumbnail: photoUri(data.thumbnail) }),
  creation_date: timestamp(data.creation_date)
})
const _formatUser = data => ({
  self: userUri(data.email),
  firstname: data.firstname,
  lastname: data.lastname,
  email: data.email,
  avatar: data.avatar,
})

module.exports = {
  formatAdvert: data => ({
    ..._formatAdvert(data),
    from: userUri(data.from),
    photos: advertPhotosUri(data.id),
  }),
  formatAdverts: adverts => adverts.map(data => ({
    ..._formatAdvert(data),
    from: userUri(data.from),
  })),
  formatUserAdverts: adverts => adverts.map(_formatAdvert),
  formatUser: data => ({
    ..._formatUser(data),
    adverts: userAdvertsUri(data.email),
    creation_date: timestamp(data.creation_date)
  }),
  formatUsers: users => users.map(_formatUser),
  formatPhotos: photos => photos.map(photo => photoUri(photo.key))
}