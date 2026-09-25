/* UNIVO — service worker : fonctionnement hors connexion */
const CACHE = "univo-v8";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./firebase-config.js", "./icon-48.png", "./icon-96.png", "./icon-144.png", "./icon-192.png", "./icon-256.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./favicon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
function reseauDabord(req, key) {
  return fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(key || req, cp)); } return r; })
    .catch(() => caches.match(key || req));
}
function cacheEtMaj(req) {
  return caches.open(CACHE).then((c) => c.match(req).then((hit) => {
    const net = fetch(req).then((r) => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
}
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (req.mode === "navigate") { e.respondWith(reseauDabord(req, "./index.html")); return; }
  // bibliothèques Firebase et polices : disponibles hors connexion
  if (url.hostname === "www.gstatic.com" || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") { e.respondWith(cacheEtMaj(req)); return; }
  if (url.origin === self.location.origin) {
    if (url.pathname.endsWith("firebase-config.js")) { e.respondWith(reseauDabord(req)); return; }
    e.respondWith(caches.match(req).then((hit) => hit || reseauDabord(req)));
  }
  // les échanges avec Firestore et l'authentification ne passent pas par le cache
});
