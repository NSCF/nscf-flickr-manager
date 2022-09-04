//gets an inventory of images from flickr and 
import fs from 'fs'
import flickr from './flickrClient.js'
import getPhotoset from './getPhotosetID.js'


const getInventoryFromFlickr = async (albumTitle, writeToFile = false) => {

  let photoset_id
  try {
    let photoset = await getPhotoset(albumTitle)
    photoset_id = photoset.id
  }
  catch(err) {
    console.log(err.message)
    console.log('Exiting...')
    process.exit()
  }

  let page = 1
  const list = {} //keys are image titles, values are arrays of flickr image IDs
  
  let res = await flickr.photosets.getPhotos({ user_id: process.env.FLICKR_USERID, photoset_id, page })
  for (const photo of res.body.photoset.photo) { //terrible property naming here...
    if(list[photo.title]) {
      list[photo.title].push(photo.id)
    }
    else {
      list[photo.title] = [photo.id]
    }
  }

  page++
  
  while (res.body.photoset.pages >= page) {
    res = await flickr.photosets.getPhotos({ user_id: process.env.FLICKR_USERID, photoset_id, page })
    for (const photo of res.body.photoset.photo) { //terrible property naming here...
      if(list[photo.title]) {
        list[photo.title].push(photo.id)
      }
      else {
        list[photo.title] = [photo.id]
      }
    }
  
    page++
  }

  return list
}

export default getInventoryFromFlickr