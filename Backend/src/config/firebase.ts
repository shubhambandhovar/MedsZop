import admin from 'firebase-admin';

// Initialize Firebase Admin using application default credentials.
// On Render, set GOOGLE_APPLICATION_CREDENTIALS to the path of the service account JSON file.
// Alternatively, mount credentials via environment variables.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export default admin;