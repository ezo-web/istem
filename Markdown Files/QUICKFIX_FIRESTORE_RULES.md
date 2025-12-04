# Quick Fix for "Missing or insufficient permissions" Error

Your Firestore security rules are currently blocking writes. Follow these steps to fix it:

## Step 1: Open Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Firestore Database** in the left menu
4. Click the **Rules** tab at the top

## Step 2: Replace the Rules

You should see existing rules (probably denying all writes). Replace them with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /announcements/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    match /resources/{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

**WARNING**: This allows ANYONE to write to announcements/resources. Use only for testing!

## Step 3: Publish

Click the **Publish** button at the bottom right.

## Step 4: Test

Go back to your site and try creating an announcement/resource again. The error should be gone.

## Next Steps (Security)

Once you've confirmed it works, see `FIRESTORE_RULES.md` for better security options:
- **Option 1** (testing): Keep these permissive rules
- **Option 2** (recommended): Set up Firebase Authentication + custom claims
- **Option 3** (most secure): Use a backend API for validation

For production, do NOT use these permissive rules. Move to Option 2 or 3 to restrict writes to admins only.
