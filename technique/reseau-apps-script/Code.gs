/**
 * Carte du réseau Civipédia — accès réservé aux comptes @civipedia.org.
 *
 * À chaque ouverture : lit la grande base en direct, place chaque élément sur un lieu, relie les lieux
 * à partir de l'onglet Relations, puis sert la page publiée sur GitHub Pages (reseau/index.html) en y
 * injectant le résultat à la place du repère de données.
 *
 * Ne quittent jamais ce script : noms de personnes, d'organisations, de démarches, notes, coordonnées.
 * La page ne reçoit que des lieux (nom de commune, de territoire ou de pays), des comptes et des liens.
 *
 * Installation : voir LISEZMOI.md dans ce dossier.
 */

const PROPS = PropertiesService.getScriptProperties();
const BASE_ID = PROPS.getProperty('BASE_ID') || '1OXgIHtFdEAUjvVo5kdIM0uCVMVHC634Fyl-VTxsW3ko'; // JOURNAL_TRAITEMENT_CIVIPEDIA_LAB
const PAGE_URL = PROPS.getProperty('PAGE_URL') || 'https://analscopie.github.io/civipedia-territoires/reseau/';
const DOMAINE = '@civipedia.org';
const CIVIPEDIA = 'MASE-O-0028';
const CACHE_MINUTES = 10;

// Liens du réseau que la base ne situe pas sur une ville. `zone: true` = zone sans pays précis.
const LIENS_SANS_LIEU = [
  { id: 'd:afrique', nom: 'Afrique francophone', ll: [12.5, 0.5], zone: true },
  { id: 'd:belgique', nom: 'Belgique', requete: 'Bruxelles', pays: 'BE', zone: false },
];

const PAYS = { 'France': 'FR', 'Belgique': 'BE', 'Canada': 'CA', 'République démocratique du Congo': 'CD' };
const PAYS_NOM = { FR: 'France', BE: 'Belgique', CA: 'Canada', CD: 'République démocratique du Congo' };
const COURT = { 'République démocratique du Congo': 'RDC' };

// Relations qui situent une organisation sur un territoire.
const TYPES_LOCALISATION = ['Localisation indiquée par la source', 'Siège', "Territoire d'intervention", 'Territoire de compétence',
  "Lieu d'accueil", 'Fonction exercée sur le territoire', 'Département de rattachement'];
// Relations qui donnent le lieu d'une démarche par son client.
const CLIENT = /^(Commanditaire|Client|Destinataire de la proposition|Commune concernée|Lieu d.ancrage)/i;

/* ---------------------------------------------------------------- Web app */

function doGet(e) {
  const email = (Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!email.endsWith(DOMAINE)) {
    return HtmlService.createHtmlOutput('<p style="font:16px system-ui;padding:24px">La carte du réseau est réservée aux comptes Civipedia.</p>');
  }
  const rafraichir = e && e.parameter && e.parameter.rafraichir;
  const reseau = reseauEnCache_(rafraichir);

  const rep = UrlFetchApp.fetch(PAGE_URL, { muteHttpExceptions: true });
  if (rep.getResponseCode() !== 200) return HtmlService.createHtmlOutput('Page de la carte indisponible (' + rep.getResponseCode() + ').');
  let html = rep.getContentText('UTF-8');
  if (html.indexOf('/*__DONNEES__*/') < 0) return HtmlService.createHtmlOutput('Repère de données absent de la page.');
  const donnees = 'const R = ' + JSON.stringify(reseau).replace(/</g, '\\u003c') + ';';
  html = html.replace('/*__DONNEES__*/', function () { return donnees; });
  // Le fond de carte (monde.json) et les liens relatifs se chargent depuis GitHub Pages.
  html = html.replace('<head>', '<head><base href="' + PAGE_URL + '" target="_top">');
  return HtmlService.createHtmlOutput(html)
    .setTitle('Tissage du réseau Civipédia')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function reseauEnCache_(rafraichir) {
  const cache = CacheService.getScriptCache();
  if (!rafraichir) {
    const c = cache.get('reseau');
    if (c) return JSON.parse(c);
  }
  const r = construireReseau();
  try { cache.put('reseau', JSON.stringify(r), CACHE_MINUTES * 60); } catch (err) { /* trop gros pour le cache : on s'en passe */ }
  return r;
}

/* ---------------------------------------------------------------- Lecture */

function lire_(classeur, onglet, colonnes) {
  const f = classeur.getSheetByName(onglet);
  if (!f) throw new Error('Onglet absent : ' + onglet);
  const v = f.getDataRange().getDisplayValues();
  const h = v[0].map(function (x) { return String(x).trim(); });
  const idx = colonnes.map(function (c) { return h.indexOf(c); });
  colonnes.forEach(function (c, i) { if (idx[i] < 0) throw new Error('Colonne ' + c + ' absente de ' + onglet); });
  return v.slice(1).filter(function (r) { return String(r[idx[0]]).trim(); }).map(function (r) {
    const o = {};
    colonnes.forEach(function (c, i) { o[c] = String(r[idx[i]]).trim(); });
    return o;
  });
}

/* ---------------------------------------------------------------- Géocodage */

function norm_(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Centre d'un lieu par le géocodeur de Google, gardé dans les propriétés du script (une seule requête par lieu).
function geocode_(nom, cc) {
  const cle = 'geo:' + cc + ':' + norm_(nom);
  const connu = PROPS.getProperty(cle);
  if (connu) return JSON.parse(connu);
  const cache = CacheService.getScriptCache();
  if (cache.get(cle) === 'introuvable') return null;
  let ll = null;
  try {
    const g = Maps.newGeocoder().setLanguage('fr');
    if (cc && PAYS_NOM[cc]) g.setRegion(cc.toLowerCase());
    const r = g.geocode(cc && PAYS_NOM[cc] ? nom + ', ' + PAYS_NOM[cc] : nom);
    if (r.status === 'OK' && r.results && r.results.length) {
      const l = r.results[0].geometry.location;
      ll = [Math.round(l.lat * 1e5) / 1e5, Math.round(l.lng * 1e5) / 1e5];
    }
  } catch (err) { /* quota ou réseau : le lieu reste non placé cette fois */ }
  if (ll) PROPS.setProperty(cle, JSON.stringify(ll));
  else cache.put(cle, 'introuvable', 6 * 3600);
  return ll;
}

/* ---------------------------------------------------------------- Réseau */

function construireReseau(source) {
  const d = source || lireBase_();
  const PLACES = {};
  const joli = function (nom) { // « BRUXELLES » devient « Bruxelles »
    return nom === nom.toUpperCase() ? nom.toLowerCase().replace(/(^|[\s-])\S/g, function (c) { return c.toUpperCase(); }) : nom;
  };
  const place = function (cle, nom, pays, ll, precis) {
    if (!PLACES[cle]) PLACES[cle] = { id: cle, nom: COURT[nom] || joli(nom), pays: pays, ll: ll, precis: !!precis };
    return cle;
  };
  const placeVille = function (nom, cc) {
    const ll = geocode_(nom, cc);
    return ll ? place('c:' + norm_(nom) + ':' + cc, nom, cc, ll) : null;
  };
  const villePlace = function (v) {
    const parts = String(v || '').split(/[;\/]/);
    for (let i = 0; i < parts.length; i++) {
      let p = parts[i].trim(), cc = 'FR', m;
      if (!p) continue;
      if ((m = /^(.+?)\s*\((Belgique)\)/i.exec(p))) { p = m[1]; cc = 'BE'; }
      if ((m = /^(.+?)\s*\([^()]*Canada\)/.exec(p))) { p = m[1]; cc = 'CA'; }
      p = p.replace(/\s*\(\d+\)$/, '');
      const k = placeVille(p, cc);
      if (k) return k;
    }
    return null;
  };

  // Territoires
  const COORD = /latitude\s*(-?\d+\.\d+)\s*,\s*longitude\s*(-?\d+\.\d+)/;
  const TPLACE = {};
  d.Territoires.forEach(function (t) {
    const id = t.ID_territoire, nom = t.Nom_territoire, cc = PAYS[t.Pays] || t.Pays;
    const m = COORD.exec(t.Description);
    const commune = /^(Commune|Ville)$/.test(t.Type_territoire);
    if (m) {
      const ll = [parseFloat(m[1]), parseFloat(m[2])];
      if (commune) { const k = place('c:' + norm_(nom) + ':' + cc, nom, cc, ll); PLACES[k].ll = ll; TPLACE[id] = k; }
      else TPLACE[id] = place('t:' + norm_(nom), nom, cc, ll, true);
      return;
    }
    if (/zone/i.test(t.Type_territoire)) return; // zone d'action sans périmètre : pas de point
    const nomSimple = nom.replace(/\s*\(\d+\)$/, '');
    if (commune) { const k = placeVille(nomSimple, cc); if (k) TPLACE[id] = k; return; }
    const ll = /^Pays$/i.test(t.Type_territoire) ? geocode_(nomSimple, '') : geocode_(nomSimple, PAYS_NOM[cc] ? cc : '');
    if (ll) { TPLACE[id] = place('t:' + norm_(nom), nom, cc, ll, false); if (/^Pays$/i.test(t.Type_territoire)) PLACES[TPLACE[id]].pays_entier = true; }
  });

  // Relations utilisables (hors hypothèses)
  const REL = d.Relations.filter(function (r) { return !/^HYPOTH/i.test(r.Nature_info); });
  const autour = function (id, prefixe, types) {
    const out = [];
    REL.forEach(function (r) {
      if (types && types.indexOf(r.Type_relation) < 0) return;
      if (r.ID_de === id && r.ID_vers.indexOf(prefixe) === 0) out.push(r.ID_vers);
      else if (r.ID_vers === id && r.ID_de.indexOf(prefixe) === 0) out.push(r.ID_de);
    });
    return out;
  };
  const premier = function (ids, table) { for (let i = 0; i < ids.length; i++) if (table[ids[i]]) return table[ids[i]]; return null; };

  // Éléments placés
  const ENT = {};
  d.Territoires.forEach(function (t) { if (TPLACE[t.ID_territoire]) ENT[t.ID_territoire] = { k: 'territoire', place: TPLACE[t.ID_territoire] }; });
  d.Organisations.forEach(function (o) {
    const k = villePlace(o.Ville) || premier(autour(o.ID_organisation, 'MASE-T', TYPES_LOCALISATION), TPLACE);
    ENT[o.ID_organisation] = { k: 'organisation', place: k };
  });
  const placeOrg = {};
  Object.keys(ENT).forEach(function (id) { if (ENT[id].k === 'organisation' && ENT[id].place) placeOrg[id] = ENT[id].place; });
  d.Projets.forEach(function (p) {
    let k = TPLACE[p.ID_territoire] || premier(autour(p.ID_projet, 'MASE-T'), TPLACE);
    if (!k) {
      const clients = [];
      REL.forEach(function (r) {
        if (!CLIENT.test(r.Type_relation)) return;
        if (r.ID_vers === p.ID_projet && r.ID_de.indexOf('MASE-O') === 0) clients.push(r.ID_de);
        if (r.ID_de === p.ID_projet && r.ID_vers.indexOf('MASE-O') === 0) clients.push(r.ID_vers);
      });
      k = premier(clients, placeOrg);
    }
    if (!k) { const m = /\(([^()]*?)\s*-\s*BELGIQUE\)/i.exec(p.Lieu_source); if (m) k = placeVille(m[1].trim(), 'BE'); }
    ENT[p.ID_projet] = { k: 'projet', place: k };
  });
  d['Événements'].forEach(function (v) {
    let k = TPLACE[v.ID_territoire] || null;
    if (!k && v.Lieu_source && !/ligne|meet|whatsapp|visio/i.test(v.Lieu_source)) {
      const parts = v.Lieu_source.split(',');
      k = villePlace(parts[parts.length - 1]) || villePlace(v.Lieu_source);
    }
    ENT[v.ID_evenement] = { k: 'evenement', place: k };
  });
  d.Contacts.forEach(function (c) {
    let k = villePlace(c.Ville);
    if (!k) { const m = /Localisation \(source\) : « ([^»]+) »/.exec(c.Notes); if (m && /qu[ée]bec/i.test(m[1])) k = placeVille('Québec', 'CA'); }
    if (!k) k = premier(autour(c.ID_contact, 'MASE-O').filter(function (o) { return o !== CIVIPEDIA; }), placeOrg);
    ENT[c.ID_contact] = { k: 'personne', place: k };
  });

  // Un territoire rejoint la ville la plus proche déjà sur la carte : à moins de 6 km quand son point est écrit
  // dans sa fiche (adresse d'un siège), à moins de 80 km quand c'est le centre géographique d'un département,
  // d'une région ou d'une intercommunalité. Les pays gardent leur propre point.
  const km = function (a, b) {
    const r = Math.PI / 180, la1 = a[0] * r, la2 = b[0] * r, dla = la2 - la1, dlo = (b[1] - a[1]) * r;
    return 6371 * 2 * Math.asin(Math.sqrt(Math.sin(dla / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dlo / 2) ** 2));
  };
  const utilises = {};
  Object.keys(ENT).forEach(function (id) { if (ENT[id].place) utilises[ENT[id].place] = true; });
  const remap = {};
  Object.keys(PLACES).forEach(function (k) {
    if (k.indexOf('t:') !== 0 || PLACES[k].pays_entier) return;
    let best = null, dist = 1e9;
    Object.keys(utilises).forEach(function (c) {
      if (c.indexOf('c:') !== 0) return;
      const x = km(PLACES[k].ll, PLACES[c].ll);
      if (x < dist) { dist = x; best = c; }
    });
    if (best && dist <= (PLACES[k].precis ? 6 : 80)) remap[k] = best;
  });
  Object.keys(ENT).forEach(function (id) { if (remap[ENT[id].place]) ENT[id].place = remap[ENT[id].place]; });

  // Comptes par lieu
  Object.keys(PLACES).forEach(function (k) { PLACES[k].n = { organisations: 0, projets: 0, evenements: 0, personnes: 0, territoires: 0 }; });
  const CLE = { organisation: 'organisations', projet: 'projets', evenement: 'evenements', personne: 'personnes', territoire: 'territoires' };
  const totaux = {}, nonPlaces = {};
  Object.keys(ENT).forEach(function (id) {
    const e = ENT[id], k = CLE[e.k];
    totaux[k] = (totaux[k] || 0) + 1;
    if (!e.place || !PLACES[e.place]) { nonPlaces[k] = (nonPlaces[k] || 0) + 1; return; }
    PLACES[e.place].n[k]++;
  });

  // Liens entre lieux, avec leur nature dominante
  const ORDRE = ['projet', 'evenement', 'organisation', 'personne'];
  const liens = {};
  REL.forEach(function (r) {
    const a = ENT[r.ID_de], b = ENT[r.ID_vers];
    if (!a || !b || !a.place || !b.place || a.place === b.place) return;
    const cle = [a.place, b.place].sort().join('|');
    const l = liens[cle] || (liens[cle] = { a: cle.split('|')[0], b: cle.split('|')[1], n: 0, cats: {} });
    l.n++;
    const ks = [a.k, b.k];
    const cat = ks.indexOf('evenement') >= 0 ? 'evenement' : ks.indexOf('projet') >= 0 ? 'projet' : ks.indexOf('personne') >= 0 ? 'personne' : 'organisation';
    l.cats[cat] = (l.cats[cat] || 0) + 1;
  });
  const places = Object.keys(PLACES).map(function (k) { return PLACES[k]; }).filter(function (p) {
    const n = p.n; return p.ll && (n.organisations + n.projets + n.evenements + n.personnes + n.territoires) > 0;
  });
  const ids = {}; places.forEach(function (p) { ids[p.id] = true; });
  const edges = Object.keys(liens).map(function (k) { return liens[k]; }).filter(function (l) { return ids[l.a] && ids[l.b]; }).map(function (l) {
    let cat = ORDRE[0];
    ORDRE.forEach(function (c) { if ((l.cats[c] || 0) > (l.cats[cat] || 0)) cat = c; });
    return { a: l.a, b: l.b, n: l.n, cat: cat };
  });
  places.forEach(function (p) { delete p.precis; delete p.pays_entier; });

  const civi = ENT[CIVIPEDIA] && ENT[CIVIPEDIA].place;
  const declare = LIENS_SANS_LIEU.map(function (z) {
    return { id: z.id, nom: z.nom, zone: z.zone, ll: z.ll || geocode_(z.requete, z.pays) };
  }).filter(function (z) { return z.ll; });

  return {
    genere_le: Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyy-MM-dd'),
    hub: civi,
    places: places,
    edges: edges,
    declare: declare,
    totaux: totaux,
    non_places: nonPlaces,
  };
}

function lireBase_() {
  const c = SpreadsheetApp.openById(BASE_ID);
  return {
    Territoires: lire_(c, 'Territoires', ['ID_territoire', 'Nom_territoire', 'Type_territoire', 'Pays', 'Description']),
    Organisations: lire_(c, 'Organisations', ['ID_organisation', 'Ville']),
    Projets: lire_(c, 'Projets', ['ID_projet', 'ID_territoire', 'Lieu_source']),
    'Événements': lire_(c, 'Événements', ['ID_evenement', 'ID_territoire', 'Lieu_source']),
    Contacts: lire_(c, 'Contacts', ['ID_contact', 'Ville', 'Notes']),
    Relations: lire_(c, 'Relations', ['ID_relation', 'ID_de', 'Type_relation', 'ID_vers', 'Nature_info']),
  };
}

/** À lancer une fois depuis l'éditeur après l'installation : autorise l'accès et remplit le cache des positions. */
function preparer() {
  const r = construireReseau();
  Logger.log(r.places.length + ' lieux, ' + r.edges.length + ' liens ; non placés : ' + JSON.stringify(r.non_places));
}
