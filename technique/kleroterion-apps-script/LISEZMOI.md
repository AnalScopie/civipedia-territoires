# Klèrôtèrion : accès réservé à la grande base

Ce script Google sert le klèrôtèrion aux comptes `@civipedia.org` avec les onglets de noms de la grande base (`JOURNAL_TRAITEMENT_CIVIPEDIA_LAB`) lus en direct : `Contacts` (personnes), `Organisations` et `Conseil_Vue_Personnes` (personnes, vue Conseil). L'utilisateur choisit le type de noms, la colonne des noms, les types à garder et coche les noms. Chaque tirage s'enregistre dans l'onglet `Tirages_au_sort` de la même base.

```
grande base (onglets de noms)  →  script Google (compte vérifié)  →  page kleroterion/ + données  →  tirage
                                                                                              ↓
grande base (Tirages_au_sort)  ←────────────  « Enregistrer dans la grande base »  ←──────────┘
```

La page elle-même n'est pas copiée dans le script. Le script la lit à chaque ouverture sur GitHub Pages (`kleroterion/index.html`), donc toute amélioration de la page publiée sur `main` s'applique sans redéployer.

## Ce qui transite

- **Vers la page** : uniquement les colonnes listées dans `ONGLETS` (`Code.gs`) :
  - `Contacts` : `ID_contact, Nom, Prénom, Organisation, Fonction, Ville, Statut` ;
  - `Organisations` : `ID_organisation, Nom, Type_acteur, Domaine, Ville, Statut` ;
  - `Conseil_Vue_Personnes` : `ID_contact, Personne, Organisation (fiche), Type de structure, Lieu, Domaines, Statut de la fiche`.

  Les coordonnées, LinkedIn, notes, sources et dates ne sont jamais transmises. Les lignes sans identifiant sont ignorées ; un onglet absent de la base est simplement omis.
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
6. Ouvrir l'URL `…/exec` donnée par le déploiement. La page doit indiquer « Grande base lue en direct » et proposer les types de noms. `…/exec?onglet=Organisations` ne charge qu'un type. Cette URL est l'adresse du tirage dans la grande base : à garder dans les favoris de l'équipe, pas sur le site public.

Réglages facultatifs (Paramètres du projet → Propriétés du script) :

| Propriété | Défaut |
|---|---|
| `BASE_ID` | identifiant de `JOURNAL_TRAITEMENT_CIVIPEDIA_LAB` |
| `PAGE_URL` | `https://analscopie.github.io/civipedia-territoires/kleroterion/` |

## Faire évoluer

- **Ajouter un type de noms** (un autre onglet) : ajouter une entrée dans `ONGLETS` avec les colonnes à transmettre (la première doit être l'identifiant), puis redéployer (Gérer les déploiements → modifier → nouvelle version). Pour un libellé plus lisible dans la liste « Type de noms », l'ajouter aussi dans `TYPES` en tête du script de `kleroterion/index.html`.
- **Modifier la page** : modifier `kleroterion/index.html` dans ce dépôt ; aucun redéploiement du script n'est nécessaire.
- La page doit garder le repère `/*__DONNEES__*/` dans son script : le script le remplace par `const BRUT = { "Contacts": [[en-têtes], [ligne], …], "Organisations": […], … };`.
