import flickr from "./flickrClient.js";
import getInventoryFromFlickr from "./getAlbumInventory.js";

const album = 'PRE Vascular Plant Types'


console.log('Fetching inventory from Flickr...')
let result = await getInventoryFromFlickr(album)

//how many files are duplicated?
const duplicated = []
let forDeletion = []
for (let [key, value] of Object.entries(result)) {
  if(value.length > 1){
    duplicated.push(key)
  }

  let theseForDeletion = value.slice(1)
  forDeletion = [...forDeletion, ...theseForDeletion]
}

if(duplicated.length == 0) {
  console.log('There are no duplicated images in', album)
  console.log('Bye...')
  process.exit()
}

console.log('There are', duplicated.length, 'duplicated images')
console.log(duplicated.join('|'))
console.log()
console.log('removing duplicates...')

const proms = []
for (const photo_id of forDeletion) {
  proms.push(flickr.photos.delete({photo_id}))
}

await Promise.all(proms)

console.log('duplicates successfully removed')
console.log('all done...')
