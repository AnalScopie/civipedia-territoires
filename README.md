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
| `outils/verifier_mesures.py` | Contrôle des valeurs chiffrées (`mesures`) avant publication ; peut aussi en sortir une table CSV. |
| `technique/carte.html` | Interface de la carte technique réservée aux comptes Civipedia. Code seul : elle ne contient aucune donnée et ne fonctionne pas ouverte directement. Le script Google de l'accès réservé y injecte, à chaque ouverture, les données lues en direct dans le tableur privé. |
| `maquette/` | Maquette de l'application Civipédia Conseil (HTML interactif, PDF, capture). Exemples fictifs uniquement, aucune donnée réelle. Copie de celle du dépôt `civipedia-conseil`. |
| `fiche-contact/` | Fiche de contact numérique pour les salons et événements (version en ligne de la fiche papier), à remplir sur téléphone par un membre de Civipédia ou par la personne rencontrée. La page ne contient aucune donnée : les fiches partent vers le tableur privé `FICHES_CONTACT_CIVIPEDIA` par le guichet `guichet.gs` (Google Apps Script, à installer avec `installation.html`). Chaque lundi, un résumé signale les nouvelles fiches ; celles marquées OUI sont versées dans l'onglet Contacts de la base commune, au statut « À vérifier ». Adresse de la page : `fiche-contact/` (avec `?equipe` pour le mode membre, `?evenement=…&date=AAAA-MM-JJ` pour pré-remplir, par exemple dans un QR code). |

Ajouter un territoire revient à ajouter ses deux fichiers et une ligne dans `territoires/index.json`. La page n'a pas besoin d'être modifiée.

## Tableau de bord public

| Fichier | Rôle |
|---|---|
| `tableau-de-bord/index.html` | Page publique intégrable (iframe) : agenda passé et à venir en frise (événements publics et rendez-vous de l'équipe), appels qui reviennent, comptes par territoire et par expertise. Mode clair par défaut, sombre avec `?theme=sombre`, période de part et d'autre d'aujourd'hui avec `?mois=3`, `6`, `12` ou `0` (tout). Elle ne contient aucune donnée. |
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
| `observations` | Valeurs effectivement observées et établies, avec date, échelle, limites et sources. Les chiffres y sont aussi rangés sous forme de nombres, avec unité et date, dans `mesures` (voir plus bas). |
| `en_attente` | Chiffres connus mais pas encore établis : seuls leur existence et le motif d'attente sont publiés, jamais la valeur. |
| `ouverts` | Questions ouvertes publiables (desserte, information à confirmer…), sans détail interne. |
| `attendues` | Actions annoncées dont les données ne sont pas encore fournies. |
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

### Valeurs chiffrées des observations (`mesures`)

Le texte `valeur` d'une observation (« 2 808 (2012) → 2 952 (2017) → 2 974 (2023) ») reste ce que la page affiche. Les mêmes chiffres sont aussi rangés dans `mesures`, une ligne par nombre, pour qu'ils puissent être comparés, additionnés ou suivis dans le temps (tableaux de bord, observatoire, modèles d'analyse).

| Champ | Contenu |
|---|---|
| `variable` | Ce qui est mesuré, en code stable (`population`, `taux_pauvrete`, `prix_eau_potable_ttc_120m3`…). Une même variable garde toujours la même unité. |
| `valeur` | Le nombre (point décimal). |
| `min`, `max` | À la place de `valeur` quand la source donne une fourchette (« 13 à 14 mg/L ») ou un maximum (« jusqu'à 25 mg/L »). |
| `unite` | Unité, prise dans la liste `UNITES` de `outils/verifier_mesures.py` (`habitants`, `%`, `€/m³`, `mg/L`…). |
| `date` | Date de la mesure : `AAAA`, `AAAA-MM` ou `AAAA-MM-JJ`, aussi précise que la source et pas plus. |
| `date_fin` | Fin de la période, quand la mesure couvre une période. |
| `date_nature` | Quand `date` n'est pas la date de la mesure elle-même : `prix_au` (prix en vigueur à cette date), `consultation` (état constaté à la date de consultation), `mise_a_jour_source` (date de mise à jour de la page source). |
| `echelle` | Seulement si elle diffère de celle de l'observation (deux sites, commune et CC…). |
| `seuil` | Limite de référence citée avec la mesure (limite de qualité de l'eau…), dans la même unité. |

Règles :

- **Aucun chiffre n'est calculé ni deviné.** Chaque nombre et chaque date doivent se lire dans le texte publié de l'observation (`valeur`, `limites`, `date`). Une évolution (« +7 % ») n'est pas recopiée, elle se recalcule. Un chiffre sans date connue (« 8 auparavant ») reste dans le texte seulement.
- Une observation sans chiffre (description d'un réseau, niveau d'alerte « Crise ») n'a pas de `mesures`.
- Avant chaque publication : `python3 outils/verifier_mesures.py`. Le script refuse un nombre ou une date absents du texte, une unité inconnue, une variable qui change d'unité, deux chiffres contradictoires pour la même variable, la même date et la même échelle. Avec `--csv mesures.csv`, il écrit aussi la table à plat (une ligne par mesure : variable, valeur, unité, date, échelle, source).
- Le tableur privé et l'export doivent conserver ces colonnes, sinon la prochaine génération les efface.

## Contributions

La section « Contribuer » de la page envoie deux types de messages au guichet indiqué dans `config.json` : un projet, un besoin ou une question, et le signalement d'une information. Le guichet les écrit dans la zone de vérification du tableur privé, au statut « déclaré ». Rien n'apparaît sur la carte avant vérification et export. Le nom et le contact de la personne ne sont jamais publiés. Les ressources proposées sous un projet sont un rapprochement calculé par la page (sujets et mots communs), pas une mise en relation.

## Carte technique réservée

La carte technique (sources, qualifications, points à vérifier, analyse vers la base commune) n'est accessible qu'avec un compte `@civipedia.org`. Elle est servie par un script Google qui vérifie le compte, lit le tableur en direct et assemble la page. Seule son interface est ici ; ses données ne transitent jamais par ce dépôt.

## Mises à jour

Les fichiers de `territoires/` sont remplacés par l'export quand un changement réel est détecté et que les contrôles passent. Si un contrôle échoue, la version précédente reste en ligne. L'historique Git garde chaque version publiée.
