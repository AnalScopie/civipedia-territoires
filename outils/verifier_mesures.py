#!/usr/bin/env python3
"""Vérifie les valeurs chiffrées (`mesures`) des observations publiées.

Chaque observation de territoires/<id>.json peut porter une liste `mesures` :
les mêmes chiffres que son texte `valeur`, sous forme de nombres, avec une
unité et une date au format ISO. Ce script refuse toute mesure :

  - dont le nombre ne se lit pas dans le texte publié de l'observation
    (valeur, limites, indicateur) : un chiffre n'est jamais calculé ni deviné ;
  - dont la date ne se lit pas dans ce texte (date, valeur, limites) ;
  - dont l'unité n'est pas dans la liste UNITES ;
  - dont la variable change d'unité d'une observation à l'autre ;
  - qui contredit une autre mesure (même variable, date et échelle, valeur différente).

Usage :
  python3 outils/verifier_mesures.py                 # tous les territoires de territoires/index.json
  python3 outils/verifier_mesures.py --csv mesures.csv  # écrit aussi la table à plat (une ligne par mesure)

Sortie non nulle en cas d'erreur. Aucune dépendance.
"""
import argparse
import csv
import json
import re
import sys
from datetime import date
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent

UNITES = {
    "habitants", "ménages", "logements", "emplois", "actifs", "écoles", "aires",
    "%", "€", "€/m³", "m³", "mg/L",
    "emplois pour 100 actifs occupés", "allers-retours par jour",
}
NATURES_DATE = {"prix_au", "consultation", "mise_a_jour_source"}
CHAMPS = {"variable", "valeur", "min", "max", "unite", "date", "date_fin", "date_nature", "echelle", "seuil"}
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
        "août", "septembre", "octobre", "novembre", "décembre"]
RE_DATE = re.compile(r"^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$")
RE_VARIABLE = re.compile(r"^[a-z0-9]+(_[a-z0-9]+)*$")


def nombres_du_texte(texte):
    """Nombres écrits à la française : « 1 219 696 », « 98,9 », « 2,44 »."""
    t = re.sub(r"(?<=\d)[\s  ](?=\d{3}\b)", "", texte)
    return {float(n.replace(",", ".")) for n in re.findall(r"\d+(?:,\d+)?", t)}


def lire_date(s):
    m = RE_DATE.match(s or "")
    if not m:
        return None
    a, mo, j = (int(x) if x else None for x in m.groups())
    try:
        date(a, mo or 1, j or 1)
    except ValueError:
        return None
    return a, mo, j


def date_ecrite(d, texte):
    a, mo, j = d
    t = texte.lower()
    if j:
        return f"{j:02d}/{mo:02d}/{a}" in t
    if mo:
        return f"{mo:02d}/{a}" in t or f"{MOIS[mo - 1]} {a}" in t
    return str(a) in t


def est_nombre(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def verifier(territoire, data):
    erreurs, avert, lignes = [], [], []
    unites_var, vus = {}, {}
    for o in data.get("observations", []):
        mes = o.get("mesures")
        if mes is None:
            continue
        oid = o.get("id", "?")
        texte_nb = " ".join(str(o.get(k, "")) for k in ("valeur", "limites", "indicateur"))
        texte_date = " ".join(str(o.get(k, "")) for k in ("date", "valeur", "limites"))
        nombres = nombres_du_texte(texte_nb)
        for i, m in enumerate(mes):
            ou = f"{territoire} {oid} mesure {i + 1}"
            def err(msg):
                erreurs.append(f"{ou} : {msg}")
            inconnus = set(m) - CHAMPS
            if inconnus:
                err(f"champ(s) inconnu(s) {sorted(inconnus)}")
            var = m.get("variable", "")
            if not RE_VARIABLE.match(var):
                err(f"variable « {var} » : minuscules, chiffres et _ seulement")
            if m.get("unite") not in UNITES:
                err(f"unité « {m.get('unite')} » absente de la liste UNITES")
            elif unites_var.setdefault(var, m["unite"]) != m["unite"]:
                err(f"variable {var} en « {m['unite']} » ici, en « {unites_var[var]} » ailleurs")
            if "valeur" in m:
                if not est_nombre(m["valeur"]) or "min" in m or "max" in m:
                    err("« valeur » doit être un nombre, sans « min » ni « max »")
            elif not any(k in m for k in ("min", "max")):
                err("ni « valeur », ni « min » / « max »")
            for k in ("valeur", "min", "max", "seuil"):
                if k in m:
                    if not est_nombre(m[k]):
                        err(f"« {k} » doit être un nombre")
                    elif float(m[k]) not in nombres:
                        err(f"{k} = {m[k]} ne se lit pas dans le texte de l'observation")
            if est_nombre(m.get("min")) and est_nombre(m.get("max")) and m["min"] > m["max"]:
                err("min > max")
            d = lire_date(m.get("date"))
            if not d:
                err(f"date « {m.get('date')} » : AAAA, AAAA-MM ou AAAA-MM-JJ")
            elif not date_ecrite(d, texte_date):
                err(f"date {m['date']} ne se lit pas dans le texte de l'observation")
            if "date_fin" in m:
                f = lire_date(m["date_fin"])
                if not f:
                    err(f"date_fin « {m['date_fin']} » invalide")
                elif not date_ecrite(f, texte_date):
                    err(f"date_fin {m['date_fin']} ne se lit pas dans le texte de l'observation")
                elif d and m["date_fin"] < m["date"]:
                    err("date_fin antérieure à date")
            if "date_nature" in m and m["date_nature"] not in NATURES_DATE:
                err(f"date_nature « {m['date_nature']} » : {sorted(NATURES_DATE)}")
            echelle = m.get("echelle") or o.get("echelle", "")
            cle = (var, m.get("date"), echelle)
            val = (m.get("valeur"), m.get("min"), m.get("max"))
            if cle in vus:
                autre_oid, autre_val = vus[cle]
                if autre_val != val:
                    err(f"contredit {autre_oid} pour {var} au {m.get('date')} ({echelle})")
                else:
                    avert.append(f"{ou} : même chiffre que {autre_oid} ({var}, {m.get('date')})")
            else:
                vus[cle] = (oid, val)
            lignes.append({
                "territoire": territoire, "observation": oid, "indicateur_id": o.get("ind", ""),
                "variable": var, "valeur": m.get("valeur", ""), "min": m.get("min", ""),
                "max": m.get("max", ""), "unite": m.get("unite", ""), "date": m.get("date", ""),
                "date_fin": m.get("date_fin", ""), "date_nature": m.get("date_nature", ""),
                "echelle": echelle, "seuil": m.get("seuil", ""), "statut": o.get("statut", ""),
                "source_url": (o.get("sources") or [{}])[0].get("url", ""),
            })
    return erreurs, avert, lignes


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--csv", help="écrit la table à plat des mesures dans ce fichier")
    args = ap.parse_args()
    registre = json.loads((RACINE / "territoires/index.json").read_text(encoding="utf-8"))
    erreurs, avert, lignes = [], [], []
    for t in registre:
        data = json.loads((RACINE / t["data"]).read_text(encoding="utf-8"))
        e, a, l = verifier(t["id"], data)
        erreurs += e; avert += a; lignes += l
        n_obs = len(data.get("observations", []))
        n_avec = sum(1 for o in data.get("observations", []) if o.get("mesures"))
        print(f"{t['id']} : {len(l)} mesures dans {n_avec} observations sur {n_obs}")
    for a in avert:
        print("  note :", a)
    for e in erreurs:
        print("  ERREUR :", e)
    if args.csv and not erreurs:
        with open(args.csv, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(lignes[0]) if lignes else ["territoire"])
            w.writeheader(); w.writerows(lignes)
        print(f"Table écrite : {args.csv}")
    sys.exit(1 if erreurs else 0)


if __name__ == "__main__":
    main()
