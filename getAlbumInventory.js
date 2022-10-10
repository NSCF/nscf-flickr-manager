//gets an inventory of images from flickr and 
import flickr from './flickrClient.js'
import getPhotoset from './getPhotoset.js'

const getInventoryFromFlickr = async (albumTitle) => {

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
  
  do {
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
    
  } while (page < res.body.photoset.pages)

  return list

}

export default getInventoryFromFlickr