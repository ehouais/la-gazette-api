const { resourceMW } = require('../helpers/express-rest')
const { tokenUri, userUri } = require('../routes')

module.exports = {
  confirm: resourceMW({
    get: [
      (request, response) => {
        response.send(`<form><input name="password" type="password"/><input type="submit" value="Envoyer"/></form>
<script>
  const token = ${request.params.token}
  const headers = { ${process.env.TOKEN_HEADER}: token }
  const response1 = await fetch('${tokenUri(token)}')
  const response2 = await fetch('${userUri(response1.email)}')
  document.getElementById('form').addEvenListener('submit', e => {
    if (response2.status == 404) {
      fetch('${usersUri()}', { method: 'POST', data: { email, password }, headers})
    } else {
      fetch('${userUri(response1.email)}', { method: 'PATCH', data: { password }, headers})
    }
    e.preventDefault()
  })
</script>`)
      }
    ]
  })
}