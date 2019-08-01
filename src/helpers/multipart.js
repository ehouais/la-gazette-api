const Busboy = require('busboy')

module.exports = request => new Promise((resolve, reject) => {
  const busboy = new Busboy({ headers: request.headers })
  const data = { fields: [], files: [] }

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    const bufs = []
    file.on('data', data => { bufs.push(data) })
    file.on('end', () => { data.files.push({ name: filename, buffer: Buffer.concat(bufs) }) })
  })
  busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
    data.fields[fieldname] = val
  })
  busboy.on('finish', () => { resolve(data) })

  request.pipe(busboy)
})
