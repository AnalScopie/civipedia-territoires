// Carte épurée — service worker de l'application installable (portée : sobre/).
// Règle : le réseau d'abord, toujours. La copie locale ne sert que hors connexion,
// pour que la carte installée affiche toujours les données publiées les plus récentes.
// À l'installation, il garde une copie de la page, de l'icône et des données de
// chaque territoire du registre, pour que la carte s'ouvre aussi sans réseau.
const CACHE = 'carte-sobre-v1';
const BASE = [
  './', './index.html', './config.json', './manifest.webmanifest',
  './icones/icone-192.png', './icones/icone-512.png',
  '../territoires/index.json', '../tableau-de-bord/data.json'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(BASE).catch(() => {});
    try {
      const reg = await (await fetch('../territoires/index.json', { cache: 'no-cache' })).json();
      const urls = reg.flatMap(t => [t.data, t.geo, ...(t.logos || []).map(l => l.src)]).filter(Boolean).map(u => '../' + u);
      await Promise.all(urls.map(u => c.add(u).catch(() => {})));
    } catch (_) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('carte-sobre-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // envois du formulaire : jamais interceptés
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // polices, fond de carte, guichet : non touchés
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
