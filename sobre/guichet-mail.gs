/**
 * Guichet courriel de la carte épurée (sobre/).
 *
 * Reçoit les envois du formulaire « Contribuer » et les transmet par courriel
 * au compte Google qui l'a installé (celui qui doit recevoir les messages).
 * Rien n'est stocké. Installation : voir sobre/README.md.
 */

const LIBELLES = {
  type: "Type", texte: "Message", domaines: "Sujets", recherche: "Ce que je cherche",
  etape: "Étape", domaine: "Sujet", preuve: "Source ou preuve", qualite: "Je suis",
  organisation: "Organisation", nom: "Nom", contact: "Contact", objet: "Objet",
  proposees: "Éléments proposés par la carte"
};

function doPost(e) {
  try {
    const p = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    // Robots : champ caché rempli, ou formulaire rempli en moins de 3 secondes.
    if (p.site_web || (p.duree_ms && p.duree_ms < 3000)) return reponse({ ok: true });
    const texte = String(p.texte || "").trim();
    if (texte.length < 10) return reponse({ ok: false, erreur: "Écrivez au moins une phrase." });
    if (!p.accord) return reponse({ ok: false, erreur: "Cochez la case d'accord pour envoyer." });

    const reference = "C-" + Utilities.formatDate(new Date(), "Europe/Paris", "yyyyMMdd-HHmmss");
    const territoire = String(p.territoire || "").slice(0, 80);
    const lignes = ["Territoire : " + territoire, "Référence : " + reference, ""];
    Object.keys(LIBELLES).forEach(function (k) {
      const v = Array.isArray(p[k]) ? p[k].join(", ") : String(p[k] || "");
      if (v.trim()) lignes.push(LIBELLES[k] + " : " + v.slice(0, 4000));
    });
    const sujet = "[Carte " + territoire + "] " + (p.genre === "demande" ? "Projet" : "Information à signaler");
    const options = {};
    const contact = String(p.contact || "").trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) options.replyTo = contact;
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), sujet, lignes.join("\n"), options);
    return reponse({ ok: true, reference: reference });
  } catch (err) {
    return reponse({ ok: false, erreur: "L'envoi n'a pas abouti. Réessayez plus tard." });
  }
}

function reponse(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
