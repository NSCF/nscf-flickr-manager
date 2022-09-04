import Flickr from 'flickr-sdk'
import * as dotenv from 'dotenv'
dotenv.config()

const flickr = new Flickr(Flickr.OAuth.createPlugin(
  process.env.FLICKR_API_KEY,
  process.env.FLICKR_SECRET,
  process.env.FLICKR_OAUTH_TOKEN,
  process.env.FLICKR_OAUTH_SECRET
));

export default flickr
