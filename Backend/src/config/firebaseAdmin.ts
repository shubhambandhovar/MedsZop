import admin from 'firebase-admin';

// Initialize Firebase Admin using service account JSON passed via env var
// FIREBASE_SERVICE_ACCOUNT should contain the full JSON string
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount as admin.ServiceAccount)
      : admin.credential.applicationDefault(),
  });
}

export default admin;
