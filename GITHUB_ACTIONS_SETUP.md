# GitHub Actions + Secrets Setup Guide

This project uses GitHub Actions to securely handle sensitive credentials and configuration. The workflow generates `assets/firebase-config.js` and `data/admins.json` from GitHub Secrets at deploy time, keeping sensitive values out of your repository.

## How It Works

1. You store sensitive values in GitHub repository secrets
2. When you push to the `main` branch, GitHub Actions runs automatically
3. The workflow generates the config files from secrets
4. The site is deployed to GitHub Pages with the generated files

## Step 1: Get Your Secrets

You'll need the following values:

### Firebase Configuration (6 values)
Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Project Settings → General tab → Your apps → Web app:

- `FIREBASE_API_KEY` — apiKey
- `FIREBASE_AUTH_DOMAIN` — authDomain
- `FIREBASE_PROJECT_ID` — projectId
- `FIREBASE_STORAGE_BUCKET` — storageBucket
- `FIREBASE_MESSAGING_SENDER_ID` — messagingSenderId
- `FIREBASE_APP_ID` — appId

### Admin Credentials (JSON)
Your admin UID/password pairs in JSON format:

```json
[
  { "uid": "alice", "password": "your-secure-password" },
  { "uid": "bob", "password": "another-secure-password" }
]
```

**Best practice**: Use strong, unique passwords. Consider using a password manager.

## Step 2: Add Secrets to GitHub

1. Go to your GitHub repository: `https://github.com/ezo-web/istem`
2. Click **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** for each value below

### Add These Secrets (click "New repository secret" for each)

1. **FIREBASE_API_KEY**
   - Paste the apiKey value
   - Click "Add secret"

2. **FIREBASE_AUTH_DOMAIN**
   - Paste the authDomain value
   - Click "Add secret"

3. **FIREBASE_PROJECT_ID**
   - Paste the projectId value
   - Click "Add secret"

4. **FIREBASE_STORAGE_BUCKET**
   - Paste the storageBucket value
   - Click "Add secret"

5. **FIREBASE_MESSAGING_SENDER_ID**
   - Paste the messagingSenderId value
   - Click "Add secret"

6. **FIREBASE_APP_ID**
   - Paste the appId value
   - Click "Add secret"

7. **ADMIN_CREDENTIALS** (important: this is the whole JSON string)
   - Paste the entire JSON array from above (all on one line or multiple lines, GitHub will handle it)
   - Example: `[{"uid":"alice","password":"pass"}]`
   - Click "Add secret"

## Step 3: Enable GitHub Pages

1. Go to your repository Settings
2. Scroll down to **Pages** section
3. Under "Build and deployment":
   - Source: Select **GitHub Actions**
4. Save

## Step 4: Test the Deployment

1. Make a small change to your code (e.g., add a comment to `index.html`)
2. Commit and push to `main` branch:
   ```bash
   git add .
   git commit -m "Test GitHub Actions deployment"
   git push origin main
   ```
3. Go to your repository → **Actions** tab
4. You should see a workflow run called "Deploy to GitHub Pages"
5. Wait for it to complete (green checkmark = success)
6. Once deployed, visit `https://ezo-web.github.io/istem/` and verify:
   - The site loads
   - Admin button works
   - You can sign in with your admin credentials

## Step 5: Remove Local Sensitive Files

Since the workflow now generates these files, you should remove them from your local repo (they're already in `.gitignore`):

```bash
rm assets/firebase-config.js
rm data/admins.json
git add .gitignore
git commit -m "Remove sensitive files, use GitHub Secrets instead"
git push origin main
```

## Important Security Notes

✅ **What's now secure:**
- Firebase config is never committed to the repo
- Admin credentials are never stored in the repository
- Secrets are encrypted in GitHub and never exposed in workflows
- The generated files only exist on GitHub's servers during deployment, not in git history

⚠️ **Still be careful:**
- Don't share your GitHub account credentials
- Rotate passwords periodically if credentials are compromised
- Only add people as collaborators who need repo access
- Review who has access to your repository settings

## Troubleshooting

### "Deployment failed" in Actions
1. Check the workflow run logs (click the failed run → see details)
2. Common issues:
   - A secret is missing or misnamed
   - Firebase config values are incorrect
   - Admin JSON has syntax errors

### Site shows "Firebase not configured"
- The secrets weren't set correctly, or the workflow didn't run
- Check Actions tab to see if the latest push triggered a deployment
- Verify all 7 secrets are present in Settings → Secrets

### Admin credentials don't work
- Double-check the JSON syntax in `ADMIN_CREDENTIALS` secret
- Make sure UIDs and passwords are correct
- Try manually setting the secret again

## Future Deployments

Once set up, every time you push to `main`:
1. GitHub Actions automatically runs the workflow
2. Config files are generated from secrets
3. Site is deployed to GitHub Pages
4. You're done! No manual deploy needed.

To make changes to admin credentials or Firebase config, just update the secrets in GitHub and push a new commit (or re-run the workflow).

## Local Development

For local testing, you can still use the placeholder files or create local versions:
- `assets/firebase-config.js` — Create locally with your test Firebase config (add to `.gitignore`)
- `data/admins.json` — Create locally with test credentials (add to `.gitignore`)

These won't be committed thanks to `.gitignore`, but will work for local development.
