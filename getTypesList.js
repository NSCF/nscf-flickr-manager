//we might need to upload only types and reference specimens from a folder
//this generates a list that we can give to uploadPhotos.js

import { EOL } from 'os'
import path from 'path'
import fs from 'fs'
import exiftool from 'node-exiftool'

//SETTINGS
const filePath = String.raw`C:\temp\Herbarium mass digitization project\ImageTaggingExperiments\JPEG`
const filetype = '.jpg'
const tagsToFind = ['type', 'reference']

//SCRIPT

console.log('reading file directory...')
let files = fs.readdirSync(filePath)
files = files.filter(file => file.endsWith(filetype))

if(files.length == 0) {
  console.log('No files found in', filePath, 'with extention', filetype)
  process.exit()
}

console.log('starting exiftool...')
let ep = new exiftool.ExiftoolProcess()
try {
  await ep.open() //this takes sometime
}
catch(err) {
  console.log('There was a problem starting exiftool, please make sure it is installed and available on your PATH')
  process.exit()
}

console.log('finding type/reference specimen images, this may take some time...')
console.log()
const targetFiles = []
let counter = 0
let totalTime = 0
let time = process.hrtime()
for (const filename of files) {
  const file = path.join(filePath, filename)
  let meta = await ep.readMetadata(file, ['subject'])
  let fileTags = meta.data[0].Subject
  if(tagsToFind.some(x => fileTags.includes(x))) {
    targetFiles.push(filename)
  }

  counter++

  if (counter % 100 == 0) {

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
      process.stdout.write(`${counter} uploaded in ${timeString}`);
    }
    else {
      console.log(totalImages, 'uploaded in', timeString)
    }

    time = process.hrtime()
  }
}

if(process.stdout.clearLine){ //it's not in the vs code debugger
  process.stdout.write(EOL);
}

if (targetFiles.length) {
  console.log(targetFiles.length, 'type/reference specimen images found')
  console.log('writing to file...')
  let d = new Date().toISOString().split('T')[0].replace(/-/g, '')
  let filename = 'alltypes_' + d + '.txt'
  let filetext = targetFiles.join(EOL)
  let newFilePath = path.join(filePath, filename)
  fs.writeFileSync(newFilePath, filetext)
}
else {
  console.log('There were not type/reference specimen images found')
}

console.log('shutting down exiftool...')
await ep.close()

console.log('all done...')