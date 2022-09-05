//upload images to an album in Flickr

import fs from 'fs'
import path from 'path'
import { EOL } from 'os';
import exiftool from 'node-exiftool'
import uploadPhoto from "./__uploadPhoto.js";
import getPhotoset from './getPhotoset.js';
import getInventoryFromFlickr from './getAlbumInventory.js';

//SETTINGS

///where to get the images...
const filePath = String.raw`C:\temp\Herbarium mass digitization project\ImageTaggingExperiments\JPEG`
const filetype = '.jpg'

//do we want to upload images listed in a file (these will be filtered from the above filePath)
const targetImagesFilePath = filePath
const targetImagesFile = 'alltypes_20220905.txt'

const typesOnly = true //types and reference specimens only? At the moment this should always be true
const typeTags = ['type', 'reference'] //for working with typesOnly
const album = 'PRE Vascular Plant Types' //where to load the images...
let sensitiveTag = '' //TODO update this when we get sensitive taxa
const albumInventoryFile = '' // 'inventory_PREVascularPlantTypes_20220904141326.json' //switched off for testing
const batchSize = 10 //the number of images to upload per batch

//SCRIPT

//first read the directory and get all the relevant files
console.log('reading file directory...')
let files = fs.readdirSync(filePath)
files = files.filter(file => file.endsWith(filetype))

if(files.length == 0) {
  console.log('No files found in', filePath, 'with extention', filetype)
  process.exit()
}

//if we have a targetImages file...
if(targetImagesFilePath && targetImagesFile) {
  const fullPath = path.join(targetImagesFilePath, targetImagesFile)
  if(fs.existsSync(fullPath)) {
    let file = fs.readFileSync(fullPath)
    let filetext = file.toString()
    let filenames = filetext.split(EOL)
    if (filenames.length == 0) {
      console.log(targetImagesFile, 'does not contain any data, please fix it or change the settings here...')
      console.log('Exiting...')
      process.exit()
    }
    else {
      //filter target files using the files from the text file
      files = files.filter(x => filenames.includes(x))
      if (files.length == 0) {
        console.log('There are no files in the directory that match file names in', targetImagesFile)
        console.log('Exiting...')
        process.exit()
      }
    }
  }
  else {
    console.log(targetImagesFile, 'does not exist, please create it or fix the settings here...')
    console.log('Exiting...')
    process.exit()
  }
}

//if we are only loading types or mark files as sensitive we need exiftool again
let ep
if(typesOnly || (sensitiveTag && sensitiveTag.trim())) {
  console.log('starting exiftool...')
  sensitiveTag = sensitiveTag.trim() //this is just cleaning
  ep = new exiftool.ExiftoolProcess()
  try {
    await ep.open() //this takes sometime
  }
  catch(err) {
    console.log('There was a problem starting exiftool, please make sure it is installed and available on your PATH')
    process.exit()
  }
}

//if not types filter out any that are not 
const sensitiveIndex = new Set() //we need this because we don't want to read tags twice
if(typesOnly){
  console.log('Checking which images are of types or reference specimens...')
  const typeFiles = []
  for (const filename of files) {
    const file = path.join(filePath, filename)
    let meta = await ep.readMetadata(file, ['subject'])
    let fileKeywords = meta.data[0].Subject
    
    let hasTypeTags = fileKeywords.some(x => typeTags.includes(x))
    if (hasTypeTags) {
      typeFiles.push(filename)    
    }

    if (sensitiveTag in fileKeywords) {
      sensitiveIndex.add(filename)
    }
  }

  if(typeFiles.length == 0) {
    console.log('There are no images tagged as types/reference specimens in the image directory')
    console.log('Exiting...')
    process.exit()
  }

  files = typeFiles
}

//we now have the list of files to upload, and if we are tagging types only, we have a set of the sensitive species filenames

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



//upload files ten at a time
console.log('starting file uploads...')
let startIndex = 0
let totalTime = 0
let totalImages = 0
const uploadErrors = []

while (startIndex < toUpload.length){
  let images = toUpload.slice(startIndex, startIndex + batchSize)
  let proms = []
  for (const image of images) {
    const file = path.join(filePath, image)

    let is_public = false //TODO update this when we get sensitive taxa...
    if(sensitiveTag) {
      if (!typesOnly) { //we created an index of sensitive images already if it is typesonly
        let meta = await ep.readMetadata(file, ['subject'])
        let fileKeywords = meta.data[0].Subject
        if(sensitiveTag in fileKeywords) {
          is_public = false
        }
      }
      else {
        if (sensitiveIndex.has(image)) {
          is_public = false
        }
      }
    }

    let uploadProm = uploadPhoto(file, photosetID, is_public)
    proms.push(uploadProm)

  }

  let time = process.hrtime()
  const results = await Promise.all(proms)

  //if they're all errors then there's something wrong
  //the errors would have been printed by uploadPhoto
  if (results.every(x => x.result == 'error')) {
    console.log('it appears something went wrong...')
    process.exit()
  }

  //find any errors
  for (const [index, result] of results.entries()) {
    if(result.result == 'error') {
      uploadErrors.push(images[index])
    }
  }

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

if(process.stdout.clearLine) {
  process.stdout.write(EOL)
}

if (uploadErrors.length > 0) {
  console.log('There were errors uploading the following files. Please check them on Flickr as they may have uploaded but might not have the right permissions or be included in the right album.')
  console.log('They can be updated automatically if they have appropriate tags using updateImagesNotInAlbum.js')
  console.log(uploadErrors.join('|'))
}

if (ep) {
  console.log('shutting down exiftool...')
  await ep.close()
}

console.log('all done')