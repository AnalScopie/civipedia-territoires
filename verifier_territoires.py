#!/usr/bin/env python3
"""Contrôle les cartes territoriales avant publication.

Usage :
    python3 verifier_territoires.py            # tous les territoires du registre
    python3 verifier_territoires.py crossac    # un seul territoire

Lit territoires/index.json, puis pour chaque territoire son fichier de données
et son fond géographique. Deux niveaux :
  - ERREUR : la carte ne doit pas être publiée (structure cassée, donnée privée,
    identifiant interne de la base commune, lien vers un élément absent…) ;
  - AVERTISSEMENT : à regarder, sans bloquer.

Code de sortie 1 s'il reste au moins une erreur : la version précédente reste
alors en ligne. Aucune dépendance hors bibliothèque standard.
"""
import json
import math
import os
import re
import sys

RACINE = os.path.dirname(os.path.abspath(__file__))
REGISTRE = os.path.join(RACINE, "territoires", "index.json")

NATURES = {"acteur", "organisation", "ressource", "evenement", "projet"}
CLES_RACINE = ["territoire", "instantane", "genere_le", "communes", "items", "liens", "reperes",
               "themes", "indicateurs", "observations", "en_attente", "ouverts", "attendues", "couverture"]
STATUTS_PUBLIABLES = {"FAIT", "VÉRIFIÉ"}
# Identifiants de la base commune et de la veille : ils ne sortent jamais des tableurs.
ID_INTERNE = re.compile(r"\b(MASE-[A-Z]-\d{3,4}|OPP-\d{4}|APP-\d{3}|VEI-\d{8}-\d{3}|SRC-\d{3,4})\b")
COURRIEL = re.compile(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", re.I)
TELEPHONE = re.compile(r"(?<![\d/])(?:\+33\s?|0)[1-9](?:[ .-]?\d{2}){4}(?!\d)")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

erreurs, avertissements = [], []


def erreur(ou, msg):
    erreurs.append(f"{ou} : {msg}")


def avert(ou, msg):
    avertissements.append(f"{ou} : {msg}")


def charger(chemin, ou):
    try:
        with open(chemin, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        erreur(ou, f"fichier absent ({os.path.relpath(chemin, RACINE)})")
    except json.JSONDecodeError as e:
        erreur(ou, f"JSON invalide ({e})")
    return None


def km(a, b):
    (la1, lo1), (la2, lo2) = a, b
    p = math.pi / 180
    h = math.sin((la2 - la1) * p / 2) ** 2 + math.cos(la1 * p) * math.cos(la2 * p) * math.sin((lo2 - lo1) * p / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))


def coord(v):
    return (isinstance(v, list) and len(v) == 2 and all(isinstance(x, (int, float)) for x in v)
            and -90 <= v[0] <= 90 and -180 <= v[1] <= 180)


def textes(v, chemin=""):
    """Toutes les chaînes du fichier, avec leur emplacement."""
    if isinstance(v, str):
        yield chemin, v
    elif isinstance(v, dict):
        for k, x in v.items():
            yield from textes(x, f"{chemin}.{k}" if chemin else k)
    elif isinstance(v, list):
        for n, x in enumerate(v):
            yield from textes(x, f"{chemin}[{n}]")


def verifier_donnees(tid, d):
    ou = f"{tid}.json"
    if not isinstance(d, dict):
        erreur(ou, "le fichier doit être un objet")
        return
    for k in CLES_RACINE:
        if k not in d:
            erreur(ou, f"clé « {k} » absente")
    t = d.get("territoire") or {}
    if t.get("id") != tid:
        erreur(ou, f"territoire.id vaut « {t.get('id')} », attendu « {tid} »")
    if not t.get("nom"):
        erreur(ou, "territoire.nom vide")
    centre = t.get("centre")
    if not coord(centre):
        erreur(ou, "territoire.centre doit être [lat, lon]")
        centre = None
    rayon = t.get("rayon_km") if isinstance(t.get("rayon_km"), (int, float)) else None
    if not rayon:
        erreur(ou, "territoire.rayon_km absent")
    if not DATE.match(str(d.get("genere_le", ""))):
        erreur(ou, "genere_le doit être une date AAAA-MM-JJ")

    # Communes du périmètre
    communes = set()
    for c in d.get("communes", []):
        if not c.get("nom") or not coord([c.get("lat"), c.get("lon")]):
            erreur(ou, f"commune mal décrite : {c}")
            continue
        communes.add(c["nom"])

    # Éléments
    items = d.get("items", [])
    ids = {}
    for i in items:
        iid = i.get("id")
        if not iid:
            erreur(ou, f"élément sans id : {i.get('nom')}")
            continue
        if iid in ids:
            erreur(ou, f"{iid} : id en double")
        ids[iid] = i
    for iid, i in ids.items():
        o = f"{ou} {iid}"
        if i.get("k") not in NATURES:
            erreur(o, f"nature « {i.get('k')} » inconnue")
        if not i.get("nom"):
            erreur(o, "nom vide")
        src = i.get("src") or {}
        if not str(src.get("url", "")).startswith(("https://", "http://")):
            erreur(o, "source publique sans adresse web")
        if "pt" in i:
            if not coord(i["pt"]):
                erreur(o, "pt doit être [lat, lon]")
            elif str(i.get("zone", "")).startswith("Sans adresse"):
                erreur(o, f"zone « {i['zone']} » mais un point est publié : l'un des deux est faux")
            elif centre and rayon and km(centre, i["pt"]) > rayon * 2:
                avert(o, f"point à {km(centre, i['pt']):.0f} km du centre, loin du périmètre")
        if i.get("com") and i["com"] not in communes:
            avert(o, f"commune de rattachement « {i['com']} » absente de la liste des communes")
        if "pt" not in i and "com" not in i:
            avert(o, "sans position : n'apparaît pas sur la carte")
        if i.get("k") == "evenement":
            if not DATE.match(str(i.get("debut", ""))):
                erreur(o, "événement sans date de début AAAA-MM-JJ")
        for champ in ("lieu", "organisateur"):
            ref = i.get(champ)
            if isinstance(ref, str) and re.match(r"^[A-Z]{2,4}-[A-Z]{2,4}-\d{3}$", ref) and ref not in ids:
                erreur(o, f"{champ} renvoie à {ref}, absent de la carte")

    # Relations : uniquement entre éléments visibles
    for n, l in enumerate(d.get("liens", [])):
        for cote in ("a", "b"):
            if l.get(cote) not in ids:
                erreur(f"{ou} liens[{n}]", f"{cote} = {l.get(cote)} absent de la carte")
        if not l.get("t"):
            erreur(f"{ou} liens[{n}]", "nature de la relation vide")

    # Chiffres : seules les valeurs établies sont publiées
    obs = {o.get("id") for o in d.get("observations", [])}
    for o in d.get("observations", []):
        if o.get("statut") not in STATUTS_PUBLIABLES:
            erreur(f"{ou} {o.get('id')}", f"statut « {o.get('statut')} » : seules les valeurs FAIT ou VÉRIFIÉ sont publiées")
    for n, e in enumerate(d.get("en_attente", [])):
        if any(k in e for k in ("valeur", "v")):
            erreur(f"{ou} en_attente[{n}]", "un chiffre en attente ne doit pas publier sa valeur")
    for r in d.get("reperes", []):
        for v in r.get("valeurs", []):
            if v.get("id") and v["id"] not in obs:
                avert(f"{ou} repères", f"{v['id']} ne correspond à aucune observation publiée")
    pop = t.get("population") or {}
    if pop.get("id") and pop["id"] not in obs:
        avert(ou, f"population renvoie à {pop['id']}, absent des observations")

    # Données privées et identifiants internes, dans tout le fichier
    for chemin, s in textes(d):
        if ID_INTERNE.search(s):
            erreur(ou, f"identifiant interne de la base commune ({ID_INTERNE.search(s).group(0)}) dans {chemin}")
        if COURRIEL.search(s) and "url" not in chemin and "site" not in chemin:
            erreur(ou, f"adresse électronique dans {chemin}")
        if TELEPHONE.search(s):
            erreur(ou, f"numéro de téléphone dans {chemin}")

    return d


def verifier_geo(tid, g):
    ou = f"{tid}.geo.json"
    if not isinstance(g, dict) or not isinstance(g.get("communes"), (list, dict)):
        erreur(ou, "fond géographique sans « communes »")


def verifier(entree, idx):
    tid = entree.get("id") or f"registre[{idx}]"
    for k in ("id", "nom", "data", "geo", "instantane"):
        if not entree.get(k):
            erreur("index.json", f"{tid} : champ « {k} » vide")
    for l in entree.get("logos", []):
        if not os.path.isfile(os.path.join(RACINE, l.get("src", ""))):
            erreur("index.json", f"{tid} : logo absent ({l.get('src')})")
        if not l.get("alt"):
            erreur("index.json", f"{tid} : logo sans texte alternatif")
    d = charger(os.path.join(RACINE, entree.get("data", "")), f"{tid}.json") if entree.get("data") else None
    if d is not None:
        verifier_donnees(tid, d)
        if entree.get("nom") and d.get("territoire", {}).get("nom") != entree["nom"]:
            erreur("index.json", f"{tid} : nom « {entree['nom']} » différent de celui du fichier")
        if entree.get("instantane") != d.get("instantane"):
            erreur("index.json", f"{tid} : instantané « {entree.get('instantane')} » différent de celui du fichier "
                                 f"(« {d.get('instantane')} ») : mettre le registre à jour")
    g = charger(os.path.join(RACINE, entree.get("geo", "")), f"{tid}.geo.json") if entree.get("geo") else None
    if g is not None:
        verifier_geo(tid, g)
    return d


def main(args):
    reg = charger(REGISTRE, "index.json")
    if not isinstance(reg, list):
        erreur("index.json", "le registre doit être une liste")
        reg = []
    vus = set()
    for n, e in enumerate(reg):
        if e.get("id") in vus:
            erreur("index.json", f"{e.get('id')} : territoire en double")
        vus.add(e.get("id"))
    choisis = [e for e in reg if not args or e.get("id") in args]
    for a in args:
        if a not in vus:
            erreur("index.json", f"{a} : territoire absent du registre")
    bilans = []
    for n, e in enumerate(choisis):
        d = verifier(e, n)
        if d:
            nb = {}
            for i in d.get("items", []):
                nb[i.get("k")] = nb.get(i.get("k"), 0) + 1
            bilans.append(f"{e['id']} : " + ", ".join(f"{v} {k}" for k, v in sorted(nb.items())))

    for a in avertissements:
        print("AVERTISSEMENT", a)
    for e in erreurs:
        print("ERREUR", e)
    for b in bilans:
        print(b)
    if erreurs:
        print(f"\n{len(erreurs)} erreur(s) : ne pas publier.")
        return 1
    print(f"\nContrôles passés ({len(avertissements)} avertissement(s)) : publication possible.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
