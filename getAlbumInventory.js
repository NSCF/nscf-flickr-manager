//gets an inventory of images from flickr and 
import fs from 'fs'
import flickr from './flickrClient.js'
import getPhotosets from './getPhotosets.js'


const getInventoryFromFlickr = async (albumTitle, writeToFile = false) => {

  if(!albumTitle || !albumTitle.trim || !albumTitle.trim()){
    throw new Error('getInventory needs an album title')
  }

  //tidy up the album title, just in case
  albumTitle = albumTitle.replace(/\s+/, ' ').trim()

  const photosets = await getPhotosets()

  const matchingPhotoset = photosets.filter(x => x.title._content.toLowerCase() == albumTitle.toLowerCase())

  if (matchingPhotoset.length == 0) {
    console.log('There is no album with title', albumTitle)
    console.log('Exiting...')
    process.exit() //kill it...
  }

  if(matchingPhotoset.length > 1) {
    console.log('There is more than one album with title', albumTitle)
    console.log('Please update albumns to have unique titles in Flickr...')
    console.log('Exiting...')
    process.exit() //kill it...
  }

  const photoset_id = matchingPhotoset[0].id

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

  //for testing
  let totalCount = Object.values(list).reduce((prev, curr) => prev += curr.length, 0)

  if(writeToFile) {
    const json = JSON.stringify(list)
    let now = new Date().toISOString()
    now = now.split('.')[0].replace(/-/g,'').replace('T', '').replace(/:/g, '')
    const filename = 'inventory_' + albumTitle.replace(/\s+/g, '') + '_' + now + '.json'
    fs.writeFileSync(filename, json)
    console.log('file successfully written, see', filename)
    return
  }
  else {
    return list
  }
}

export default getInventoryFromFlickr