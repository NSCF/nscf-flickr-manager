
import fs from 'fs'
import flickr from "./flickrClient.js";
import getInventoryFromFlickr from './getAlbumInventory.js';

const filePath = String.raw`C:\temp\Herbarium mass digitization project\ImageTaggingExperiments\JPEG`
const fileext = '.jpg'
const album = 'PRE Vascular Plant Types'

console.log('getting the album inventory')
const inventory = await getInventoryFromFlickr(album, false)

//get the list of files from the directory
let files = fs.readdirSync(filePath)

if(files.length == 0) {
  console.log('No files found in', filePath, 'with extention', fileext)
  process.exit()
}

const toRemove = []
for (const file of files) {
  let re = new RegExp(fileext + '$')
  let imagename = file.replace(re, '').trim()
  let inInventory = imagename in inventory
  if(inInventory) {
    toRemove.push(imagename)
  }
}

if(toRemove.length == 0) {
  console.log('The files in', filePath, 'with extention', fileext, 'were not found in', album)
  process.exit()
}
else {
  console.log('There are', toRemove.length, 'files to be to be removed from', album)
}

let idsToRemove = []
for (const image of toRemove){
  const imageIDs = inventory[image]
  idsToRemove = [...idsToRemove, ...imageIDs]
}

console.log('starting to remove images...')
for (const photo_id of idsToRemove) {
  await flickr.photos.delete({ photo_id })
}

console.log('all done...')

