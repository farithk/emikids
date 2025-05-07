const admin = require('firebase-admin'); // O 'import * as admin from 'firebase-admin';' con ES modules
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  // apiKey: process.env.FIREBASE_API_KEY,
  // authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  // projectId: process.env.FIREBASE_PROJECT_ID,
  // storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  // messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  // appId: process.env.FIREBASE_APP_ID
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'emikids-cd4b2.firebasestorage.app',
});
console.log('Firebase Admin SDK inicializado correctamente.');


const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket();

module.exports = { db, bucket, admin };
