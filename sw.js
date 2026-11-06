/* ==========================================================================
   FORGE — Service worker
   - Hors-ligne (cache de l'appli + des photos)
   - Notifications de motivation quotidiennes (periodic sync, push, clic)
   ========================================================================== */
const VERSION = 'forge-v1';
const IMG_CACHE = 'forge-img';
const DATA_CACHE = 'forge-data';
const SHELL = [
  './', 'index.html', 'css/style.css', 'js/data.js', 'js/engine.js', 'js/app.js',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/badge-96.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [VERSION, IMG_CACHE, DATA_CACHE];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function trimCache(name, max) {
  const c = await caches.open(name);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.includes('__forge_')) return;

  // Photos + polices : cache d'abord (elles ne changent pas)
  if (url.hostname === 'images.unsplash.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') {
    event.respondWith((async () => {
      const c = await caches.open(IMG_CACHE);
      const hit = await c.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') { c.put(req, res.clone()); trimCache(IMG_CACHE, 180); }
        return res;
      } catch {
        return new Response('', { status: 504 });
      }
    })());
    return;
  }

  // Appli : réseau d'abord (toujours la dernière version), cache en secours hors-ligne
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const c = await caches.open(VERSION);
      try {
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      } catch {
        return (await c.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? c.match('index.html') : Response.error());
      }
    })());
  }
});

/* ---------- Notifications ---------- */
const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function readSettings() {
  try {
    const c = await caches.open(DATA_CACHE);
    const r = await c.match(new URL('./__forge_settings', self.registration.scope).href);
    return r ? await r.json() : null;
  } catch { return null; }
}

async function maybeNotify() {
  const s = await readSettings();
  if (!s || !s.enabled) return;
  const now = new Date();
  const [h, m] = (s.hour || '18:00').split(':').map(Number);
  if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;
  const today = localISO(now);
  const c = await caches.open(DATA_CACHE);
  const lastUrl = new URL('./__forge_lastsent', self.registration.scope).href;
  const last = await c.match(lastUrl);
  if (last && (await last.text()) === today) return;
  const msg = (s.messages && s.messages[today]) || { title: 'FORGE 💪', body: 'Ton coach t\'attend : ouvre l\'appli pour ta séance du jour !' };
  await self.registration.showNotification(msg.title, {
    body: msg.body, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: 'forge-daily', renotify: true,
    vibrate: [100, 50, 100], data: { url: './#/accueil' },
  });
  await c.put(lastUrl, new Response(today));
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'forge-daily') event.waitUntil(maybeNotify());
});

// Prêt pour un futur serveur Web Push (VAPID) : affiche le message reçu.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || 'FORGE 💪', {
    body: data.body || 'C\'est l\'heure de ta séance !', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', data: { url: data.url || './#/accueil' },
  }));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'check') event.waitUntil(maybeNotify());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || './', self.registration.scope).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of all) {
      if (client.url.startsWith(self.registration.scope)) { await client.focus(); if ('navigate' in client) client.navigate(target); return; }
    }
    await self.clients.openWindow(target);
  })());
});
