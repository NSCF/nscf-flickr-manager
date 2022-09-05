//remove images in an album that are not types or reference specimens
//you may have to run this a few times to get all the images removed, it seems sometimes one or two have an error

import flickr from "./flickrClient.js";


console.log('Finding non-type/reference specimen images...')
let toRemove = {}
let page = 1
let res = await flickr.photos.search({
  user_id: process.env.FLICKR_USERID,
  tags: '-type,-reference', //the dashes are to negate the tag
  tag_mode: 'all', //we need this otherwise it returns everything
  page
})

for (const photo of res.body.photos.photo) {
  toRemove[photo.id] = photo.title
}

page++

while (res.body.photos.pages >= page) {
  res = await flickr.photos.search({
    user_id: process.env.FLICKR_USERID,
    tags: '-type,-reference', //the dashes are to negate the tag
    tag_mode: 'all', //we need this otherwise it returns everything
    page
  })

  for (const photo of res.body.photos.photo) {
    toRemove[photo.id] = photo.title
  }

  page++
}

if (Object.keys(toRemove).length == 0) {
  console.log('There are no images of non-type/reference specimens to remove')
  console.log('Bye...')
  process.exit()
}

console.log('There are', Object.keys(toRemove).length, 'non-type/reference specimen images to remove, which may take a few minutes...')
let errors = []
for (let [photo_id, title] of Object.entries(toRemove)) {
  try {
    await flickr.photos.delete({ photo_id })
  }
  catch(err) {
    errors.push(title)
  }
}

if (errors.length > 0) {
  console.log(errors.length, 'images could not be removed:')
  console.log(error.join('|'))
}
else {
  console.log('all images successfully removed...')
}

console.log('Bye...')



