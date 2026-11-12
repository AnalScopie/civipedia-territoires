// Civipedia — service worker de l'application installable.
// Règle : le réseau d'abord, toujours. La copie locale ne sert que hors connexion,
// pour que la carte installée affiche toujours les données publiées les plus récentes.
const CACHE = 'civipedia-territoires-v1';
const BASE = [
  './', './index.html', './config.json', './manifest.webmanifest',
  './territoires/index.json', './territoires/crossac.json', './territoires/crossac.geo.json',
  './icones/icone-192.png', './icones/icone-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('civipedia-territoires-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // envois du formulaire : jamais interceptés
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // polices, guichet, sites tiers : non touchés
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
      .then(r => r || Response.error()))
  );
});
