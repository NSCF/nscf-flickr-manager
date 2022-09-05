import getPhotosets from "./getPhotosets.js";

const getPhotoset = async albumTitle => {
  
  if(!albumTitle || !albumTitle.trim || !albumTitle.trim()){
    throw new Error('getInventory needs an album title')
  }

  //tidy up the album title, just in case
  albumTitle = albumTitle.replace(/\s+/, ' ').trim()

  const photosets = await getPhotosets()

  const matchingPhotoset = photosets.filter(x => x.title._content.toLowerCase() == albumTitle.toLowerCase())

  if (matchingPhotoset.length == 0) {
    throw new Error('There is no album with title ' + albumTitle)
  }

  if(matchingPhotoset.length > 1) {
    throw new Error('There is more than one album with title ' + albumTitle + '. Please update albumns to have unique titles in Flickr...')
  }

  return matchingPhotoset[0]
 
}

export default getPhotoset
