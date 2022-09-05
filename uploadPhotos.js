//upload images to an album in Flickr

import fs from 'fs'
import path from 'path'
import exiftool from 'node-exiftool'
import uploadPhoto from "./__uploadPhoto.js";
import getPhotoset from './getPhotosetID.js';
import getInventoryFromFlickr from './getAlbumInventory.js';

const filePath = String.raw`G:\PRE\JPEG`
const filetype = '.jpg'
const album = 'PRE Vascular Plant Types'
let sensitiveTag = '' //TODO update this when we get sensitive taxa
const albumInventoryFile = '' // 'inventory_PREVascularPlantTypes_20220904141326.json' //switched off for testing
const batchSize = 50 //the number of images to upload per batch

//SCRIPT

//process.env.NODE_NO_WARNINGS = 1 //to avoid the warnings about buffers from the flickr client

//first read the directory and get all the relevant files
console.log('reading file directory...')
let files = fs.readdirSync(filePath)
files = files.filter(file => file.endsWith(filetype))

if(files.length == 0) {
  console.log('No files found in', filePath, 'with extention', filetype)
  process.exit()
}

//get the photoset details
console.log('getting the album details...')
let photosetID
let photosetCount
try {
  let photoset = await getPhotoset(album)
  photosetID = photoset.id
  photosetCount =  photoset.photos
} 
catch(err) {
  console.log(err.message)
  process.exit()
}

console.log('getting the album inventory')
let inventory
if (albumInventoryFile) {
  if(fs.existsSync(albumInventoryFile)) {
    let file = fs.readFileSync(albumInventoryFile)
    let json = file.toString()
    inventory = JSON.parse(json)

    //confirm it matches what Flickr says it should have...
    let totalImages = Object.values(inventory).reduce((prev, curr) => prev += curr.length, 0)
    if (totalImages != photosetCount) {
      console.log('It looks like the album inventory file is out of date, please update `getInventoryJSON` and then start again')
      process.exit()
    }
  }
}

if(!inventory) {
  console.log('fetching inventory of', album, 'from Flickr...')
  inventory = await getInventoryFromFlickr(album, false)
}

//Check if there are any that need to be uploaded...
const toUpload = []
for (const file of files) {
  let re = new RegExp(filetype + '$')
  let inInventory = file.replace(re, '').trim() in inventory
  if(!inInventory) {
    toUpload.push(file)
  }
}

if(toUpload.length == 0) {
  console.log('All files in', filePath, 'with extention', filetype, 'are already uploaded to Flickr')
  process.exit()
}
else {
  console.log('There are', toUpload.length, 'files to be uploaded...')
}

//if we need to mark files as sensitive we need exiftool again
let ep
if(sensitiveTag && sensitiveTag.trim()) {
  console.log('starting exiftool...')
  sensitiveTag = sensitiveTag.trim()
  ep = new exiftool.ExiftoolProcess()
  try {
    await ep.open() //this takes sometime
  }
  catch(err) {
    console.log('There was a problem starting exiftool, please make sure it is installed and available on your PATH')
    process.exit()
  }
}

//upload files ten at a time
console.log('starting file uploads...')
let startIndex = 0
let totalTime = 0
let totalImages = 0

while (startIndex < toUpload.length){
  let images = toUpload.slice(startIndex, startIndex + batchSize)
  let proms = []
  for (const image of images) {
    const file = path.join(filePath, image)

    let is_public = false //TODO update this when we get sensitive taxa...
    if(sensitiveTag) {
      let meta = await ep.readMetadata(file, ['subject'])
      let fileKeywords = meta.data[0].Subject
      if(sensitiveTag in fileKeywords) {
        is_public = false
      }
    }

    let uploadProm = uploadPhoto(file, photosetID, is_public)
    proms.push(uploadProm)

  }

  let time = process.hrtime()
  await Promise.all(proms)

  time = process.hrtime(time)
  let seconds = time[0]
  totalTime += seconds
  totalImages += images.length
  let date = new Date(0);
  date.setSeconds(totalTime); // specify value for SECONDS here
  let timeString = date.toISOString().substring(11, 19);
  if(process.stdout.clearLine){ //it's not in the vs code debugger
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${totalImages} uploaded in ${timeString}`);
  }
  else {
    console.log(totalImages, 'uploaded in', timeString)
  }
  

  startIndex += batchSize

}

if (ep) {
  console.log('shutting down exiftool...')
  await ep.close()
}

console.log('all done')