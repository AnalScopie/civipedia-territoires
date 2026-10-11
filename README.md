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

Ajouter un territoire revient à ajouter ses deux fichiers et une ligne dans `territoires/index.json`. La page n'a pas besoin d'être modifiée.

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
| `observations` | Valeurs effectivement observées et établies, avec date, échelle, limites et sources. |
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

## Contributions

La section « Contribuer » de la page envoie deux types de messages au guichet indiqué dans `config.json` : un projet, un besoin ou une question, et le signalement d'une information. Le guichet les écrit dans la zone de vérification du tableur privé, au statut « déclaré ». Rien n'apparaît sur la carte avant vérification et export. Le nom et le contact de la personne ne sont jamais publiés. Les ressources proposées sous un projet sont un rapprochement calculé par la page (sujets et mots communs), pas une mise en relation.

## Mises à jour

Les fichiers de `territoires/` sont remplacés par l'export quand un changement réel est détecté et que les contrôles passent. Si un contrôle échoue, la version précédente reste en ligne. L'historique Git garde chaque version publiée.
