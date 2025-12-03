/*
  app.js (module)
  - initializes Firebase (if configured) and loads collections
  - provides an Admin UI using Firebase Authentication where the admin logs in
    using `UID` + `Password` (UID is mapped to an email like `UID@istem.local`)
  - falls back to local JSON in `data/` when Firestore is not available
*/

import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc
  , onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

let firebaseApp = null;
let db = null;
let isAdminSignedIn = false;
let currentAdminUID = null;
let firebaseReady = false;
let currentAnnouncements = [];
let currentResources = [];

async function loadJSON(path) {
  try {
    const res = await fetch(path);
    if(!res.ok) throw new Error('Fetch failed');
    return await res.json();
  } catch (e) {
    console.error('Failed loading', path, e);
    return [];
  }
}

function formatDate(d) {
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}

function renderAnnouncements(items) {
  const list = document.getElementById('announcementsList');
  list.innerHTML = '';
  const tpl = document.getElementById('announcementTpl');
  const frag = document.createDocumentFragment();
  items.forEach(a => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('.title').textContent = a.title || '';
    node.querySelector('.date').textContent = a.date ? formatDate(a.date) : '';
    node.querySelector('.body').textContent = a.body || '';
    frag.appendChild(node);
  });
  list.appendChild(frag);
}

function renderResources(items) {
  const list = document.getElementById('resourcesList');
  list.innerHTML = '';
  const tpl = document.getElementById('resourceTpl');
  const frag = document.createDocumentFragment();
  items.forEach(r => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('.title').textContent = r.title || '';
    node.querySelector('.type').textContent = r.type || '';
    node.querySelector('.body').textContent = r.description || '';
    const a = node.querySelector('.link');
    a.href = r.link || '#';
    frag.appendChild(node);
  });
  list.appendChild(frag);
}

function setupSearch(itemsA, itemsR) {
  const sa = document.getElementById('searchAnnouncements');
  const sr = document.getElementById('searchResources');
  sa.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderAnnouncements(itemsA.filter(i => ((i.title||"")+(i.body||"")).toLowerCase().includes(q)));
  });
  sr.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderResources(itemsR.filter(i => ((i.title||"")+(i.description||"")+(i.type||"")).toLowerCase().includes(q)));
  });
}

async function initFirebase() {
  try {
    if (!firebaseConfig || typeof firebaseConfig.apiKey !== 'string' || firebaseConfig.apiKey.includes('REPLACE')) {
      throw new Error('Firebase config not provided or is placeholder');
    }
    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
    return { app: firebaseApp, db, auth };
  } catch (err) {
    console.warn('Firebase not initialized:', err.message || err);
    return null;
  }
}

async function loadFromFirestore(dbInstance) {
  try {
    const annCol = collection(dbInstance, 'announcements');
    const resCol = collection(dbInstance, 'resources');

    const [annSnap, resSnap] = await Promise.all([getDocs(annCol), getDocs(resCol)]);

    const announcements = annSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title,
        date: data.date ? (data.date.toDate ? data.date.toDate().toISOString() : data.date) : null,
        body: data.body,
        pinned: data.pinned || false
      };
    });

    const resources = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    announcements.sort((a,b) => {
      if ((b.pinned?1:0) - (a.pinned?1:0) !== 0) return (b.pinned?1:0) - (a.pinned?1:0);
      return new Date(b.date) - new Date(a.date);
    });

    return [announcements, resources];
  } catch (err) {
    console.warn('Firestore read failed:', err);
    return null;
  }
}

function startRealtimeListeners(dbInstance) {
  const annCol = collection(dbInstance, 'announcements');
  const resCol = collection(dbInstance, 'resources');

  // announcements listener
  onSnapshot(annCol, snap => {
    const announcements = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title,
        date: data.date ? (data.date.toDate ? data.date.toDate().toISOString() : data.date) : null,
        body: data.body,
        pinned: data.pinned || false
      };
    });
    announcements.sort((a,b) => {
      if ((b.pinned?1:0) - (a.pinned?1:0) !== 0) return (b.pinned?1:0) - (a.pinned?1:0);
      return new Date(b.date) - new Date(a.date);
    });
    currentAnnouncements = announcements;
    renderAnnouncements(currentAnnouncements);
    setupSearch(currentAnnouncements, currentResources);
    console.info('Announcements snapshot applied', announcements.length);
  }, err => console.warn('Announcements snapshot error', err));

  // resources listener
  onSnapshot(resCol, snap => {
    const resources = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    currentResources = resources;
    renderResources(currentResources);
    setupSearch(currentAnnouncements, currentResources);
    console.info('Resources snapshot applied', resources.length);
  }, err => console.warn('Resources snapshot error', err));
}

async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

let localAdminsMap = {}; // uid -> { passwordHash }

async function loadLocalAdmins() {
  try {
    const list = await loadJSON('data/admins.json');
    const map = {};
    await Promise.all((list||[]).map(async entry => {
      const uid = entry.uid;
      if (!uid) return;
      if (entry.passwordHash) {
        map[uid] = { passwordHash: entry.passwordHash };
      } else if (entry.password) {
        const hash = await hashPassword(entry.password);
        map[uid] = { passwordHash: hash };
      }
    }));
    localAdminsMap = map;
  } catch (err) {
    console.warn('No local admins loaded', err);
    localAdminsMap = {};
  }
}

async function getAdminDoc(uid) {
  // admins are loaded only from local data/admins.json
  if (localAdminsMap && localAdminsMap[uid]) return localAdminsMap[uid];
  return null;
}

async function createAnnouncementFirestore(obj) {
  if (!db) throw new Error('Firestore not initialized');
  const col = collection(db, 'announcements');
  return await addDoc(col, obj);
}

async function createResourceFirestore(obj) {
  if (!db) throw new Error('Firestore not initialized');
  const col = collection(db, 'resources');
  return await addDoc(col, obj);
}

async function init() {
  // Start app immediately (no blocking on Firebase). Admins and local config
  // are available right away; Firestore will be loaded in the background
  // and the UI will update when it becomes available.
  await loadLocalAdmins();

  // render empty lists initially
  renderAnnouncements([]);
  renderResources([]);
  setupSearch([], []);

  setupAdminUI();

  // Start background loader that will attempt to initialize Firestore
  // and fetch data repeatedly until it succeeds.
  startFirestoreLoader();
}

let _firestoreLoaderTimer = null;
function startFirestoreLoader(intervalMs = 3000) {
  // don't start multiple loaders
  if (_firestoreLoaderTimer) return;

  const attempt = async () => {
    try {
      const fb = await initFirebase();
      if (fb && fb.db) {
        db = fb.db;
        // attach realtime listeners; onSnapshot will render the first snapshot
        startRealtimeListeners(db);
        firebaseReady = true;
        console.info('Realtime Firestore listeners attached');
        clearInterval(_firestoreLoaderTimer);
        _firestoreLoaderTimer = null;
      }
    } catch (err) {
      console.debug('Firestore attempt failed, will retry', err);
    }
  };

  // run immediately, then on interval
  attempt();
  _firestoreLoaderTimer = setInterval(attempt, intervalMs);
}

async function refreshData() {
  // Refresh announcements and resources from Firestore only. Do nothing
  // if Firestore is not yet available; the background loader will pick up
  // new data when it becomes available.
  if (!db) return;

  const fromFirestore = await loadFromFirestore(db);
  if (!fromFirestore) return;
  const [announcements, resources] = fromFirestore;
  renderAnnouncements(announcements);
  renderResources(resources);
  setupSearch(announcements, resources);
}

window.addEventListener('DOMContentLoaded', init);

/* Admin UI logic */
function $(sel) { return document.querySelector(sel); }

function showAdminMessage(msg, err=false) {
  const el = $('#adminMsg'); if(!el) return; el.textContent = msg; el.style.color = err ? 'crimson' : 'inherit';
}

function toggleAdminPanel(open) {
  const panel = document.getElementById('adminPanel');
  if (!panel) return;
  if (open) {
    panel.style.display = 'flex';
    panel.hidden = false;
  } else {
    panel.style.display = 'none';
    panel.hidden = true;
    // clear form on close
    const uidInput = document.getElementById('loginUid');
    const pwdInput = document.getElementById('loginPassword');
    if (uidInput) uidInput.value = '';
    if (pwdInput) pwdInput.value = '';
  }
}

function setupAdminUI() {
  const adminBtn = document.getElementById('adminBtn');
  const closeAdmin = document.getElementById('closeAdmin');
  const loginForm = document.getElementById('loginForm');
  const adminControls = document.getElementById('adminControls');
  const signOutBtn = document.getElementById('signOutBtn');
  const createAnnouncementForm = document.getElementById('createAnnouncementForm');
  const createResourceForm = document.getElementById('createResourceForm');

  if (!adminBtn) {
    console.warn('Admin button not found in DOM');
    return;
  }

  adminBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggleAdminPanel(true); });
  
  if (closeAdmin) {
    closeAdmin.addEventListener('click', (e) => { 
      e.preventDefault();
      e.stopPropagation();
      toggleAdminPanel(false);
    });
  }
  
  // close panel when clicking outside (on the background overlay)
  const adminPanel = document.getElementById('adminPanel');
  if (adminPanel) {
    adminPanel.addEventListener('click', (e) => {
      if (e.target === adminPanel) {
        e.preventDefault();
        e.stopPropagation();
        toggleAdminPanel(false);
      }
    });
  }


  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const uid = document.getElementById('loginUid').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!db) return showAdminMessage('Firestore not configured for admin features', true);
    try {
      const admin = await getAdminDoc(uid);
      if (!admin) return showAdminMessage('No such UID', true);
      const hash = await hashPassword(password);
      if (hash === admin.passwordHash) {
        isAdminSignedIn = true;
        currentAdminUID = uid;
        sessionStorage.setItem('adminUID', uid);
        document.getElementById('adminUID').textContent = uid;
        document.getElementById('adminSignedOut').hidden = true;
        document.getElementById('adminSignedIn').hidden = false;
        adminControls.hidden = false;
        loginForm.hidden = true;
        showAdminMessage('Signed in as '+uid);
      } else {
        showAdminMessage('Invalid password', true);
      }
    } catch (err) {
      console.error(err);
      showAdminMessage('Sign in failed: '+(err.message||err), true);
    }
  });


  // restore session if present (but don't open the panel automatically)
  const saved = sessionStorage.getItem('adminUID');
  if (saved) {
    // simple validation: ensure admin doc exists
    getAdminDoc(saved).then(a => {
      if (a) {
        isAdminSignedIn = true; 
        currentAdminUID = saved; 
        document.getElementById('adminUID').textContent = saved;
        document.getElementById('adminSignedOut').hidden = true;
        document.getElementById('adminSignedIn').hidden = false;
        if (adminControls) adminControls.hidden = false;
        if (loginForm) loginForm.hidden = true;
        showAdminMessage('Session restored for '+saved);
        // NOTE: panel stays hidden until user clicks Admin button
      } else {
        sessionStorage.removeItem('adminUID');
      }
    }).catch(()=>{});
  }

  signOutBtn?.addEventListener('click', async () => {
    isAdminSignedIn = false; 
    currentAdminUID = null; 
    sessionStorage.removeItem('adminUID');
    document.getElementById('adminSignedOut').hidden = false;
    document.getElementById('adminSignedIn').hidden = true;
    adminControls.hidden = true; 
    loginForm.hidden = false;
    document.getElementById('loginUid').value = '';
    document.getElementById('loginPassword').value = '';
    showAdminMessage('Signed out');
  });

  createAnnouncementForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isAdminSignedIn) return showAdminMessage('You must be signed in as admin to create', true);
    if (!db) return showAdminMessage('Firestore not configured', true);
    const title = document.getElementById('annTitle').value.trim();
    const date = document.getElementById('annDate').value || new Date().toISOString().slice(0,10);
    const body = document.getElementById('annBody').value.trim();
    const pinned = document.getElementById('annPinned').checked;
    try {
      await createAnnouncementFirestore({ title, date, body, pinned });
      showAdminMessage('Announcement created');
      // refresh lists (don't re-initialize everything)
      await refreshData();
      createAnnouncementForm.reset();
    } catch (err) {
      console.error(err);
      showAdminMessage('Create announcement failed: '+(err.message||err), true);
    }
  });

  createResourceForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isAdminSignedIn) return showAdminMessage('You must be signed in as admin to create', true);
    if (!db) return showAdminMessage('Firestore not configured', true);
    const title = document.getElementById('resTitle').value.trim();
    const type = document.getElementById('resType').value.trim();
    const link = document.getElementById('resLink').value.trim();
    const description = document.getElementById('resDesc').value.trim();
    try {
      await createResourceFirestore({ title, type, link, description });
      showAdminMessage('Resource created');
      // refresh lists (don't re-initialize everything)
      await refreshData();
      createResourceForm.reset();
    } catch (err) {
      console.error(err);
      showAdminMessage('Create resource failed: '+(err.message||err), true);
    }
  });
}
