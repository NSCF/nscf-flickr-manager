import admin from 'firebase-admin'
import { initializeApp } from 'firebase-admin/app';
import serviceAccount from './firebasekey.js'

initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://nscf-flickr-manager-default-rtdb.europe-west1.firebasedatabase.app/'
})

let db = admin.database()

export default db
