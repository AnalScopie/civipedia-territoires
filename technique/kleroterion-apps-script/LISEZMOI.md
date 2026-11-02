# Klèrôtèrion : accès réservé à la grande base

Ce script Google sert le klèrôtèrion aux comptes `@civipedia.org` avec l'onglet `Contacts` de la grande base (`JOURNAL_TRAITEMENT_CIVIPEDIA_LAB`) lu en direct. Chaque tirage s'enregistre dans l'onglet `Tirages_au_sort` de la même base.

```
grande base (Contacts)  →  script Google (compte vérifié)  →  page kleroterion/ + données  →  tirage
                                                                                              ↓
grande base (Tirages_au_sort)  ←────────────  « Enregistrer dans la grande base »  ←──────────┘
```

La page elle-même n'est pas copiée dans le script. Le script la lit à chaque ouverture sur GitHub Pages (`kleroterion/index.html`), donc toute amélioration de la page publiée sur `main` s'applique sans redéployer.

## Ce qui transite

- **Vers la page** : uniquement `ID_contact, Nom, Prénom, Organisation, Fonction, Ville, Statut` (liste `ONGLETS` dans `Code.gs`). Les colonnes `Coordonnées`, `LinkedIn_URL`, `Notes`, `Source` et les dates ne sont pas transmises. Les lignes sans `ID_contact` sont ignorées.
- **Vers la base** : une ligne par personne désignée dans `Tirages_au_sort` : `ID_tirage` (TIR-aaaammjj-hhmmss), date, compte qui a enregistré, onglet, filtre, colonnes, sièges demandés, nombre de candidats, `ID_contact`, nom, groupe, rangée, et le procès-verbal complet (sur la première ligne du tirage). L'onglet est créé au premier enregistrement.
- Rien n'est écrit dans ce dépôt.

## Installation (une seule fois)

1. Avec un compte **@civipedia.org** qui peut modifier la grande base, ouvrir <https://script.google.com> → **Nouveau projet**, le nommer « Klèrôtèrion — grande base ».
2. Remplacer le contenu de `Code.gs` par celui de ce dossier.
3. **Paramètres du projet** → cocher « Afficher le fichier manifeste appsscript.json » → remplacer son contenu par `appsscript.json` de ce dossier.
4. **Déployer** → **Nouveau déploiement** → type **Application Web** :
   - Exécuter en tant que : **Moi** ;
   - Qui a accès : **Tous les utilisateurs de civipedia.org**.
5. Autoriser les accès demandés (tableurs, requêtes externes pour lire la page, adresse e-mail pour vérifier le compte).
6. Ouvrir l'URL `…/exec` donnée par le déploiement. L'onglet Contacts doit apparaître comme « lu en direct ». Cette URL est l'adresse du tirage dans la grande base : à garder dans les favoris de l'équipe, pas sur le site public.

Réglages facultatifs (Paramètres du projet → Propriétés du script) :

| Propriété | Défaut |
|---|---|
| `BASE_ID` | identifiant de `JOURNAL_TRAITEMENT_CIVIPEDIA_LAB` |
| `PAGE_URL` | `https://analscopie.github.io/civipedia-territoires/kleroterion/` |

## Faire évoluer

- **Ajouter un onglet de personnes** (par exemple `Conseil_Vue_Personnes`) : ajouter une entrée dans `ONGLETS` avec les colonnes à transmettre (la première doit être l'identifiant), redéployer (Gérer les déploiements → modifier → nouvelle version), puis ouvrir `…/exec?onglet=Conseil_Vue_Personnes`.
- **Modifier la page** : modifier `kleroterion/index.html` dans ce dépôt ; aucun redéploiement du script n'est nécessaire.
- La page doit garder le repère `/*__DONNEES__*/` dans son script : le script le remplace par `const BRUT = { "Contacts": [[en-têtes], [ligne], …] };`.
