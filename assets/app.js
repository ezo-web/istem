/*
  app.js (module)
  - attempts to initialize Firestore using `assets/firebase-config.js` and load collections
  - if Firestore is not configured or fails, falls back to local JSON in `data/`
*/

import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import {
  getFirestore,
  collection,
  getDocs
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

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

async function loadFromFirestore() {
  try {
    if (!firebaseConfig || typeof firebaseConfig.apiKey !== 'string' || firebaseConfig.apiKey.includes('REPLACE')) {
      throw new Error('Firebase config not provided or is placeholder');
    }

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const annCol = collection(db, 'announcements');
    const resCol = collection(db, 'resources');

    const [annSnap, resSnap] = await Promise.all([getDocs(annCol), getDocs(resCol)]);

    const announcements = annSnap.docs.map(d => {
      const data = d.data();
      // normalize date field if Firestore Timestamp
      return {
        id: d.id,
        title: data.title,
        date: data.date ? (data.date.toDate ? data.date.toDate().toISOString() : data.date) : null,
        body: data.body,
        pinned: data.pinned || false
      };
    });

    const resources = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // client-side sort: pinned first, then date desc
    announcements.sort((a,b) => {
      if ((b.pinned?1:0) - (a.pinned?1:0) !== 0) return (b.pinned?1:0) - (a.pinned?1:0);
      return new Date(b.date) - new Date(a.date);
    });

    return [announcements, resources];
  } catch (err) {
    console.warn('Firestore load failed / skipped:', err);
    return null;
  }
}

async function init() {
  // try Firestore first
  const fromFirestore = await loadFromFirestore();
  let announcements = [];
  let resources = [];

  if (fromFirestore) {
    [announcements, resources] = fromFirestore;
  } else {
    announcements = await loadJSON('data/announcements.json');
    resources = await loadJSON('data/resources.json');
  }

  renderAnnouncements(announcements);
  renderResources(resources);
  setupSearch(announcements, resources);
}

window.addEventListener('DOMContentLoaded', init);
