module.exports = {
  log: (msg, err) => {
    console.log(msg)
    if (err) console.log(err.message, err.stack)
  }
}