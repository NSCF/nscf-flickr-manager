import fs from 'fs'
import { EOL } from 'os'
import { fork } from 'child_process'
import * as dotenv from 'dotenv'
import Flickr from 'flickr-sdk'
import open from 'open'
dotenv.config()

const user_id = process.env.FLICKR_USERID

const flickr = new Flickr(process.env.FLICKR_API_KEY);
const oauth = new Flickr.OAuth(
  process.env.FLICKR_API_KEY,
  process.env.FLICKR_SECRET
);

const oauth_response = await oauth.request('https://localhost:3000/oauth/callback')

//TODO get the values from the response here
const oauth_key=oauth_response.body.oauth_token
const auth_secret=oauth_response.body.oauth_token_secret

const file = fs.readFileSync('.env')
const text = file.toString()

const key_re = new RegExp('FLICKR_OAUTH_TOKEN=.*(' + EOL + ')?')
let newText = text.replace(key_re, 'FLICKR_OAUTH_TOKEN=' + oauth_key + EOL)

const secret_re = new RegExp('FLICKR_OAUTH_SECRET=.*(' + EOL + ')?')
newText = newText.replace(secret_re, 'FLICKR_OAUTH_SECRET=' + auth_secret + EOL)

const eol_re = new RegExp(EOL + '$')
newText = newText.replace(eol_re, '')

fs.writeFileSync('.env', newText)

console.log('Please authorise access to Flickr in your browser, and await confirmation')

//get the URL, open the browser, start the server and wait for response from flicker...
// see https://www.digitalocean.com/community/tutorials/how-to-launch-child-processes-in-node-js
const authURL = oauth.authorizeUrl(oauth_key, 'delete')

const server = fork('server.js')

server.on('message', async message => {
  if (message == 'ready') {
    await open(authURL)
  }

  if (message == 'done') {
    console.log('Authentication details successfully updated, you may proceed...')
    process.exit()
  }
})