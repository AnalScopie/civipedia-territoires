/**
 * Couleur Talents — réception des scores du questionnaire « Profil professionnel »
 * dans le tableau « Profil professionnel – scores de l'équipe (volontaire) », onglet Scores.
 *
 * Reçoit seulement : prénom, 17 scores (0 à 100), 3 familles, niveau de confiance.
 * Jamais les réponses aux questions ni les notes libres.
 */
const ID_TABLEAU = '14p47Ep-bInkJSIbaqQvluqj2zbPwVzHIdi9_0IxHOWc';
const ONGLET = 'Scores';
const NB_SCORES = 17;

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const prenom = String(d.prenom || '').trim().slice(0, 40);
    if (!prenom) return reponse('prenom manquant');
    const scores = (d.scores || []).map(Number);
    if (scores.length !== NB_SCORES || scores.some(function (s) { return !(s >= 0 && s <= 100); })) return reponse('scores invalides');
    const familles = (d.familles || []).slice(0, 3).map(function (f) { return String(f).slice(0, 120); });
    while (familles.length < 3) familles.push('');
    const confiance = String(d.confiance || '').slice(0, 40);
    const date = Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM/yyyy');

    const verrou = LockService.getScriptLock();
    verrou.waitLock(10000);
    try {
      SpreadsheetApp.openById(ID_TABLEAU).getSheetByName(ONGLET)
        .appendRow([date, prenom, 'Oui'].concat(scores, familles, [confiance]));
    } finally { verrou.releaseLock(); }
    return reponse('ok');
  } catch (err) {
    return reponse('erreur');
  }
}

function doGet() { return reponse('Guichet des scores Couleur Talents : en service.'); }

function reponse(t) { return ContentService.createTextOutput(t).setMimeType(ContentService.MimeType.TEXT); }
