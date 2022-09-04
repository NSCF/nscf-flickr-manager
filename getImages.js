import fs from 'fs'
import * as dotenv from 'dotenv'

dotenv.config()

flickr.photos.search({
  user_id
}).then(response => {
  console.log(response.body.photos.photo.length, 'photos returned')
  //we have response.body.photos.photo which is the array of images. Each has id and title properties
  //also response.body.photos.page and response.body.photos.pages for managing pagination
}).catch(err => {
  console.error(err)
})