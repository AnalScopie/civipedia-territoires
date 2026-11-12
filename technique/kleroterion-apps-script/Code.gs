/**
 * Klèrôtèrion — accès réservé aux comptes @civipedia.org.
 *
 * Sert la page publique kleroterion/index.html (lue sur GitHub Pages, donc toujours à jour)
 * en y injectant les onglets de noms de la grande base (Contacts, Organisations, vue Conseil), lus en direct, à la place du repère
 * /*__DONNEES__*\/. Enregistre ensuite chaque tirage dans l'onglet Tirages_au_sort de la base.
 *
 * Installation : voir LISEZMOI.md dans ce dossier.
 */

const BASE_ID = PropertiesService.getScriptProperties().getProperty('BASE_ID')
  || '1OXgIHtFdEAUjvVo5kdIM0uCVMVHC634Fyl-VTxsW3ko'; // JOURNAL_TRAITEMENT_CIVIPEDIA_LAB
const PAGE_URL = PropertiesService.getScriptProperties().getProperty('PAGE_URL')
  || 'https://analscopie.github.io/civipedia-territoires/kleroterion/';
const DOMAINE = '@civipedia.org';

// Types de noms proposés (onglets) et colonnes transmises à la page ; la première colonne est l'identifiant.
// Minimisation : ni coordonnées, ni LinkedIn, ni notes, ni sources. Un onglet absent de la base est ignoré.
const ONGLETS = {
  Contacts: ['ID_contact', 'Nom', 'Prénom', 'Organisation', 'Fonction', 'Ville', 'Statut'],
  Organisations: ['ID_organisation', 'Nom', 'Type_acteur', 'Domaine', 'Ville', 'Statut'],
  Conseil_Vue_Personnes: ['ID_contact', 'Personne', 'Organisation (fiche)', 'Type de structure', 'Lieu', 'Domaines', 'Statut de la fiche'],
};
const ONGLET_TIRAGES = 'Tirages_au_sort';
const ENTETES_TIRAGES = ['ID_tirage', 'Date_tirage', 'Opérateur', 'Onglet', 'Filtre', 'Colonnes_par',
  'Sièges_demandés', 'Candidats', 'ID_contact', 'Nom', 'Groupe', 'Rangée', 'Procès_verbal'];

function compte_() {
  const email = Session.getActiveUser().getEmail() || '';
  if (!email.toLowerCase().endsWith(DOMAINE)) throw new Error('Accès réservé aux comptes Civipedia.');
  return email;
}

function doGet(e) {
  try { compte_(); }
  catch (err) { return HtmlService.createHtmlOutput('<p style="font:16px system-ui;padding:24px">Le tirage dans la grande base est réservé aux comptes Civipedia.</p>'); }

  // ?onglet=Organisations : ne charger qu'un type de noms ; sinon tous les types autorisés.
  const demande = e && e.parameter && e.parameter.onglet;
  if (demande && !ONGLETS[demande]) return HtmlService.createHtmlOutput('Onglet non autorisé.');
  const classeur = SpreadsheetApp.openById(BASE_ID);
  const brut = {};
  (demande ? [demande] : Object.keys(ONGLETS)).forEach(function (nom) {
    const t = lireOnglet_(classeur, nom, ONGLETS[nom]);
    if (t) brut[nom] = t;
  });
  if (!Object.keys(brut).length) return HtmlService.createHtmlOutput('Aucun onglet de noms trouvé dans la base.');

  const rep = UrlFetchApp.fetch(PAGE_URL, { muteHttpExceptions: true });
  if (rep.getResponseCode() !== 200) return HtmlService.createHtmlOutput('Page du klèrôtèrion indisponible (' + rep.getResponseCode() + ').');
  let html = rep.getContentText('UTF-8');
  const donnees = 'const BRUT = ' + JSON.stringify(brut).replace(/</g, '\\u003c') + ';';
  if (html.indexOf('/*__DONNEES__*/') < 0) return HtmlService.createHtmlOutput('Repère de données absent de la page.');
  html = html.replace('/*__DONNEES__*/', function () { return donnees; });
  // Liens relatifs (retour aux cartes) résolus vers le site public.
  html = html.replace('<head>', '<head><base href="' + PAGE_URL + '" target="_top">');

  return HtmlService.createHtmlOutput(html)
    .setTitle('Klèrôtèrion — grande base')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Lit un onglet par noms de colonnes (jamais par position) ; renvoie [[en-têtes], [ligne], ...]. */
function lireOnglet_(classeur, nom, colonnes) {
  const feuille = classeur.getSheetByName(nom);
  if (!feuille) return null;
  const valeurs = feuille.getDataRange().getDisplayValues();
  const entetes = valeurs[0].map(function (h) { return String(h).trim(); });
  const idx = colonnes.map(function (c) { return entetes.indexOf(c); });
  const lignes = valeurs.slice(1)
    .filter(function (l) { return idx[0] >= 0 && String(l[idx[0]]).trim(); })
    .map(function (l) { return idx.map(function (i) { return i >= 0 ? String(l[i]).trim() : ''; }); });
  return [colonnes].concat(lignes);
}

/**
 * Appelée par la page (google.script.run) à la fin d'un tirage.
 * t = { onglet, filtre, groupe, sieges, candidats, designes: [{id, nom, groupe, rangee}], pv: [lignes] }
 */
function enregistrerTirage(t) {
  const email = compte_();
  if (!t || !Array.isArray(t.designes) || !t.designes.length) throw new Error('Tirage vide.');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const classeur = SpreadsheetApp.openById(BASE_ID);
    let f = classeur.getSheetByName(ONGLET_TIRAGES);
    if (!f) {
      f = classeur.insertSheet(ONGLET_TIRAGES);
      f.appendRow(ENTETES_TIRAGES);
      f.setFrozenRows(1);
    }
    const tz = Session.getScriptTimeZone();
    const maintenant = new Date();
    const id = 'TIR-' + Utilities.formatDate(maintenant, tz, 'yyyyMMdd-HHmmss');
    const date = Utilities.formatDate(maintenant, tz, 'dd/MM/yyyy HH:mm:ss');
    const pv = (t.pv || []).map(String).join('\n').slice(0, 45000);
    const txt = function (v) { return String(v == null ? '' : v).slice(0, 500); };
    const lignes = t.designes.map(function (d, i) {
      return [id, date, email, txt(t.onglet || 'Contacts'), txt(t.filtre), txt(t.groupe), Number(t.sieges) || '',
        Number(t.candidats) || '', txt(d.id), txt(d.nom), txt(d.groupe), Number(d.rangee) || '', i === 0 ? pv : ''];
    });
    f.getRange(f.getLastRow() + 1, 1, lignes.length, ENTETES_TIRAGES.length).setValues(lignes);
    return { ok: true, id: id, lignes: lignes.length };
  } finally {
    lock.releaseLock();
  }
}
