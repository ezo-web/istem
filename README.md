# I-STEM Council — Announcements & Resources Dashboard

Lightweight static dashboard for the I-STEM Council. This project is a simple static site you can serve locally or host on any static hosting (GitHub Pages, Netlify, Vercel).

Files added:

- `index.html` — main dashboard page
- `assets/style.css` — glassy, light theme
- `assets/app.js` — data fetching and rendering logic
- `data/announcements.json` — sample announcements
- `data/resources.json` — sample resources

Quick start (serve locally):

```bash
# from repo root
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Notes & next steps:

- Update the JSON files in `data/` to reflect real announcements and resources.
- To add authenticated posting or a CMS, connect a simple backend or use a headless CMS.
- Consider enabling scheduled announcements or an admin UI for creating items.

If you want, I can:

- Add an admin UI + local JSON editing
- Wire a small Node/Express backend to allow authenticated posting
- Deploy this to GitHub Pages and add a custom domain

Enjoy — ask me which next step you'd like.

Firestore integration
---------------------

This project can read announcements and resources from Google Firestore. I added a small integration that attempts to load collections `announcements` and `resources` from Firestore first, and falls back to the local JSON files in `data/` if Firestore is not configured or fails.

Quick setup

1. Create a Firebase project at https://console.firebase.google.com/
2. In the project, Register a Web App (</>), copy the config object.
3. Enable Firestore in the Firebase Console and create two collections:
	 - `announcements`: documents with fields `title` (string), `date` (timestamp or ISO string), `body` (string), `pinned` (boolean)
	 - `resources`: documents with fields `title` (string), `type` (string), `description` (string), `link` (string)
4. In this repo, open `assets/firebase-config.js` and replace the placeholder values with your project's config.

Security note

- If you only want public read access, set Firestore rules to allow reads for your collections. For write operations, require authentication or restrict to admins. Example read-only rules for development:

	rules_version = '2';
	service cloud.firestore {
		match /databases/{database}/documents {
			match /{document=**} {
				allow read: if true;
				allow write: if false;
			}
		}
	}

- Do not commit real credentials to public repositories. Keep `assets/firebase-config.js` private or add it to `.gitignore` when you add real config.

Testing locally

Start a simple static server and open the site. If Firestore config is present and valid, the site will show live Firestore data; otherwise it will show the sample data from `data/`.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Want me to:
- Add an admin UI to create/edit announcements directly from the site (with Firebase Authentication)
- Add protected write endpoints (simple Node backend) or integrate Sign-In with Firebase
- Add deployment steps for hosting the site on Firebase Hosting


Admin UI (UID + Password)
---------------------------------
I added an Admin UI that authenticates admins using a dedicated Firestore collection named `admins`. This allows you to use arbitrary UIDs (not emails).

How it works
- The admin login form asks for `UID` and `Password`.
- The app looks up a document with ID = `UID` in the `admins` collection. That document must contain a `passwordHash` field (SHA-256 hex).
- The site hashes the entered password client-side with SHA-256 and compares it to `passwordHash` in Firestore. If they match, the admin is signed in locally (session stored in `sessionStorage`).

Creating admin accounts
- Admins are provided by you (not creatable by site users). Add UID/password entries to `data/admins.json`. The file accepts objects with `uid` and either `password` (plaintext) or `passwordHash` (SHA-256 hex). Plaintext `password` entries are hashed by the site when it loads the file.
- Example: `{ "uid": "alice", "password": "changeme" }` or `{ "uid": "bob", "passwordHash": "abc123...def456" }`.
- The site loads this file once on startup; changes to `data/admins.json` require a page reload.

Security notes & recommendations
- Admin credentials are stored locally in `data/admins.json` and never sent to Firestore. Do not commit this file to a public repository or add it to `.gitignore` if you have sensitive credentials.
- Plaintext passwords in `data/admins.json` are hashed client-side (SHA-256) when the page loads. Hashes are compared in the browser; passwords are never sent to the server.
- Firestore only stores the public announcements and resources, and should use these rules to allow anyone to read but only authenticated users (via local session) to write:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /announcements/{document=**} {
        allow read: if true;
        allow write: if false;
      }
      match /resources/{document=**} {
        allow read: if true;
        allow write: if false;
      }
    }
  }
  ```
- If you want server-controlled write permissions, you would need a backend API that validates admin status; for now, the site does not perform server-side checks.



# istem