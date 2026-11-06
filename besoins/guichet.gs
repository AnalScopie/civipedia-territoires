/**
 * Civipédia — guichet des contributions d'habitants (module Besoins territoriaux).
 *
 * À coller dans le tableur CIVIPEDIA_BESOINS_TERRITORIAUX : Extensions → Apps Script.
 * Chaque contribution reçue par la page besoins/ devient :
 *   - une ligne Sources  (famille HABITANTS, méthode FORMULAIRE_PUBLIC, privée) ;
 *   - une ligne Signaux  (statut de contribution RECU, non vérifiée, privée).
 * Rien n'est publié : une contribution ne peut l'être qu'après vérification humaine.
 * Aucune donnée personnelle n'est demandée ; le guichet ne fait qu'AJOUTER des lignes.
 */

const TERRITOIRES = ['MASE-T-0025', 'MASE-T-0026']; // territoires ouverts aux contributions (onglet Territoires_suivis)

function doGet() {
  return ContentService.createTextOutput('Guichet des contributions Civipédia (besoins territoriaux) : en service.');
}

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.site_web) return repondre({ ok: true });                       // case piège invisible
    if (Number(d.duree_ms) > 0 && Number(d.duree_ms) < 3000) return repondre({ ok: true }); // envoi trop rapide pour un humain
    if (d.accord !== true) return repondre({ ok: false, erreur: "Cochez la case d'accord pour envoyer." });
    const territoire = txt(d.territoire);
    if (TERRITOIRES.indexOf(territoire) < 0) return repondre({ ok: false, erreur: 'Choisissez votre territoire.' });
    const besoin = txt(d.besoin);
    if (besoin.length < 5) return repondre({ ok: false, erreur: 'Décrivez le besoin ou le problème en quelques mots.' });
    const themes = lireThemes();
    const theme = themes.indexOf(txt(d.theme)) >= 0 ? txt(d.theme) : 'Autre';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(txt(d.date)) ? txt(d.date) : '';
    const lien = /^https?:\/\/\S+$/.test(txt(d.lien)) ? txt(d.lien) : '';

    const verrou = LockService.getScriptLock();
    verrou.waitLock(20000);
    try {
      const uid = txt(d.uid).slice(0, 80);
      const fSignaux = onglet('Signaux');
      const notesSig = fSignaux.getLastRow() > 1 ? valeurs(fSignaux, 'notes') : [];
      if (uid && notesSig.some(n => String(n).indexOf('envoi:' + uid) >= 0)) return repondre({ ok: true });

      const maintenant = new Date().toISOString();
      const fSources = onglet('Sources');
      const sourceId = prochainId('SRC', fSources.getLastRow() > 1 ? valeurs(fSources, 'source_id') : []);
      ajouter(fSources, {
        source_id: sourceId, family: 'HABITANTS', source_type: 'contribution en ligne',
        source_title: 'Contribution d\'habitant du ' + maintenant.slice(0, 10), source_url: '', source_author: '',
        publication_date: maintenant.slice(0, 10), access_date: maintenant.slice(0, 10), source_reference: '', source_excerpt: '',
        collection_method: 'FORMULAIRE_PUBLIC', verification_status: 'NON_VERIFIE', source_group_id: '',
        independence_level: 'INCONNU', privacy_status: 'INTERNE', base_source_id: '',
        created_at: maintenant, created_by: 'formulaire public', updated_at: '', validated_at: '', validated_by: '',
        archive_status: 'ACTIF', notes: '',
      });
      const signalId = prochainId('SIG', fSignaux.getLastRow() > 1 ? valeurs(fSignaux, 'signal_id') : []);
      ajouter(fSignaux, {
        signal_id: signalId, territory_id: territoire, source_id: sourceId, date_observed: date,
        raw_content: txt(d.description), summary: besoin, theme: theme, subtheme: '',
        signal_type: ['BESOIN_EXPRIME', 'PROBLEME_SIGNALE', 'PROPOSITION', 'QUESTION'].indexOf(txt(d.type)) >= 0 ? txt(d.type) : 'BESOIN_EXPRIME',
        origin: 'HUMAIN', verification_status: 'NON_VERIFIE', privacy_status: 'INTERNE', contribution_status: 'RECU',
        reactions_count: '', comments_count: '', collector: 'formulaire public',
        created_at: maintenant, created_by: 'formulaire public', updated_at: '', validated_at: '', validated_by: '',
        archive_status: 'ACTIF',
        notes: (lien ? 'Lien proposé par la personne (à vérifier, non enregistré comme source) : ' + lien + ' · ' : '') + 'envoi:' + uid,
      });
      return repondre({ ok: true, reference: signalId });
    } finally {
      verrou.releaseLock();
    }
  } catch (err) {
    return repondre({ ok: false, erreur: "La contribution n'a pas pu être enregistrée. Réessayez dans un instant." });
  }
}

// ---------- Outils ----------

function onglet(nom) {
  const f = SpreadsheetApp.getActive().getSheetByName(nom);
  if (!f) throw new Error('Onglet ' + nom + ' introuvable');
  return f;
}

function entetes(f) {
  return f.getRange(1, 1, 1, f.getLastColumn()).getValues()[0].map(String);
}

function valeurs(f, colonne) {
  const i = entetes(f).indexOf(colonne);
  if (i < 0) throw new Error('Colonne ' + colonne + ' introuvable');
  return f.getRange(2, i + 1, f.getLastRow() - 1, 1).getValues().map(l => String(l[0]));
}

/** Ajoute une ligne en plaçant chaque valeur sous la colonne du même nom ; refuse si une colonne manque. */
function ajouter(f, objet) {
  const ent = entetes(f);
  Object.keys(objet).forEach(k => { if (ent.indexOf(k) < 0) throw new Error('Colonne ' + k + ' absente de ' + f.getName()); });
  const ligne = ent.map(h => (h in objet ? objet[h] : ''));
  // Écrit comme du texte brut : un contenu qui commence par = n'est pas lu comme une formule.
  const r = f.getLastRow() + 1;
  f.getRange(r, 1, 1, ligne.length).setNumberFormat('@').setValues([ligne]);
}

function prochainId(prefixe, existants) {
  const max = existants.reduce((m, id) => {
    const r = new RegExp('^' + prefixe + '-(\\d+)$').exec(id);
    return r ? Math.max(m, Number(r[1])) : m;
  }, 0);
  return prefixe + '-' + String(max + 1).padStart(4, '0');
}

function lireThemes() {
  const f = SpreadsheetApp.getActive().getSheetByName('Thèmes');
  if (!f || f.getLastRow() < 2) return ['Autre'];
  return f.getRange(2, 1, f.getLastRow() - 1, 1).getValues().map(l => String(l[0]).trim()).filter(String);
}

function txt(v) {
  return v === null || v === undefined ? '' : String(v).trim().slice(0, 4000);
}

function repondre(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet)).setMimeType(ContentService.MimeType.JSON);
}
