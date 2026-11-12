# Civipedia — cartes territoriales

Ce dépôt publie les cartes territoriales publiques de Civipedia. Chaque territoire est décrit par un fichier de données ; une même page affiche tous les territoires.

Adresse prévue : `territoires.civipedia.org` (en attendant : `analscopie.github.io/civipedia-territoires`). Un territoire s'ouvre par son identifiant après `#`, par exemple `#crossac`.

## Ce que contient ce dépôt, et ce qu'il ne contient pas

Ce dépôt ne contient **que des projections publiques**. Les données de travail restent privées, dans les tableurs du projet : base commune et tableurs territoriaux. Elles ne sont jamais copiées ici.

Une projection publique est produite par un export contrôlé. Elle ne retient que les données établies et autorisées à la publication, sans identifiants de sources internes, sans points en cours de vérification, sans noms de personnes privées et sans métadonnées de travail.

```
tableurs privés  →  export contrôlé  →  territoires/<id>.json  →  page publique
```

Chaque fichier JSON publié ici peut être lu par n'importe qui. C'est pour cela que le tri se fait à l'export, jamais dans la page.

## Organisation

| Fichier | Rôle |
|---|---|
| `index.html` | Page publique : carte, recherche, filtres, fiches, repères chiffrés. Elle ne contient aucune donnée de territoire. |
| `config.json` | Adresse du guichet qui reçoit les contributions (vide tant qu'il n'est pas installé : l'envoi est alors désactivé). |
| `territoires/index.json` | Registre des territoires disponibles. |
| `territoires/<id>.json` | Projection publique d'un territoire. |
| `territoires/<id>.geo.json` | Fond géographique (contours des communes), séparé des données métier. |
| `technique/carte.html` | Interface de la carte technique réservée aux comptes Civipedia. Code seul : elle ne contient aucune donnée et ne fonctionne pas ouverte directement. Le script Google de l'accès réservé y injecte, à chaque ouverture, les données lues en direct dans le tableur privé. |
| `reseau/` | Carte « Le tissage du réseau » : lieux où Civipédia agit et liens entre eux, en France et à l'international. Code et fond de carte seuls (`monde.json`, Natural Earth, domaine public) : aucune donnée. Ouverte directement, elle n'affiche qu'un message. |
| `technique/reseau-apps-script/` | Script Google de l'accès réservé à la carte du réseau : lit la grande base en direct, calcule les lieux et les liens, et les injecte dans `reseau/index.html`. Code seul, aucune donnée. |
| `technique/kleroterion-apps-script/` | Script Google de l'accès réservé au klèrôtèrion : lit les onglets de noms de la grande base en direct et enregistre les tirages dans l'onglet `Tirages_au_sort`. Code seul, aucune donnée. |
| `maquette/` | Maquette de l'application Civipédia Conseil (HTML interactif, PDF, capture). Exemples fictifs uniquement, aucune donnée réelle. Copie de celle du dépôt `civipedia-conseil`. |
| `fiche-contact/` | Fiche de contact numérique pour les salons et événements (version en ligne de la fiche papier), à remplir sur téléphone par un membre de Civipédia ou par la personne rencontrée. La page ne contient aucune donnée : les fiches partent vers le tableur privé `FICHES_CONTACT_CIVIPEDIA` par le guichet `guichet.gs` (Google Apps Script, à installer avec `installation.html`). Chaque lundi, un résumé signale les nouvelles fiches ; celles marquées OUI sont versées dans l'onglet Contacts de la base commune, au statut « À vérifier ». Adresse de la page : `fiche-contact/` (avec `?equipe` pour le mode membre, `?evenement=…&date=AAAA-MM-JJ` pour pré-remplir, par exemple dans un QR code). |

| `verifier_territoires.py` | Contrôle des cartes avant publication (voir ci-dessous). |

Ajouter un territoire revient à ajouter ses deux fichiers et une ligne dans `territoires/index.json`, puis à lancer le contrôle. La page n'a pas besoin d'être modifiée.

## Contrôle avant publication

Aucune carte n'est publiée sans passer `python3 verifier_territoires.py` (ou `python3 verifier_territoires.py crossac` pour un seul territoire). Le script lit le registre, chaque fichier de données et chaque fond géographique. Il refuse (code de sortie 1, la version précédente reste en ligne) si :

- la structure est incomplète : clé absente, identifiant en double, nature inconnue, événement sans date, élément sans source web ;
- une relation ou un renvoi (`lieu`, `organisateur`) désigne un élément absent de la carte ;
- un élément est dit « Sans adresse sur la carte » alors qu'un point est publié ;
- le projet à la une est absent de la carte, ou son inscription n'a pas d'adresse https ;
- un tracé renvoie à un projet absent, n'a pas de couleur valide ou sort du périmètre ;
- une observation n'est ni FAIT ni VÉRIFIÉ, ou un chiffre en attente publie sa valeur ;
- une adresse électronique, un numéro de téléphone ou un identifiant interne de la base commune (`MASE-…`, `OPP-…`, `APP-…`, `VEI-…`) apparaît ;
- le registre ne correspond pas au fichier (nom, instantané, logo absent).

Il signale sans bloquer les éléments sans position et les points très éloignés du périmètre.

## Circulation entre les cartes et le tableau de bord

Les deux pages se nourrissent l'une l'autre, uniquement à partir de projections déjà publiques : aucune donnée privée ne circule par ce chemin.

- **Carte → tableau de bord** : le tableau lit `territoires/index.json` et chaque carte publiée. Les événements d'une carte entrent dans la frise (sans doublon avec la base commune), rattachés à leur commune et marqués « Carte <territoire> ». Dans « Par territoire », un territoire qui a une carte porte un lien « Carte ».
- **Tableau de bord → carte** : la carte lit `tableau-de-bord/data.json` et affiche, dans « Dans la base commune Civipédia », les territoires de la base qui correspondent au territoire ou à une commune de son périmètre, leurs rendez-vous vérifiés à venir, et un lien vers le tableau filtré (`tableau-de-bord/?territoire=<nom>`).

Si l'une des deux sources manque, l'autre page s'affiche normalement, sans cette partie.

## Tableau de bord public

| Fichier | Rôle |
|---|---|
| `tableau-de-bord/index.html` | Page publique intégrable (iframe) : agenda passé et à venir en frise (événements publics et rendez-vous de l'équipe), appels qui reviennent, comptes par territoire et par expertise. Mode clair par défaut, sombre avec `?theme=sombre`, période de part et d'autre d'aujourd'hui avec `?mois=3`, `6`, `12` ou `0` (tout), territoire avec `?territoire=<nom>`. Elle ne contient aucune donnée. |
| `tableau-de-bord/data.json` | Projection publique de la base commune, produite à la demande. Elle ne contient que des événements publics vérifiés, des rendez-vous de l'équipe où seuls les membres de Civipédia ayant donné leur accord sont nommés, des appels décrits par leur source officielle et des comptes agrégés : aucun autre nom de personne, aucune coordonnée, aucun identifiant interne, aucun projet interne. |
| `tableau-de-bord/generer_data.py` | Générateur de `data.json` à partir d'un export .xlsx de la base Civipédia. Il ne lit pas la base Crossac. |

### Régénérer `data.json`

- **Source** : classeur `JOURNAL_TRAITEMENT_CIVIPEDIA_LAB` exporté en .xlsx (Fichier → Télécharger → Microsoft Excel). L'export contient des données privées : il ne doit jamais être déposé ici (`tableau-de-bord/.gitignore` l'écarte).
- **Commande** : `python3 tableau-de-bord/generer_data.py export.xlsx --sortie tableau-de-bord/data.json` (option `--exclure OPP-…` pour ne pas publier un appel). Dépendance : `openpyxl`.
- **Règles** :
  - chiffres clés = nombre de fiches de chaque onglet ;
  - « Relations documentées » = lignes de `Relations` dont les deux identifiants existent, avec type et source, hors HYPOTHÈSE ;
  - agenda (passé et à venir) = événements publics « Vérifié » datés au jour près, et rendez-vous de l'équipe Civipédia (événements reliés à Civipédia ou à l'un de ses membres), hors rendez-vous annulés ou abandonnés ;
  - rendez-vous de l'équipe (règles validées par Anne Povie le 01/11/2026, complétées le 02/11/2026) : les membres de Civipédia listés dans `MEMBRES_NOMMES` (en tête de `generer_data.py`, accord de chacun) sont nommés, sous une même écriture (« Anne Povie ») ; les autres membres et les « personnes extérieures » sont seulement comptés ; les organisations rencontrées sont nommées ; le projet n'est nommé que s'il figure dans `PROJETS_PUBLICS` (en tête de `generer_data.py`) ; lieu réduit à « En ligne » ou au territoire ; aucun lien ;
  - sources publiées = liens publics seulement (jamais un document Drive, Docs ou Canva) ;
  - appels = `Opportunites` « Clos — à guetter », FAIT ou VÉRIFIÉ, avec une source à URL ;
  - territoires et expertises = organisations et personnes reliées dans `Relations` (hors HYPOTHÈSE et « à valider »), projets et événements par `ID_territoire`.
- **Contrôles** : le script vérifie la structure attendue par `index.html` et refuse d'écrire si un identifiant interne, un nom de personne (hors membres de `MEMBRES_NOMMES`) ou une coordonnée apparaît. Il liste ce qu'il écarte.
- **Fréquence** : après chaque mise à jour intégrée des événements ou des opportunités, et au moins une fois par mois.

Intégration sur un site :

```html
<iframe id="civipedia-tdb" src="https://analscopie.github.io/civipedia-territoires/tableau-de-bord/"
        title="Tableau de bord Civipédia" style="width:100%;height:1800px;border:0" loading="lazy"></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e.origin === 'https://analscopie.github.io' && e.data && e.data.type === 'civipedia-tableau-de-bord') {
      document.getElementById('civipedia-tdb').style.height = e.data.height + 'px';
    }
  });
</script>
```

Le script est facultatif : il ajuste la hauteur de l'iframe à son contenu.

## Tirage au sort (klèrôtèrion)

| Fichier | Rôle |
|---|---|
| `kleroterion/index.html` | Machine à tirer au sort inspirée du klèrôtèrion athénien (reconstitution IRAA-CNRS) : plaquettes en colonnes, cubes blancs et noirs, procès-verbal. Hasard tiré du générateur cryptographique du navigateur. Elle ne contient aucune donnée réelle (exemple fictif). Lien en pied de la page publique. |

En haut de la page, « D'où viennent les noms ? » propose deux façons de remplir la machine :

- **Saisir les noms** : un nom par ligne, avec un groupe facultatif après un point-virgule ;
- **Choisir dans la grande base** (`JOURNAL_TRAITEMENT_CIVIPEDIA_LAB`) :
  1. *type de noms* : personnes (`Contacts`), organisations (`Organisations`) ou personnes de la vue Conseil (accès réservé), ou n'importe quel onglet collé ou ouvert en .csv ;
  2. *colonne des noms* : « Prénom + Nom » par défaut pour les personnes, sinon `Nom`, `Personne` ou toute autre colonne ;
  3. *types retenus* : une colonne (par défaut `Statut`, valeurs « Vérifié ») et les valeurs à garder, plusieurs à la fois (par exemple `Type_acteur` : Association, Collectivité) ;
  4. *noms* : liste à cocher, avec recherche, « Tout cocher » et « Tout décocher » ;
  5. *colonnes de fentes* : au hasard, ou une par groupe (`Ville`, `Organisation`, `Type_acteur`…) ;
  6. « Placer ces noms dans la machine », puis tirage. Le procès-verbal indique l'onglet, les types retenus et le nombre de noms décochés.

Après le tirage, « Copier pour la grande base » donne un tableau `ID / Nom / Groupe / Rangée / Tirage` à coller dans le classeur.

Les lignes collées restent dans le navigateur : la page n'envoie et n'enregistre rien, et rien n'est publié dans ce dépôt. Chaque personne garde son `ID_contact` entre parenthèses, ce qui rattache le résultat à sa fiche.

**Accès réservé (usage courant)** : le script Google de `technique/kleroterion-apps-script/` sert la même page aux comptes `@civipedia.org` avec les onglets `Contacts`, `Organisations` et `Conseil_Vue_Personnes` lus en direct (sans coordonnées, LinkedIn ni notes), et le bouton « Enregistrer dans la grande base » inscrit le tirage et son procès-verbal dans l'onglet `Tirages_au_sort`. Il remplace le repère `/*__DONNEES__*/` de la page, comme pour `technique/carte.html`. Installation et évolution : `technique/kleroterion-apps-script/LISEZMOI.md`. Le copier-coller ci-dessus reste possible sans compte.

## Carte du réseau (accès réservé)

La carte « Le tissage du réseau » montre l'étendue du réseau : une carte du Québec à la RDC, la France et la Belgique en encart, des fils fins colorés selon la nature des liens (démarches, événements, partenaires, personnes) et cinq chiffres.

- **Déploiement** : la page `reseau/index.html` est publiée par GitHub Pages à chaque fusion sur `main`.
- **Lien direct avec la grande base** : le script Google de `technique/reseau-apps-script/` vérifie le compte `@civipedia.org`, lit la base à chaque ouverture (résultat gardé 10 minutes), calcule les lieux et les liens, et les injecte dans la page à la place du repère `/*__DONNEES__*/`, comme pour `technique/carte.html` et le klèrôtèrion.
- **Ce que reçoit la page** : des noms de lieux (commune, territoire, pays), des comptes par lieu et des liens. Aucun nom de personne, d'organisation ou de démarche, aucun identifiant interne.

Installation, règles de calcul et évolution : `technique/reseau-apps-script/LISEZMOI.md`.

## Schéma

### `territoires/index.json`

Liste d'objets :

| Champ | Contenu |
|---|---|
| `id` | Identifiant du territoire, utilisé dans l'adresse (`#crossac`). |
| `nom` | Nom affiché. |
| `data` | Chemin du fichier de données. |
| `geo` | Chemin du fond géographique. |
| `instantane` | Date et nature de l'instantané publié. |
| `une` | Facultatif : projet mis en avant à l'ouverture de la carte. `projet` (identifiant d'un projet publié), `onglet`, `surtitre`, `titre`, `texte`, `credit` (petite mention sous le bouton d'inscription, par exemple la personne qui anime le projet, avec son accord), et `inscription` (`url`, `bouton`, `bouton_court`, `texte`). La page s'ouvre alors sur ce projet : carte cadrée sur ses lieux et ses tracés, bouton d'inscription juste en dessous, puis frise des événements passés et à venir. Le reste (recherche, chiffres, couverture, contributions) passe dans l'onglet « Tout <territoire> », adresse `#<id>/tout`. |

### `territoires/<id>.json`

| Champ | Contenu |
|---|---|
| `territoire` | `id`, `nom`, `centre` [lat, lon], `rayon_km` (périmètre d'exploration), `population` (valeur, date). |
| `instantane`, `genere_le` | Instantané des données sources et date de génération. |
| `communes` | Communes du périmètre : `nom`, `lat`, `lon` (centre de commune), `km` (distance calculée au centre du territoire), `zone`. |
| `items` | Éléments affichés (voir ci-dessous). |
| `liens` | Relations documentées entre deux éléments visibles : `a`, `b`, `t` (nature). Aucune relation n'est déduite d'une proximité ou d'une ressemblance. |
| `reperes` | Chiffres clés par domaine. |
| `themes` | Domaines travaillés sur ce territoire. |
| `indicateurs` | Ce que l'on cherche à mesurer : question servie, source, échelle, fréquence, état de disponibilité. |
| `observations` | Valeurs effectivement observées et établies, avec date, échelle, limites et sources. |
| `en_attente` | Chiffres connus mais pas encore établis : seuls leur existence et le motif d'attente sont publiés, jamais la valeur. |
| `ouverts` | Questions ouvertes publiables (desserte, information à confirmer…), sans détail interne. |
| `attendues` | Actions annoncées dont les données ne sont pas encore fournies. |
| `traces` | Itinéraires dessinés sur la carte (facultatif) : `id`, `nom`, `projet` (projet publié auquel ils appartiennent), `couleur` (#RRGGBB), `pts` (liste de [lat, lon]). Un tracé s'affiche quand son projet ou l'un de ses arrêts passe les filtres.
| `couverture` | État de la collecte par domaine. Mesure ce que contient la base, pas la réalité du territoire. |

Un élément de `items` :

| Champ | Contenu |
|---|---|
| `id` | Identifiant stable de l'élément. |
| `k` | Nature : `acteur`, `organisation`, `ressource` (lieu), `evenement`, `projet`. |
| `nom`, `type`, `desc` | Nom, type, description. |
| `commune`, `zone`, `adresse` | Localisation déclarée. |
| `pt` | Point précis [lat, lon], seulement s'il est connu. |
| `com` | Commune de rattachement quand seul le centre de commune est connu. Aucune coordonnée n'est inventée. |
| `cats` | Domaines (taxonomie commune). |
| `src` | Source publique principale : `nom`, `url`. |
| Selon la nature | `fonction`, `org` (acteur) ; `gest` (lieu) ; `debut`, `fin`, `heure`, `passe`, `lieu`, `organisateur` (événement) ; `periode`, `public`, `moyens`, `perimetre`, `resultats`, `porteurs`, `manque`, `ind` (projet). |

Un champ absent signifie que l'information n'est pas connue ou pas publiable. La page ne l'affiche pas.

## Contributions

La section « Contribuer » de la page envoie deux types de messages au guichet indiqué dans `config.json` : un projet, un besoin ou une question, et le signalement d'une information. Le guichet les écrit dans la zone de vérification du tableur privé, au statut « déclaré ». Rien n'apparaît sur la carte avant vérification et export. Le nom et le contact de la personne ne sont jamais publiés. Les ressources proposées sous un projet sont un rapprochement calculé par la page (sujets et mots communs), pas une mise en relation.

## Carte technique réservée

La carte technique (sources, qualifications, points à vérifier, analyse vers la base commune) n'est accessible qu'avec un compte `@civipedia.org`. Elle est servie par un script Google qui vérifie le compte, lit le tableur en direct et assemble la page. Seule son interface est ici ; ses données ne transitent jamais par ce dépôt.

## Mises à jour

Les fichiers de `territoires/` sont remplacés par l'export quand un changement réel est détecté et que les contrôles passent. Si un contrôle échoue, la version précédente reste en ligne. L'historique Git garde chaque version publiée.

## Application installable (PWA)

La carte peut s'installer sur un téléphone comme une application (« Ajouter à l'écran d'accueil »). Fichiers : `manifest.webmanifest`, `sw.js`, `icones/`. Le service worker va toujours chercher la version en ligne d'abord ; sa copie locale ne sert que hors connexion. Il ne s'active pas quand la carte est intégrée dans un autre site (iframe).

À l'ouverture, un bandeau propose l'installation : bouton « Installer » sur Android/Chrome, consigne « Partager → Sur l'écran d'accueil » sur iPhone. Il ne s'affiche ni dans une iframe, ni dans l'appli déjà installée ; fermé, il ne revient pas avant 7 jours sur l'appareil.
