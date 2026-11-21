# Carte épurée

Version épurée, au style « carnet », des cartes territoriales : Crossac, Pontchâteau, Chevaigné, Vertou et tout territoire ajouté au registre. Adresse : `sobre/`, avec le territoire après `#` (par exemple `…/sobre/#vertou`). Le menu « Territoire » permet de passer de l'un à l'autre.

Elle lit les **mêmes données publiées** que la carte principale (`territoires/`, `tableau-de-bord/data.json`). Elle reste donc reliée à la grande base et se met à jour en même temps. Elle n'affiche ni le nom de l'association ni celui de l'animateur du projet. Les logos des collectivités sont conservés.

Elle montre le territoire lui-même : associations, lieux, services, chiffres. Un projet mis « à la une » sur la carte principale (le WoodyBus à Crossac) n'y figure pas : le projet, ses lieux propres (arrêts, garage), ses itinéraires et ses indicateurs sont retirés à l'affichage. Les vues simplifiées sans projet (« Le bourg » à Chevaigné, « Beautour » à Vertou) sont conservées.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | La page. **Ne pas modifier à la main** : elle est produite par `generer.py`. |
| `generer.py` | Produit `index.html` à partir de la carte principale (`../index.html`). Relancer après toute modification de la carte principale : `python3 sobre/generer.py`. |
| `config.json` | `territoires` (facultatif) : limiter la carte à certains territoires, par exemple `["crossac"]` ; sans cette ligne, tous les territoires du registre sont proposés. `guichet` : adresse du guichet courriel (vide tant qu'il n'est pas installé). |
| `manifest.webmanifest`, `sw.js`, `icones/` | Application installable : nom « Carte », icône carte au trésor. Le service worker garde une copie de la page et des données de chaque territoire du registre, pour ouvrir la carte sans réseau ; en ligne, il charge toujours la dernière version publiée. Les icônes sont dessinées à partir de l'emblème de l'en-tête. |
| `guichet-mail.gs` | Script Google qui reçoit le formulaire et l'envoie par courriel. |

## Formulaire « Contribuer »

- **Tant que `guichet` est vide** : le bouton « Envoyer » ouvre la messagerie du visiteur avec un message prêt, adressé à la signataire de la carte. Le visiteur n'a plus qu'à l'envoyer.
- **Une fois le guichet installé** : le message part directement, sans ouvrir la messagerie, et arrive dans la boîte Gmail du compte qui a installé le guichet.

### Installer le guichet (une fois, environ 5 minutes)

1. Connectée au compte Gmail qui doit recevoir les messages, ouvrir <https://script.google.com> → **Nouveau projet**.
2. Remplacer le contenu de `Code.gs` par celui de `guichet-mail.gs`, puis enregistrer.
3. **Déployer → Nouveau déploiement** → type **Application Web**. Exécuter en tant que : **Moi**. Qui a accès : **Tout le monde**. Autoriser l'envoi de courriels quand Google le demande.
4. Copier l'adresse de l'application Web (elle finit par `/exec`) et la coller dans `sobre/config.json`, à la place de `""` après `"guichet":`.

Le guichet ne stocke rien : chaque envoi devient un courriel. Si le visiteur a laissé une adresse électronique, « Répondre » lui écrit directement.

## Signature

La page est signée « Povie-Skopein ». Le lien « Contact » ouvre un courriel vers l'adresse de la signataire. Elle n'est pas écrite telle quelle dans la page, ce qui limite sa collecte par les robots.

## Installer la carte sur un téléphone

- **Android (Chrome)** : ouvrir `…/sobre/`. Un bandeau « Installer la carte » apparaît en bas de l'écran ; sinon, menu ⋮ → « Installer l'application » ou « Ajouter à l'écran d'accueil ».
- **iPhone (Safari)** : ouvrir `…/sobre/`, toucher Partager ↑ puis « Sur l'écran d'accueil ».

L'icône « Carte » s'ajoute à l'écran d'accueil. La carte s'ouvre en plein écran, sans barre de navigateur, et reste consultable sans réseau. Elle est indépendante de l'appli de la carte principale.
