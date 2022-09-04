import fs from 'fs'
import { EOL } from 'os'
import { fork } from 'child_process'
import * as dotenv from 'dotenv'
import Flickr from 'flickr-sdk'
import open from 'open'
dotenv.config()

const oauth = new Flickr.OAuth(
  process.env.FLICKR_API_KEY,
  process.env.FLICKR_SECRET
);

const oauth_response = await oauth.request('https://localhost:3000/oauth/callback')

const oauth_key=oauth_response.body.oauth_token
const oauth_secret=oauth_response.body.oauth_token_secret

console.log('Please authorise access to Flickr in your browser, and await confirmation')

//get the URL, open the browser, start the server and wait for response from flicker...
// see https://www.digitalocean.com/community/tutorials/how-to-launch-child-processes-in-node-js
const authURL = oauth.authorizeUrl(oauth_key, 'delete')

const server = fork('server.js')

server.on('message', async message => {
  if (message == 'ready') {
    await open(authURL)
  }
  else { //it's the token...
    const oauth_verifier = message

    const verify_res = await oauth.verify(oauth_key, oauth_verifier, oauth_secret)
    const new_oauth_key = verify_res.body.oauth_token
    const new_oauth_secret = verify_res.body.oauth_token_secret

    const file = fs.readFileSync('.env')
    const text = file.toString()

    const key_re = new RegExp('FLICKR_OAUTH_TOKEN=.*(' + EOL + ')?')
    let newText = text.replace(key_re, 'FLICKR_OAUTH_TOKEN=' + new_oauth_key + EOL)

    const secret_re = new RegExp('FLICKR_OAUTH_SECRET=.*(' + EOL + ')?')
    newText = newText.replace(secret_re, 'FLICKR_OAUTH_SECRET=' + new_oauth_secret + EOL)

    const eol_re = new RegExp(EOL + '$')
    newText = newText.replace(eol_re, '')

    fs.writeFileSync('.env', newText)

    console.log('Authentication details successfully updated, you may proceed...')
    process.exit()
  }
})