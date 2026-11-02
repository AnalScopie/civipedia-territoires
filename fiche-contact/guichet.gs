/**
 * Civipédia — guichet des fiches de contact (salons et événements).
 *
 * À coller dans le tableur FICHES_CONTACT_CIVIPEDIA : Extensions → Apps Script.
 * Rôle :
 *  1. recevoir les fiches envoyées par la page fiche-contact/ et les ranger dans l'onglet Fiches ;
 *  2. chaque lundi, envoyer un résumé des nouvelles fiches et signaler celles déjà présentes dans la base commune ;
 *  3. sur demande (menu Civipédia), verser dans l'onglet Contacts de la base commune les fiches marquées OUI.
 * Rien n'est publié : le tableur et la base commune restent privés.
 */

const BASE_COMMUNE_ID = '1OXgIHtFdEAUjvVo5kdIM0uCVMVHC634Fyl-VTxsW3ko'; // JOURNAL_TRAITEMENT_CIVIPEDIA_LAB
const ONGLET_FICHES = 'Fiches';
const DESTINATAIRE_RESUME = 'anne@civipedia.org';

// Champ envoyé par la page → colonne de l'onglet Fiches.
const CHAMPS = {
  evenement: 'Événement', date_evenement: 'Date_événement',
  nom: 'Nom', prenom: 'Prénom', fonction: 'Fonction', organisation: 'Organisation',
  ville: 'Ville', population: 'Population', email: 'Email', telephone: 'Téléphone',
  recontacter: 'Recontacter_dans', interets: 'Intérêts', interet_autre: 'Intérêt_autre', projet: 'Projet',
  role: 'Rôle_décision', budget: 'Budget', notes: 'Autres_notes', recueillie_par: 'Fiche_recueillie_par',
};

// ---------- 1. Réception des fiches ----------

function doGet() {
  return ContentService.createTextOutput('Guichet des fiches de contact Civipédia : en service.');
}

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.site_web) return repondre({ ok: true }); // case piège invisible : envoi automatique, ignoré
    if (d.accord !== true) return repondre({ ok: false, erreur: "La case « J'accepte d'être contacté par Civipédia » doit être cochée." });
    if (!txt(d.nom) && !txt(d.email) && !txt(d.telephone)) {
      return repondre({ ok: false, erreur: 'Indiquez au moins un nom, un e-mail ou un téléphone.' });
    }
    const verrou = LockService.getScriptLock();
    verrou.waitLock(20000);
    try {
      const f = feuille();
      const ent = entetes(f);
      const lignes = f.getLastRow() > 1 ? f.getRange(2, 1, f.getLastRow() - 1, ent.length).getValues() : [];
      // Une fiche renvoyée après une coupure de réseau n'est pas enregistrée deux fois.
      const uid = txt(d.uid).slice(0, 80);
      if (uid) {
        const dejaLa = lignes.find(l => l[ent.indexOf('ID_envoi')] === uid);
        if (dejaLa) return repondre({ ok: true, reference: dejaLa[0] });
      }
      const max = lignes.reduce((m, l) => Math.max(m, Number(String(l[0]).replace('FC-', '')) || 0), 0);
      const reference = 'FC-' + String(max + 1).padStart(4, '0');
      const ligne = ent.map(() => '');
      const mettre = (col, v) => { const i = ent.indexOf(col); if (i >= 0) ligne[i] = v; };
      mettre('ID_fiche', reference);
      mettre('Reçue_le', new Date());
      mettre('Saisie_par', d.mode === 'equipe' ? 'Membre Civipédia' : 'Personne rencontrée');
      Object.keys(CHAMPS).forEach(k => {
        const v = Array.isArray(d[k]) ? d[k].map(txt).filter(String).join(' ; ') : txt(d[k]);
        mettre(CHAMPS[k], cellule(v));
      });
      mettre('Accord_contact', 'OUI');
      mettre('Statut', 'Nouvelle');
      mettre('ID_envoi', uid);
      f.appendRow(ligne);
      return repondre({ ok: true, reference: reference });
    } finally {
      verrou.releaseLock();
    }
  } catch (err) {
    return repondre({ ok: false, erreur: "La fiche n'a pas pu être enregistrée. Réessayez dans un instant." });
  }
}

// ---------- 2. Résumé du lundi ----------

function resumeHebdomadaire() {
  const f = feuille();
  const ent = entetes(f);
  if (f.getLastRow() < 2) return;
  const plage = f.getRange(2, 1, f.getLastRow() - 1, ent.length);
  const lignes = plage.getValues();
  const col = nom => ent.indexOf(nom);
  const nouvelles = [];
  lignes.forEach((l, i) => { if (l[col('Statut')] === 'Nouvelle') nouvelles.push(i); });
  if (!nouvelles.length) return;

  const contacts = contactsDeLaBase();
  const texte = nouvelles.map(i => {
    const l = lignes[i];
    const qui = [l[col('Prénom')], l[col('Nom')]].filter(String).join(' ') || '(sans nom)';
    const deja = chercher(contacts, l[col('Nom')], l[col('Prénom')], l[col('Email')]);
    if (deja) {
      f.getRange(i + 2, col('Remarque') + 1).setValue('Déjà dans la base commune ? ' + deja);
    }
    f.getRange(i + 2, col('Statut') + 1).setValue('À examiner');
    return '• ' + l[col('ID_fiche')] + ' — ' + qui
      + (l[col('Organisation')] ? ', ' + l[col('Organisation')] : '')
      + (l[col('Événement')] ? ' (' + l[col('Événement')] + ')' : '')
      + (l[col('Intérêts')] ? '\n   Intérêts : ' + l[col('Intérêts')] : '')
      + (l[col('Recontacter_dans')] ? '\n   À recontacter dans : ' + l[col('Recontacter_dans')] : '')
      + (deja ? '\n   Peut-être déjà dans la base commune : ' + deja : '');
  }).join('\n\n');

  MailApp.sendEmail({
    to: DESTINATAIRE_RESUME,
    subject: 'Civipédia — ' + nouvelles.length + ' nouvelle(s) fiche(s) de contact à examiner',
    body: 'Bonjour,\n\nNouvelles fiches de contact reçues depuis le dernier résumé :\n\n' + texte
      + '\n\nPour chaque fiche, écrivez OUI ou NON dans la colonne « Décision » du tableur, puis menu Civipédia → '
      + '« Verser les fiches OUI dans la base commune ».\n' + SpreadsheetApp.getActive().getUrl(),
  });
}

function activerResumeDuLundi() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'resumeHebdomadaire')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('resumeHebdomadaire').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
  SpreadsheetApp.getUi().alert('Le résumé partira chaque lundi vers 8 h à ' + DESTINATAIRE_RESUME + '.');
}

// ---------- 3. Verser les fiches validées dans la base commune ----------

function verserDansLaBase() {
  const ui = SpreadsheetApp.getUi();
  const f = feuille();
  const ent = entetes(f);
  if (f.getLastRow() < 2) { ui.alert('Aucune fiche pour le moment.'); return; }
  const col = nom => ent.indexOf(nom);
  const lignes = f.getRange(2, 1, f.getLastRow() - 1, ent.length).getValues();
  const decision = l => txt(l[col('Décision')]).toUpperCase();
  const aVerser = [], aEcarter = [];
  lignes.forEach((l, i) => {
    if (txt(l[col('ID_contact_base')]) || ['Intégrée', 'Écartée', 'Déjà dans la base'].includes(l[col('Statut')])) return;
    if (decision(l) === 'OUI') aVerser.push(i);
    if (decision(l) === 'NON') aEcarter.push(i);
  });
  aEcarter.forEach(i => f.getRange(i + 2, col('Statut') + 1).setValue('Écartée'));
  if (!aVerser.length) {
    ui.alert('Aucune fiche marquée OUI à verser.' + (aEcarter.length ? ' ' + aEcarter.length + ' fiche(s) NON marquée(s) « Écartée ».' : ''));
    return;
  }
  const ok = ui.alert('Verser dans la base commune',
    aVerser.length + " fiche(s) marquée(s) OUI vont être ajoutées à l'onglet Contacts de la base commune, au statut « À vérifier ». Continuer ?",
    ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return;

  const onglet = SpreadsheetApp.openById(BASE_COMMUNE_ID).getSheetByName('Contacts');
  const entC = onglet.getRange(1, 1, 1, onglet.getLastColumn()).getValues()[0].map(String);
  const contacts = contactsDeLaBase();
  let max = contacts.reduce((m, c) => Math.max(m, Number(String(c.id).replace('MASE-C-', '')) || 0), 0);
  let ajoutees = 0, deja = 0;
  const jour = Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM/yyyy');

  aVerser.forEach(i => {
    const l = lignes[i];
    const v = nom => txt(l[col(nom)]);
    const existant = chercher(contacts, v('Nom'), v('Prénom'), v('Email'));
    if (existant) {
      f.getRange(i + 2, col('ID_contact_base') + 1).setValue(existant);
      f.getRange(i + 2, col('Statut') + 1).setValue('Déjà dans la base');
      f.getRange(i + 2, col('Remarque') + 1).setValue('Non ajoutée : ce contact existe déjà (' + existant + ').');
      deja++;
      return;
    }
    max++;
    const id = 'MASE-C-' + String(max).padStart(4, '0');
    const notes = [
      'Fiche de contact ' + v('ID_fiche') + (v('Événement') ? ' (' + v('Événement') + (v('Date_événement') ? ', ' + v('Date_événement') : '') + ')' : '')
        + (v('Fiche_recueillie_par') ? ', recueillie par ' + v('Fiche_recueillie_par') : '') + '.',
      v('Intérêts') ? 'Intérêts : ' + v('Intérêts') + (v('Intérêt_autre') ? ' ; ' + v('Intérêt_autre') : '') + '.' : '',
      v('Projet') ? 'Projet évoqué : ' + v('Projet') + '.' : '',
      v('Rôle_décision') ? 'Rôle dans la décision : ' + v('Rôle_décision') + '.' : '',
      v('Budget') ? 'Budget : ' + v('Budget') + '.' : '',
      v('Recontacter_dans') ? 'À recontacter dans : ' + v('Recontacter_dans') + '.' : '',
      v('Autres_notes') ? 'Notes : ' + v('Autres_notes') + '.' : '',
      v('Population') ? 'Population indiquée : ' + v('Population') + '.' : '',
      "Accord pour être contacté par Civipédia : oui.",
    ].filter(String).join(' ');
    const valeurs = {
      ID_contact: id, Nom: v('Nom'), 'Prénom': v('Prénom'), Organisation: v('Organisation'), Fonction: v('Fonction'),
      Ville: v('Ville'), Coordonnées: cellule([v('Email'), v('Téléphone')].filter(String).join(' ; ')),
      Source: 'Fiche de contact ' + v('ID_fiche'), Date_collecte: v('Date_événement') || jour,
      Statut: 'À vérifier', Notes: notes,
    };
    onglet.appendRow(entC.map(h => (h in valeurs ? valeurs[h] : '')));
    contacts.push({ id: id, nom: v('Nom'), prenom: v('Prénom'), coord: v('Email') });
    f.getRange(i + 2, col('ID_contact_base') + 1).setValue(id);
    f.getRange(i + 2, col('Intégrée_le') + 1).setValue(new Date());
    f.getRange(i + 2, col('Statut') + 1).setValue('Intégrée');
    ajoutees++;
  });
  ui.alert(ajoutees + ' contact(s) ajouté(s) à la base commune.'
    + (deja ? ' ' + deja + ' fiche(s) non ajoutée(s) car le contact existe déjà.' : '')
    + " Pensez à relier chaque nouveau contact à son organisation dans l'onglet Relations.");
}

// ---------- Menu ----------

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Civipédia')
    .addItem('Verser les fiches OUI dans la base commune', 'verserDansLaBase')
    .addItem('Envoyer le résumé maintenant', 'resumeHebdomadaire')
    .addItem('Activer le résumé du lundi', 'activerResumeDuLundi')
    .addToUi();
}

// ---------- Outils ----------

function feuille() {
  const f = SpreadsheetApp.getActive().getSheetByName(ONGLET_FICHES);
  if (!f) throw new Error('Onglet ' + ONGLET_FICHES + ' introuvable');
  return f;
}

function entetes(f) {
  return f.getRange(1, 1, 1, f.getLastColumn()).getValues()[0].map(String);
}

function txt(v) {
  return v === null || v === undefined ? '' : String(v).trim().slice(0, 2000);
}

// Un texte qui commence par = + - @ serait lu comme une formule (et un « +33… » comme un nombre).
function cellule(v) {
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function repondre(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet)).setMimeType(ContentService.MimeType.JSON);
}

function contactsDeLaBase() {
  const onglet = SpreadsheetApp.openById(BASE_COMMUNE_ID).getSheetByName('Contacts');
  const valeurs = onglet.getDataRange().getValues();
  const e = valeurs[0].map(String);
  return valeurs.slice(1).filter(l => txt(l[e.indexOf('ID_contact')])).map(l => ({
    id: txt(l[e.indexOf('ID_contact')]), nom: txt(l[e.indexOf('Nom')]),
    prenom: txt(l[e.indexOf('Prénom')]), coord: txt(l[e.indexOf('Coordonnées')]),
  }));
}

function simplifier(s) {
  return txt(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9@.]/g, '');
}

// Contact déjà présent : même e-mail, ou mêmes nom et prénom.
function chercher(contacts, nom, prenom, email) {
  const m = simplifier(email), n = simplifier(nom), p = simplifier(prenom);
  const c = contacts.find(c => (m && simplifier(c.coord).includes(m)) || (n && p && simplifier(c.nom) === n && simplifier(c.prenom) === p));
  return c ? c.id : '';
}
