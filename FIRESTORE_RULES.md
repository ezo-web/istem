# Firestore Security Rules

Your site needs Firestore rules that allow:
- **Public read** access to announcements and resources
- **Write access** for admin users

Since you're using client-side admin authentication (local UIDs), the challenge is that Firestore doesn't know who the admin is. Here are your options:

## Option 1: Simple (Not Recommended for Production)

This allows anyone to write to announcements/resources. Use only for testing or if you trust your users.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /announcements/{document=**} {
      allow read: if true;
      allow write: if true;  // WARNING: Anyone can write
    }
    match /resources/{document=**} {
      allow read: if true;
      allow write: if true;  // WARNING: Anyone can write
    }
  }
}
```

## Option 2: Better (Recommended)

Use Firebase Authentication + Custom Claims. This requires:
1. Setting up Firebase Authentication (Google Sign-In or email/password)
2. Assigning custom claims to admin users (via Firebase Console or backend)
3. Checking those claims in Firestore rules

Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /announcements/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /resources/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

Then in your app, change from client-side local admin validation to Firebase Auth with custom claims.

## Option 3: Backend Validation (Most Secure)

Create a simple backend API that:
1. Validates the admin UID/password
2. Issues a short-lived JWT token
3. Firestore rules validate the token before allowing writes

This requires server setup but is the most secure.

## Recommended for Now

Use **Option 1** for testing/development. To enable it:

1. Go to Firebase Console → Firestore Database → Rules
2. Replace the current rules with the code above (Option 1)
3. Click "Publish"

Then test the admin create announcements/resources in your app.

For production, move to Option 2 or 3.
