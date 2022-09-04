import fs from 'fs'
import https from 'https'
import express from 'express'
const app = express()
const port = 3000

app.get('/*', (req, res) => {
  if (req.query.oauth_token && req.query.oauth_verifier) {

    const oauth_verifier = req.query.oauth_verifier

    res.end('authentication updated')
    if (process.send) {
      process.send(oauth_verifier)
      process.exit() //shut down the server
    }
  }
  else {
    res.end('error')
  }
})

https.createServer({
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
}, app)
.listen(port, _ => {
  if (process.send) {
    process.send('ready')
  }
  else {
    console.log('server running on port', port)
  }
})