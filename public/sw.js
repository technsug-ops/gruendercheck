// Service Worker: Seiten offline verfügbar machen. Formular- und API-Daten werden nie zwischengespeichert.
const VERSION = 'gc-v2';
const SHELL = ['/', '/tr/start', '/de', '/tr', '/pwa.js', '/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (/^\/(api|_vercel|admin|rapor)(\/|$)/.test(url.pathname)) return;
  if (req.mode === 'navigate') {
    // Seiten: zuerst Netz (immer aktuell), offline aus dem Speicher.
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(url.pathname, copy)); }
      return res;
    }).catch(() => caches.match(url.pathname).then((r) => r || caches.match(url.pathname.startsWith('/tr') ? '/tr/start' : '/'))));
    return;
  }
  // Dateien (Skripte, Icons, Bilder): sofort aus dem Speicher, im Hintergrund aktualisieren.
  e.respondWith(caches.open(VERSION).then((c) => c.match(req).then((hit) => {
    const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
