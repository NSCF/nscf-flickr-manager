import Flickr from 'flickr-sdk';
import flickr from './flickrClient.js';
import * as dotenv from 'dotenv'
dotenv.config()

//remember we need dotenv somewhere before this happens...
const auth = Flickr.OAuth.createPlugin(
  process.env.FLICKR_API_KEY,
  process.env.FLICKR_SECRET,
  process.env.FLICKR_OAUTH_TOKEN,
  process.env.FLICKR_OAUTH_SECRET
)

const uploadPhoto = async (file, photoset_id, is_public, license_id = 4) => { //license id 4 is CC BY 

  let is_friend, is_family
  if(is_public) {
    is_public = 1
    is_friend = 0
    is_family = 0
  }
  else {
    is_public = 0
    is_friend = 1
    is_family = 0
  }

  const upload = new Flickr.Upload(auth, file, {
    is_public,
    is_friend,
    is_family,
  })

  let photo_id
  try {
    const response = await upload
    photo_id = response.body.photoid._content
  }
  catch(err) {
    console.log(err)
    return {
      result: 'error',
      error: err
    }
  }

  let error = false
  let errors = []

  //add the license
  try {
    await flickr.photos.licenses.setLicense({ photo_id, license_id })
  }
  catch(err) {
    err = true
    errors.push(err)
  }
  

  //and add it to the relevant album
  try {
    await flickr.photosets.addPhoto({ photoset_id, photo_id })
  }
  catch(err) {
    err = true
    errors.push(err)
  }

  if(error) {
    return {
      result: 'error',
      error: errors
    }
  }
  
  return {
    result: 'success'
  }

}

export default uploadPhoto