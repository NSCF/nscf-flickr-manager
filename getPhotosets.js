//prints a list of albums (called photosets in the API)
import flickr from './flickrClient.js'

const getPhotosets = async _ => {
  let response = await flickr.photosets.getList({ user_id: process.env.FLICKR_USERID })
  return response.body.photosets.photoset
}

export default getPhotosets

