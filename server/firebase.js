const admin = require('firebase-admin');

const serviceAccount = require('./nexochat-grupo-eae53-firebase-adminsdk-fbsvc-9cd4e6c1ba');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { db };