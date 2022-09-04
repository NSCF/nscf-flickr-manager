import getInventoryFromFlickr from "./getAlbumInventory.js";

let album = 'PRE Vascular Plant Types'
console.log('Getting list of images from', album)
let result = await getInventoryFromFlickr(album, true)