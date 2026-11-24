# Guichet des scores de l'équipe Couleur Talents

Ce petit script Google ajoute automatiquement une ligne dans l'onglet **Scores** du tableau « Profil professionnel – scores de l'équipe (volontaire) » quand une personne clique sur « Envoyer mes scores au tableau de l'équipe » à la fin du questionnaire.

Il ne reçoit que le prénom, les 17 scores, les 3 familles et le niveau de confiance : jamais les réponses ni les notes.

## Installation (une seule fois, environ 5 minutes)

1. Ouvrir le tableau dans Google Sheets.
2. Menu **Extensions → Apps Script**.
3. Effacer le contenu de `Code.gs`, coller tout le fichier `Code.gs` de ce dossier, puis cliquer sur l'icône **Enregistrer**.
4. En haut à droite : **Déployer → Nouveau déploiement**.
5. Cliquer sur la roue dentée à côté de « Sélectionner le type », choisir **Application Web**.
6. Régler :
   - Description : « Guichet des scores »
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
7. Cliquer sur **Déployer**, puis **Autoriser l'accès** et choisir votre compte (Google affiche un avertissement « application non validée » : cliquer sur « Paramètres avancés », puis « Accéder à… »).
8. Copier l'**URL de l'application Web** (elle se termine par `/exec`) et l'envoyer à Claude, ou la coller dans `profil-professionnel/index.html`, dans `CT_SITE.guichetScores`.

Pour vérifier : ouvrir l'URL dans le navigateur, la page doit afficher « Guichet des scores Couleur Talents : en service. »

## À savoir

« Tout le monde » veut dire que la page du questionnaire peut écrire dans le tableau sans connexion. Le script vérifie ce qu'il reçoit (prénom, 17 nombres entre 0 et 100), mais quelqu'un de mal intentionné pourrait ajouter de fausses lignes : il suffit alors de les supprimer dans le tableau.
