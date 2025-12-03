// Replace the placeholder values below with your Firebase Web app's config.
// To get these values: go to Firebase Console -> Project Settings -> General -> Your apps -> SDK setup and configuration
// Keep this file local and do NOT commit real keys to public repos if you don't want them public.

export const firebaseConfig = {
  apiKey: "AIzaSyAH4xqnFtnRwAzcRCKNWewce2sVf5kmCQg",
  authDomain: "i-stem-comms.firebaseapp.com",
  projectId: "i-stem-comms",
  storageBucket: "i-stem-comms.firebasestorage.app",
  messagingSenderId: "609185253106",
  appId: "1:609185253106:web:5d11c0bf82bb556531b26b"
};

// Example Firestore structure expected:
// Collection: `announcements` documents with fields: title (string), date (timestamp or ISO string), body (string), pinned (boolean)
// Collection: `resources` documents with fields: title (string), type (string), description (string), link (string)
