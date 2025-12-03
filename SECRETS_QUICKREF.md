# Quick Secrets Setup Reference

## TL;DR - Just Do This

### 1. Get Your Firebase Config
Go to [Firebase Console](https://console.firebase.google.com/) → Project Settings → Your apps → Web app → Copy these values

### 2. Get Your Admin JSON
Create this with your admin UIDs and passwords:
```json
[
  {"uid": "alice", "password": "secure-password-1"},
  {"uid": "bob", "password": "secure-password-2"}
]
```

### 3. Add 7 Secrets to GitHub

Go to `https://github.com/ezo-web/istem/settings/secrets/actions`

Click **New repository secret** and add these (one by one):

| Secret Name | Value |
|---|---|
| `FIREBASE_API_KEY` | Your Firebase API Key |
| `FIREBASE_AUTH_DOMAIN` | Your Firebase Auth Domain |
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `FIREBASE_STORAGE_BUCKET` | Your Firebase Storage Bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Your Firebase Messaging Sender ID |
| `FIREBASE_APP_ID` | Your Firebase App ID |
| `ADMIN_CREDENTIALS` | Your JSON from Step 2 (all one line is fine) |

### 4. Enable GitHub Pages

Go to `https://github.com/ezo-web/istem/settings/pages`

Under "Build and deployment" → Source: Select **GitHub Actions**

### 5. Test It

```bash
git add .
git commit -m "Add GitHub Actions workflow"
git push origin main
```

Go to Actions tab and watch it deploy. Done!

## Full Guide
See `GITHUB_ACTIONS_SETUP.md` for detailed instructions and troubleshooting.
