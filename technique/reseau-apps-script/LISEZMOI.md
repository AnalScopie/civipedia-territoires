# Carte du réseau : accès réservé, reliée en direct à la grande base

Ce script Google sert la carte « Le tissage du réseau » aux comptes `@civipedia.org`. À chaque ouverture, il lit la grande base (`JOURNAL_TRAITEMENT_CIVIPEDIA_LAB`), place les éléments sur des lieux, relie les lieux à partir de l'onglet `Relations`, et injecte le résultat dans la page publiée sur GitHub Pages (`reseau/index.html`).

```
grande base  →  script Google (compte vérifié, calcul)  →  page reseau/ (GitHub Pages) + résultat  →  carte
```

- **La page est déployée par GitHub** : toute modification de `reseau/index.html` fusionnée sur `main` est en ligne une ou deux minutes plus tard, sans toucher au script.
- **Les données restent dans le script** : la page ne reçoit que des lieux (commune, territoire ou pays), des comptes par lieu et les liens entre lieux. Aucun nom de personne, d'organisation ou de démarche, aucun identifiant de la base, aucune note.
- Ouverte directement sur GitHub Pages, la page affiche seulement un message : elle ne contient aucune donnée.

## Règles de calcul

- Un élément n'est placé que si la base lui donne un lieu : ville de la fiche, territoire, territoire relié, ou, pour une démarche, la ville de l'organisation cliente (commanditaire, client, destinataire de la proposition). Les relations « HYPOTHÈSE » sont écartées.
- **Position d'un lieu** : le point écrit dans la fiche territoire s'il y en a un, sinon le géocodeur de Google (centre de la commune, du département ou du pays). Chaque position n'est demandée qu'une fois, puis gardée dans les propriétés du script.
- Un territoire rejoint la ville la plus proche déjà sur la carte : à moins de 6 km quand son point est l'adresse d'un siège, à moins de 80 km quand c'est le centre d'un département, d'une région ou d'une intercommunalité. Un pays garde son propre point.
- **Couleur d'un lien** : la nature la plus fréquente des relations qu'il regroupe (démarches, événements, partenaires, personnes).
- Les liens que la base ne situe pas sur une ville (Afrique francophone, Belgique) sont réglés en tête de `Code.gs`, dans `LIENS_SANS_LIEU`.
- Le résultat est gardé 10 minutes. Pour forcer un nouveau calcul tout de suite, ajouter `?rafraichir=1` à l'adresse.

## Installation (une seule fois)

1. Avec un compte **@civipedia.org** qui peut lire la grande base, ouvrir <https://script.google.com> → **Nouveau projet**, le nommer « Carte du réseau ».
2. Remplacer le contenu de `Code.gs` par celui de ce dossier.
3. **Paramètres du projet** → cocher « Afficher le fichier manifeste appsscript.json » → remplacer son contenu par `appsscript.json` de ce dossier.
4. Dans l'éditeur, choisir la fonction `preparer` et cliquer sur **Exécuter** : autoriser les accès demandés (lecture du tableur, requêtes externes pour lire la page, adresse e-mail pour vérifier le compte). Le journal affiche le nombre de lieux et de liens ; les positions sont mises en mémoire.
5. **Déployer** → **Nouveau déploiement** → type **Application Web** :
   - Exécuter en tant que : **Moi** ;
   - Qui a accès : **Tous les utilisateurs de civipedia.org**.
6. Ouvrir l'adresse `…/exec` donnée par le déploiement. C'est l'adresse de la carte du réseau : à garder dans les favoris de l'équipe, pas sur le site public.

Réglages facultatifs (Paramètres du projet → Propriétés du script) :

| Propriété | Défaut |
|---|---|
| `BASE_ID` | identifiant de `JOURNAL_TRAITEMENT_CIVIPEDIA_LAB` |
| `PAGE_URL` | `https://analscopie.github.io/civipedia-territoires/reseau/` |

## Faire évoluer

- **Modifier l'apparence** : modifier `reseau/index.html` dans ce dépôt ; aucun redéploiement du script. La page doit garder le repère `/*__DONNEES__*/`.
- **Modifier le calcul** : modifier `Code.gs` ici, le recoller dans le projet Google, puis Gérer les déploiements → modifier → nouvelle version.
- **Une position fausse** (homonyme) : corriger la ville dans la base, ou supprimer la propriété `geo:…` correspondante dans les propriétés du script pour qu'elle soit redemandée.
