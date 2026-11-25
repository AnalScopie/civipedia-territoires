// Couleur Talents — service worker de la page « Mes outils ».
// Le réseau d'abord ; la copie locale ne sert que hors connexion. Aucune donnée n'est gardée.
const CACHE = 'ct-outils-v4';
const BASE = ['./', './index.html', './manifest.webmanifest', './icones/icone-192.png', './icones/icone-512.png', '../profil-professionnel/', './corine.html'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ct-outils-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok && res.type === 'basic') { const copie = res.clone(); caches.open(CACHE).then(c => c.put(req, copie)); }
    return res;
  }).catch(() => caches.match(req)));
});
