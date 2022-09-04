import getPhotosets from "./getPhotosets.js";

let photosets = await getPhotosets()

for (const set of photosets) {
  console.log(set.title._content)
}