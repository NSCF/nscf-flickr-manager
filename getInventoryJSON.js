import fs from 'fs'
import getInventoryFromFlickr from "./getAlbumInventory.js";

let album = 'PRE Vascular Plant Types'
console.log('Getting list of images from', album)
let result = await getInventoryFromFlickr(album, true)

const json = JSON.stringify(result)
let now = new Date().toISOString()
now = now.split('.')[0].replace(/-/g,'').replace('T', '').replace(/:/g, '')
const filename = './inventories/inventory_' + album.replace(/\s+/g, '') + '_' + now + '.json'
fs.writeFileSync(filename, json)
console.log('file successfully written, see', filename)
