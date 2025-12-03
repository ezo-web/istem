// Replace the placeholder values below with your Firebase Web app's config.
// To get these values: go to Firebase Console -> Project Settings -> General -> Your apps -> SDK setup and configuration
// Keep this file local and do NOT commit real keys to public repos if you don't want them public.

export const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT.appspot.com",
  messagingSenderId: "REPLACE_WITH_SENDER_ID",
  appId: "REPLACE_WITH_APP_ID"
};

// Example Firestore structure expected:
// Collection: `announcements` documents with fields: title (string), date (timestamp or ISO string), body (string), pinned (boolean)
// Collection: `resources` documents with fields: title (string), type (string), description (string), link (string)
