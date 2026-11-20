#!/usr/bin/env python3
"""Génère sobre/index.html, la version épurée de la carte de Crossac.

Usage (depuis la racine du dépôt) :
    python3 sobre/generer.py

La page est produite à partir de index.html : toute correction faite à la carte
principale se retrouve ici en relançant ce script. Elle lit les MÊMES données
publiées (territoires/, tableau-de-bord/data.json) : elle reste reliée à la
grande base et se met à jour en même temps que la carte principale.

Différences avec la carte principale :
  - style « carnet » épuré (police machine à écrire, papier ligné, traits fins) ;
  - aucune mention de Civipédia ni de l'animateur du projet ; les logos des
    collectivités sont conservés ;
  - seuls les territoires listés dans sobre/config.json sont proposés ;
  - le formulaire envoie par courriel (guichet Google Apps Script de
    sobre/guichet-mail.gs, adresse dans sobre/config.json) ; tant que le guichet
    n'est pas installé, il ouvre la messagerie du visiteur avec le message prêt ;
  - signature Povie-Skopein et lien « Contact » ;
  - application installable (PWA) propre : nom « Carte », icône carte au trésor,
    manifeste et service worker de sobre/ (fonctionne aussi hors connexion).

Chaque remplacement est vérifié : si index.html a changé au point qu'un passage
n'est plus trouvé, le script s'arrête et n'écrit rien.
"""
import os
import re
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(RACINE, "index.html")
CIBLE = os.path.join(RACINE, "sobre", "index.html")

html = open(SOURCE, encoding="utf-8").read()


def remplacer(ancien, nouveau, nb=1):
    global html
    n = html.count(ancien)
    if n != nb:
        sys.exit(f"ERREUR : passage trouvé {n} fois au lieu de {nb} :\n  {ancien[:120]!r}")
    html = html.replace(ancien, nouveau)


def remplacer_re(motif, nouveau, flags=re.S):
    global html
    html, n = re.subn(motif, nouveau, html, count=1, flags=flags)
    if n != 1:
        sys.exit(f"ERREUR : motif introuvable : {motif[:120]!r}")


# ---------- En-tête : emblème, icône d'onglet, application installable ----------
EMBLEME = ('<svg class="embleme" viewBox="0 0 48 40" width="40" height="33" aria-hidden="true">'
           '<path d="M3 7 L16 3 L32 8 L45 4 L45 33 L32 37 L16 32 L3 36 Z" fill="#efe6cf" stroke="#232323" stroke-width="1.6" stroke-linejoin="round"/>'
           '<path d="M16 3 V32 M32 8 V37" stroke="#232323" stroke-width="1" opacity=".5"/>'
           '<path d="M8 28 C12 22 14 26 19 21 S27 14 30 18 S35 22 37.5 14.5" fill="none" stroke="#b5523b" stroke-width="1.5" stroke-dasharray="2.2 2.2" stroke-linecap="round"/>'
           '<path d="M35.5 10.5 l4 4 m0 -4 l-4 4" stroke="#b5523b" stroke-width="1.9" stroke-linecap="round"/>'
           '<circle cx="8" cy="28" r="1.7" fill="#232323"/>'
           '<path d="M9.5 8.5 l1 2.4 2.4 1 -2.4 1 -1 2.4 -1 -2.4 -2.4 -1 2.4 -1z" fill="#232323"/>'
           '<path d="M24 26.5 q2 -1.5 4 0 M37 26 q1.6 -1.2 3.2 0" fill="none" stroke="#232323" stroke-width=".9" opacity=".6"/>'
           '</svg>')
FAVICON = "data:image/svg+xml," + EMBLEME.replace(' class="embleme"', ' xmlns="http://www.w3.org/2000/svg"').replace(' aria-hidden="true"', '').replace('"', "'").replace("#", "%23").replace("<", "%3C").replace(">", "%3E")
# Application installable propre à la carte épurée : manifeste, icônes et
# service worker de sobre/ (les chemins relatifs pointent dans ce dossier).
remplacer_re(r'<link rel="manifest".*?</head>',
             '<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#f5f2ea">'
             f'<link rel="icon" href="{FAVICON}"><link rel="apple-touch-icon" href="icones/apple-touch-icon.png">'
             '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
             '<meta name="apple-mobile-web-app-title" content="Carte"><meta name="apple-mobile-web-app-status-bar-style" content="default"></head>')
remplacer('family=Public+Sans:wght@400;500;600;700;800',
          'family=Courier+Prime:ital,wght@0,400;0,700;1,400')
remplacer_re(r'/\* Layout : vue de découverte\..*?\*/',
             '/* Version épurée (style carnet) de la carte territoriale. Générée par sobre/generer.py. */')

# ---------- Style carnet : surcharges placées à la fin de la feuille principale ----------
STYLE = r"""
/* ===== Style carnet épuré ===== */
:root{
  --bg:#f5f2ea; --surface:#f8f6f0; --surface-2:#efebe1; --line:#d9d4c7; --line-strong:#9c978b;
  --ink:#232323; --ink-2:#4a4844; --ink-3:#77736a;
  --blue:#2c3e63; --blue-soft:#e8e5dc; --blue-ink:#2c3e63; --green-ink:#4d6b45;
  --k-acteur:#2c3e63; --k-organisation:#a8822f; --k-ressource:#5c7a52; --k-projet:#b5523b; --k-evenement:#6c5b86;
  --land:#efebe2; --land-home:#e3ddcf; --land-line:rgba(60,55,45,.32); --home-line:#232323;
  --river:#8fa5b8; --road:rgba(50,45,40,.22); --rail:rgba(50,45,40,.2); --ring:rgba(35,35,35,.4); --sea:#f5f2ea;
  --f-sans:"Courier Prime","Courier New",ui-monospace,monospace;
  --r:3px; --warn:#8a5a14; --warn-soft:#f3ead6; --ok:#4d6b45; --ok-soft:#e7ebdf; --none-ink:#77736a;
}
html,body{background:var(--bg)}
body{font-size:14.5px;line-height:1.55;
  background:repeating-linear-gradient(to bottom,transparent 0 27px,rgba(110,140,185,.16) 27px 28px),var(--bg)}
body::before{content:"";position:fixed;top:0;bottom:0;left:clamp(6px,2.4vw,34px);width:1px;background:rgba(196,84,72,.38);pointer-events:none;z-index:0}
.wrap{position:relative;z-index:1}
.wrap :is(div,section,button,input,select,textarea,a,label,aside,ul,li,p),.sheet,.sheet *{border-radius:var(--r)}
.cat .sw{border-radius:50%}
.brand{font-weight:400;letter-spacing:.14em;text-transform:uppercase;font-size:13px;display:flex;align-items:center;gap:12px}
.embleme{flex:none;transform:rotate(-4deg)}
.brand b{color:var(--ink);font-weight:700}
.topbar{border-bottom:1px solid var(--ink)}
.hero h1,.une-head h1,#une-titre{font-weight:400;letter-spacing:.01em}
h2{font-weight:400;letter-spacing:.08em;text-transform:uppercase;font-size:15px;padding-bottom:6px;border-bottom:1px dashed var(--line-strong)}
h3{font-weight:700;letter-spacing:.03em}
.kick{text-transform:uppercase;letter-spacing:.14em}
.fact b{font-weight:400}
.explore,.panel,.base,.contrib,.frise,.cta,.sheet{background:rgba(250,248,243,.92)}
.explore,.panel,.cat,.search input{border-color:var(--line-strong)}
.cat .lb{font-weight:400}
.cat .n{font-weight:400}
#gtiles{filter:grayscale(1) sepia(.22) brightness(1.06) contrast(.86);opacity:.8}
.tlogos .plate{background:#fbfaf6;border-color:var(--line-strong)}
button.go,.go,.insc-btn{letter-spacing:.06em}
.opts label{white-space:nowrap;font-size:12.5px;padding:4px 9px}
.opts input{width:auto;flex:none;margin:0}
#map .trace,.legend i{filter:saturate(.55) brightness(.92)}
@media (min-width:700px){body::before{left:30px}.wrap{padding-left:52px}}
@media (max-width:699px){body::before{left:7px}}
.signe{display:flex;align-items:center;gap:14px;margin-top:28px;color:var(--ink-2);font-size:12.5px;letter-spacing:.12em;text-transform:uppercase}
.signe::before,.signe::after{content:"";flex:1;border-top:1px dashed var(--line-strong)}
@media (max-width:620px){.signe{font-size:11px;letter-spacing:.06em}}
"""
remplacer(".fr-empty{color:var(--ink-3);font-size:14px}\n</style>",
          ".fr-empty{color:var(--ink-3);font-size:14px}\n" + STYLE + "</style>")

# ---------- Couleurs de catégories (aussi utilisées dans le code de la carte) ----------
for ancien, nouveau in [("#1F5BFF\"}", "#2c3e63\"}"), ("#d99400\"}", "#a8822f\"}"),
                        ("#199C68\"}", "#5c7a52\"}"), ("#e8613a\"}", "#b5523b\"}"), ("#8b5cf6\"}", "#6c5b86\"}")]:
    remplacer(ancien, nouveau)
html = html.replace('stroke="${sel?"#111827":"#cfd7e4"}"', 'stroke="${sel?"#232323":"#9c978b"}"')

# ---------- Textes : aucune mention de Civipédia ni de l'animateur ----------
remplacer('<div class="brand"><b>Civipedia</b> · carte territoriale</div>',
          '<div class="brand">' + EMBLEME + '<span><b>Carte territoriale</b> · instantané public</span></div>')
remplacer("Les événements publiés sur la carte et dans la base commune Civipédia.",
          "Les événements publiés sur la carte et dans la base commune.")
remplacer('<h2 id="base-title">Dans la base commune Civipédia</h2>',
          '<h2 id="base-title">Dans la base commune</h2>')
remplacer("Ce que la base commune relie à ce territoire et aux communes du périmètre, tel que le publie le tableau de bord Civipédia.",
          "Ce que la base commune relie à ce territoire et aux communes du périmètre.")
remplacer("J'accepte que ce message soit conservé et relu par l'équipe Civipedia. Rien n'est publié sans vérification.",
          "J'accepte que ce message me soit transmis par courriel et relu avant toute utilisation. Rien n'est publié sans vérification.", nb=2)
remplacer("à projets suivi${BASE.appels.length > 1 ? \"s\" : \"\"} par Civipédia, ouverts à tous les territoires.",
          "à projets suivi${BASE.appels.length > 1 ? \"s\" : \"\"}, ouverts à tous les territoires.")
remplacer_re(r'<p class="base-foot"><a href="\$\{esc\(lien\)\}">Ouvrir le tableau de bord Civipédia ›</a> <span class="base-muted">',
             '<p class="base-foot"><span class="base-muted">')
remplacer('esc(e.url || TABLEAU)', 'esc(e.url || "#")')
# Le crédit du projet à la une n'est jamais affiché.
remplacer('$("#une-credit").hidden = !UNE.credit; $("#une-credit").textContent = UNE.credit || "";',
          '$("#une-credit").hidden = true;')
# Pied de page : signature et contact, sans lien vers les autres outils.
remplacer_re(r'<span><a href="kleroterion/">Tirage au sort \(klèrôtèrion\)</a> · Civipedia</span>`;',
             '<span>Povie-Skopein · <a href="#" id="contact">Contact</a></span>`;')
remplacer('<aside class="sheet" id="sheet"',
          '<p class="signe" aria-hidden="true">Carte territoriale · Povie-Skopein</p>\n<aside class="sheet" id="sheet"')

# ---------- Chemins : les données sont lues à la racine du dépôt ----------
remplacer('async function loadJSON(u){ const r = await fetch(u);',
          'const R = u => /^(https?:|\\.\\/|\\.\\.\\/|data:)/.test(u) ? u : "../" + u;\n'
          'async function loadJSON(u){ const r = await fetch(R(u), { cache:"no-cache" });')
remplacer('<img src="${esc(l.src)}"', '<img src="${esc(R(l.src))}"')
remplacer('const TABLEAU = "tableau-de-bord/";', 'const TABLEAU = "../tableau-de-bord/";')
remplacer('GUICHET = (await loadJSON("config.json")).guichet || "";',
          'CONF = await loadJSON("./config.json"); GUICHET = CONF.guichet || "";')
remplacer('let GUICHET = "";', 'let GUICHET = "", CONF = {};')
# Territoires proposés : ceux de sobre/config.json.
remplacer('try { reg = await loadJSON(REGISTRY); }',
          'try { reg = await loadJSON(REGISTRY); if (CONF.territoires) reg = reg.filter(t => CONF.territoires.includes(t.id)); if (!reg.length) throw new Error("vide"); }')

# Pas de projet « à la une » (le WoodyBus à Crossac) : la carte montre le territoire
# lui-même. Le projet, ses lieux propres (arrêts, garage), ses tracés et ses
# indicateurs sont retirés ; les vues simplifiées sans projet (Chevaigné, Vertou) restent.
remplacer('[T, GEO] = await Promise.all([loadJSON(entry.data), loadJSON(entry.geo)]);',
          '[T, GEO] = await Promise.all([loadJSON(entry.data), loadJSON(entry.geo)]);\n  entry = retirerUne(entry);')
remplacer('async function openTerritory(', r'''function retirerUne(entry){
  const pid = entry.une && entry.une.projet;
  if (!pid) return entry;
  const projet = T.items.find(i => i.id === pid);
  const retires = new Set([pid]);
  for (const l of T.liens) {
    const o = l.a === pid ? l.b : l.b === pid ? l.a : null;
    const it = o && T.items.find(i => i.id === o);
    // Un lieu ou un événement relié seulement à ce projet lui appartient.
    if (it && (it.k === "ressource" || it.k === "evenement") && T.liens.every(x => (x.a !== o && x.b !== o) || x.a === pid || x.b === pid)) retires.add(o);
  }
  for (const i of T.items.filter(i => retires.has(i.id))) for (const cat of i.cats || []) {
    const c = (T.couverture || []).find(c => c.cat === cat); if (!c) continue;
    c.elements--; if (i.src) c.avec_source--;
    if (i.pt) c.precis--; else if (/^Sans adresse/.test(i.zone || "")) c.sans_position--; else c.commune--;
  }
  T.items = T.items.filter(i => !retires.has(i.id));
  T.liens = T.liens.filter(l => !retires.has(l.a) && !retires.has(l.b));
  T.traces = (T.traces || []).filter(t => t.projet !== pid);
  if (projet) T.indicateurs = (T.indicateurs || []).filter(i => !(i.nom || "").includes(projet.nom));
  return { ...entry, une: null };
}
async function openTerritory(''')

# Grande base : même projection publique, sans le nom de l'association.
remplacer('try { BASE = await loadJSON(TABLEAU + "data.json"); } catch(_) { BASE = null; }',
          'try { BASE = neutre(await loadJSON(TABLEAU + "data.json")); } catch(_) { BASE = null; }', nb=2)
remplacer('let BASE;', r'''let BASE;
function neutre(o){
  return JSON.parse(JSON.stringify(o)
    .replace(/\s*\((?:équipe )?Ci\x76ip[ée]dia\)/gi, "")
    .replace(/Participation de Ci\x76ip[ée]dia/gi, "Participation de l'équipe")
    .replace(/Ci\x76ip[ée]dia/gi, "la base commune"));
}''')

# ---------- Formulaire : envoi par courriel ----------
remplacer('for (const id of ["d-send", "a-send"]) $("#" + id).disabled = !GUICHET;',
          'for (const id of ["d-send", "a-send"]) $("#" + id).disabled = false;')
remplacer('$("#" + id).textContent = GUICHET ? "" : "L\'envoi en ligne ouvrira prochainement.";',
          '$("#" + id).textContent = "";')
remplacer('  if (!GUICHET) return;\n',
          '''  if (payload.site_web) return;
  if (!GUICHET) {
    location.href = courriel(payload);
    m.className = "msg ok"; m.textContent = "Votre messagerie s'ouvre avec le message prêt : il ne reste qu'à l'envoyer.";
    return;
  }
''')
remplacer('} finally { $(btn).disabled = !GUICHET; }', '} finally { $(btn).disabled = false; }')
remplacer('async function envoyer(form, payload, msg, btn){', r'''/* Adresse de contact, assemblée au moment du clic (moins exposée aux robots). */
const ADRESSE = () => ["anne.povie.44600", "gmail.com"].join("@");
const LIBELLES = { type:"Type", texte:"Message", domaines:"Sujets", recherche:"Ce que je cherche", etape:"Étape",
  domaine:"Sujet", preuve:"Source ou preuve", qualite:"Je suis", organisation:"Organisation", nom:"Nom",
  contact:"Contact", objet:"Objet" };
function courriel(p){
  const lignes = [`Territoire : ${p.territoire}`];
  for (const [k, lib] of Object.entries(LIBELLES)) {
    const v = Array.isArray(p[k]) ? p[k].join(", ") : (p[k] || "");
    if (String(v).trim()) lignes.push(`${lib} : ${v}`);
  }
  const sujet = `[Carte ${p.territoire}] ${p.genre === "demande" ? "Projet" : "Information à signaler"}`;
  return `mailto:${ADRESSE()}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(lignes.join("\n"))}`;
}
document.addEventListener("click", e => {
  const c = e.target.closest("#contact"); if (!c) return;
  e.preventDefault(); location.href = `mailto:${ADRESSE()}?subject=${encodeURIComponent("Carte territoriale")}`;
});
async function envoyer(form, payload, msg, btn){''')

# ---------- Application installable : celle de la carte épurée ----------
# Le service worker (sobre/sw.js) et l'icône (sobre/icones/) sont ceux du dossier.
remplacer("navigator.serviceWorker.register('sw.js')", "navigator.serviceWorker.register('sw.js', { scope: './' })")
remplacer("var KEY = 'civipedia-pwa-plus-tard';", "var KEY = 'carte-sobre-plus-tard';")
remplacer("Installer l\\u2019appli Civipedia", "Installer la carte")
remplacer("La carte sur votre écran d\\u2019accueil, en un geste.", "La carte sur votre écran d\\u2019accueil, même hors connexion.")

for mot in ("Civip", "Samuel", "Tiercelin", "kleroterion", r"\.\./sw\.js", r"\.\./manifest", r"\.\./icones"):
    if re.search(mot, html, re.I):
        lignes = [l.strip()[:100] for l in html.splitlines() if re.search(mot, l, re.I)]
        sys.exit(f"ERREUR : « {mot} » reste dans la page : {lignes[:3]}")

open(CIBLE, "w", encoding="utf-8").write(html)
print(f"sobre/index.html écrit ({len(html)} caractères).")
