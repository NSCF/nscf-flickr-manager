import flickr from './flickrClient.js'

const getInventoryFromFlickr = async _ => {
  let page = 1
  const list = {} //keys are image titles, values are arrays of flickr image IDs
  
  let res = await flickr.photos.search({   user_id: process.env.FLICKR_USERID, page })
  for (const photo of res.body.photos.photo) { //terrible property naming here...
    if(list[photo.title]) {
      list[photo.title].push(photo.id)
    }
    else {
      list[photo.title] = [photo.id]
    }
  }

  page++
  
  while (res.body.photos.pages >= page) {
    res = await flickr.photos.search({   user_id: process.env.FLICKR_USERID, page })
    for (const photo of res.body.photos.photo) { //terrible property naming here...
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