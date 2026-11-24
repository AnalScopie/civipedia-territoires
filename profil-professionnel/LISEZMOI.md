# Profil professionnel Couleur Talents

Questionnaire d'exploration professionnelle de Couleur Talents : 53 questions, restitution avec radar, environnements de travail et 3 familles de métiers à explorer parmi 11. Version du 13/10/2026 (modèle CT-PP-0.1, questionnaire Q-0.1).

## Ce que la page fait, et ne fait pas

- Tout se calcule dans le navigateur de la personne. **Rien n'est envoyé ni enregistré** : les réponses disparaissent à la fermeture de la page. La personne peut télécharger sa restitution en PDF.
- Ce n'est ni un test psychologique ni un diagnostic : les résultats décrivent des préférences déclarées et des pistes à explorer.
- Le référentiel (questions, dimensions, familles, seuils) est un instantané du classeur Google Sheets « Profil professionnel Couleur Talents — Référentiel V1 ». Toute évolution se fait dans le classeur, puis l'instantané est régénéré dans la page.

## Adresse

`https://analscopie.github.io/civipedia-territoires/profil-professionnel/`

## L'intégrer au site de Couleur Talents (WordPress)

Dans la page WordPress, ajouter un bloc « HTML personnalisé » avec :

```html
<iframe id="ct-profil" src="https://analscopie.github.io/civipedia-territoires/profil-professionnel/"
  style="width:100%;border:0;min-height:900px" title="Profil professionnel Couleur Talents"></iframe>
<script>
addEventListener("message", function (e) {
  if (e.data && e.data.type === "ct-profil-height") document.getElementById("ct-profil").style.height = e.data.height + "px";
});
</script>
```

La page envoie sa hauteur au site pour que le cadre s'ajuste sans barre de défilement.

## Lien avec le reste

Les 11 familles doivent mener aux offres de Couleur Talents que l'équipe peut réellement assurer (modèle F3 du dépôt privé `civipedia-conseil`). Le champ « offre » de chaque famille est vide tant que la table familles → offres n'est pas validée par Couleur Talents. Les noms des intervenants n'apparaissent jamais dans cette page.
