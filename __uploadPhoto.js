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
  const upload = new Flickr.Upload(auth, file)
  let photo_id
  try {
    const response = await upload
    photo_id = response.body.photoid._content
  }
  catch(err) {
    throw err
  }

  if(is_public) {
    await flickr.photos.setPerms({photo_id,  is_public: 1, is_friend: 0, is_family: 0 })
  }
  else {
    await flickr.photos.setPerms({photo_id,  is_public: 0, is_friend: 1, is_family: 0  })
  }

  //add the license
  await flickr.photos.licenses.setLicense({ photo_id, license_id })

  //and add it to the relevant album
  await flickr.photosets.addPhoto({ photoset_id, photo_id })

  return

}

export default uploadPhoto