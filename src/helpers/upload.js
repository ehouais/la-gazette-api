const Busboy = require('busboy')

module.exports = request => new Promise((resolve, reject) => {
  var busboy = new Busboy({ headers: request.headers })
  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    const bufs = []
    file.on('data', data => { bufs.push(data) })
    file.on('end', () => { resolve({ filename, buffer: Buffer.concat(bufs) }) })
  })
  request.pipe(busboy)
})
