import flickr from "./flickrClient.js";
import albumIndex from './albumIndex.js'
import getPhotoset from './getPhotoset.js'

//SETTINGS
const collectionAbbreviations = ['PRE', 'NBG', 'NH']
let sensitiveTag = 'sensitive'
const license_id = 4 //CC BY 4.0

//SCRIPT

//get all the photos not uploaded
console.log('getting images not in an album...')
let notInAlbum = [] //a list of photoIDs
let page = 1
let res = await flickr.photos.getNotInSet({ page })
let ids =  res.body.photos.photo.map(x=> x.id)
notInAlbum = [...notInAlbum, ...ids]
page++

while(res.body.photos.pages >= page){
  res = await flickr.photos.getNotInSet({ page })
  ids =  res.body.photos.photo.map(x=> x.id)
  notInAlbum = [...notInAlbum, ...ids]
  page++
}

if (notInAlbum.length == 0) {
  console.log('There are no images not currently in an album...')
  console.log('Bye...')
  process.exit()
}

console.log('There are', notInAlbum.length, 'images not currently in an album...')

//we have all the ids, now we need their tags...
console.log('Starting updates, this might take a few minutes...')
const albumIDsPerAbbreviation = {}
const abbrevNotFound = [] //there is no tag to indicate the collection
const multipleAbbrevs = [] //there's more than one collection abbreviation
const abbrevNoAlbum = []
for (const photo_id of notInAlbum) {
  let infores = await flickr.photos.getInfo({ photo_id })
  let tags = infores.body.photo.tags.tag.map(x => x.raw)
  
  let abbrev = tags.filter(imageTag => collectionAbbreviations.includes(imageTag))
  let title = infores.body.photo.title._content
  if (abbrev.length == 0) { //we don't know what album to add it to
    abbrevNotFound.push(title)
  }
  
  if (abbrev.length > 1) { // we can't say which album it must go to
    multipleAbbrevs.push(title)
  }

  //we must have only one tag
  abbrev = abbrev[0]
  let photoset_id = null
  if(abbrev in albumIDsPerAbbreviation) {
    photoset_id = albumIDsPerAbbreviation[abbrev]
  }
  else if (abbrev in albumIndex) {
    let photoset
    try {
      photoset = await getPhotoset(albumIndex[abbrev])
      photoset_id = photoset.id
      albumIDsPerAbbreviation[abbrev] = photoset_id
    } 
    catch(err) {
      abbrevNoAlbum.push(title)
    }
  }

  let is_public = false //TODO update this to true when we have sensitive species and the code below will work
  if(sensitiveTag && sensitiveTag.trim()) {
    sensitiveTag = sensitiveTag.trim()
    if (tags.map(x => x.toLowerCase()).includes(sensitiveTag.toLowerCase())) {
      is_public = false
    }
  }

  //do the updates
  if(is_public) {
    await flickr.photos.setPerms({photo_id,  is_public: 1, is_friend: 0, is_family: 0 })
  }
  else {
    await flickr.photos.setPerms({photo_id,  is_public: 0, is_friend: 1, is_family: 0  })
  }

  //add the license
  await flickr.photos.licenses.setLicense({ photo_id, license_id })

  //and add it to the relevant album
  if (photoset_id) {
    await flickr.photosets.addPhoto({ photoset_id, photo_id })
  }
}

console.log('all updates completed...')
console.log()

if(abbrevNotFound.length > 0) {
  console.log('The following images did not have a recognized collection code and were not added to an album:')
  console.log(abbrevNotFound.join('|'))
  console.log()
}

if (multipleAbbrevs.length > 0) {
  console.log('The following images had more than one collection code and were not added to an album:')
  console.log(multipleAbbrevs.join('|'))
  console.log()
}

if(abbrevNoAlbum.length > 0) {
  console.log('The following images have a collection code but no matching album. Check albumIndex.js:')
  console.log(abbrevNoAlbum.join('|'))
  console.log()
}

console.log('all done...')