#!/usr/bin/env python3
"""Vérifie une migration de recette FitFork avant de l'appliquer.

Les inserts de recettes joignent les tables par le *nom* de la recette. Une faute de frappe
dans ce nom n'est pas une erreur SQL : la sous-requête renvoie zéro ligne et la migration
s'applique en silence, sans ingrédients. Ce script attrape ce genre de panne muette, plus les
incohérences de macros et les dérives de vocabulaire qui polluent la liste de courses.

    python3 check_recipe_migration.py supabase/migrations/0017_add_x_recipe.sql
    python3 check_recipe_migration.py --list-ingredients
    python3 check_recipe_migration.py --list-recipes

Le script cible une migration *nouvelle*, qui insère une recette complète (ligne, ingrédients et
étapes ensemble). Les migrations historiques 0002 et 0003 ont semé des recettes avant que la table
recipe_instructions n'existe : les pointer ici signale légitimement des recettes sans étapes.

Code de sortie : 0 si aucune erreur (les avertissements n'échouent pas), 1 sinon.
"""

from __future__ import annotations

import argparse
import difflib
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack"}
UNITS = {"g", "ml", "piece"}

# Fourchettes caloriques observées dans le catalogue, élargies d'une marge de tolérance.
CALORIE_RANGES = {
    "breakfast": (280, 480),
    "lunch": (300, 680),
    "dinner": (330, 720),
    "snack": (140, 290),
}

# Le catalogue existant tolère jusqu'à ~8 % d'écart entre les calories déclarées et le calcul
# 4/9/4 (arrondis des tables nutritionnelles). On avertit à partir de 5 %, on n'échoue qu'au-delà
# de 10 %, seuil qui ne peut plus s'expliquer par des arrondis.
MACRO_WARN = 0.05
MACRO_ERROR = 0.10

# base_serving_g est un poids d'assiette : il diffère légitimement de la somme des ingrédients
# (le riz absorbe l'eau, la viande en perd). On ne signale que les rapports invraisemblables.
SERVING_RATIO_MIN = 0.5
SERVING_RATIO_MAX = 2.2

# Motif de chaîne SQL gérant l'échappement par doublement : 'jusqu''à'
STR = r"'((?:[^']|'')*)'"
NUM = r"(-?[\d.]+)"

RECIPE_ROW = re.compile(
    rf"\(\s*{STR}\s*,\s*{STR}\s*,\s*{NUM}\s*,\s*{NUM}\s*,\s*{NUM}\s*,\s*{NUM}\s*,\s*{NUM}\s*\)"
)
INGREDIENT_ROW = re.compile(
    rf"select\s+id\s*,\s*{STR}\s*,\s*{NUM}\s*,\s*{STR}\s+from\s+public\.recipes"
    rf"\s+where\s+name\s*=\s*{STR}",
    re.IGNORECASE,
)
INSTRUCTION_ROW = re.compile(rf"\(\s*{STR}\s*,\s*(\d+)\s*,\s*{STR}\s*\)")
UPDATE_NAME = re.compile(
    rf"update\s+public\.recipes\b.*?\bwhere\s+name\s*=\s*{STR}", re.IGNORECASE | re.DOTALL
)


def normalize(name: str) -> str:
    """Réduit un nom d'ingrédient à une forme canonique : sans casse, sans accent, sans pluriel."""
    folded = unicodedata.normalize("NFD", name.casefold())
    folded = "".join(char for char in folded if not unicodedata.combining(char))
    return folded[:-1] if folded.endswith("s") else folded


def unescape(value: str) -> str:
    """Ramène une chaîne SQL à sa valeur réelle : 'l''ail' -> l'ail."""
    return value.replace("''", "'")


def mask_strings(sql: str) -> tuple[str, bool]:
    """Remplace le contenu des chaînes par des espaces pour trouver les vrais `;` et mots-clés.

    Conserve la longueur exacte pour que les index restent valides sur le texte d'origine.
    Renvoie aussi un booléen indiquant qu'une chaîne est restée ouverte en fin de fichier.
    """
    out = list(sql)
    in_string = False
    i = 0
    while i < len(sql):
        char = sql[i]
        if char == "'":
            if in_string and i + 1 < len(sql) and sql[i + 1] == "'":
                out[i] = out[i + 1] = " "
                i += 2
                continue
            in_string = not in_string
        elif in_string:
            out[i] = " "
        i += 1
    return "".join(out), in_string


def split_statements(sql: str) -> tuple[list[tuple[str, str]], bool]:
    """Découpe en (texte_original, texte_masqué) sur les `;` hors chaînes."""
    masked, unterminated = mask_strings(sql)
    statements = []
    start = 0
    for match in re.finditer(r";", masked):
        end = match.end()
        statements.append((sql[start:end], masked[start:end]))
        start = end
    if sql[start:].strip():
        statements.append((sql[start:], masked[start:]))
    return statements, unterminated


class Recipe:
    def __init__(self, name, meal_type, calories, protein, fat, carbs, serving):
        self.name = name
        self.meal_type = meal_type
        self.calories = calories
        self.protein = protein
        self.fat = fat
        self.carbs = carbs
        self.serving = serving


def parse_sql(sql: str):
    """Extrait recettes, ingrédients et instructions d'un fichier de migration."""
    statements, unterminated = split_statements(sql)
    recipes: list[Recipe] = []
    ingredients: list[tuple[str, str, float, str]] = []  # (recette, ingrédient, qté, unité)
    instructions: list[tuple[str, int, str]] = []  # (recette, n° étape, texte)
    updated_names: list[str] = []
    unparsed: list[str] = []  # inserts repérés dont aucune ligne n'a pu être extraite

    for original, masked in statements:
        lowered = masked.lower()
        before = (len(recipes), len(ingredients), len(instructions))
        if "insert into public.recipes" in lowered:
            for m in RECIPE_ROW.finditer(original):
                recipes.append(
                    Recipe(
                        unescape(m.group(1)),
                        unescape(m.group(2)),
                        float(m.group(3)),
                        float(m.group(4)),
                        float(m.group(5)),
                        float(m.group(6)),
                        float(m.group(7)),
                    )
                )
        elif "insert into public.recipe_ingredients" in lowered:
            for m in INGREDIENT_ROW.finditer(original):
                ingredients.append(
                    (unescape(m.group(4)), unescape(m.group(1)), float(m.group(2)), unescape(m.group(3)))
                )
        elif "insert into public.recipe_instructions" in lowered:
            for m in INSTRUCTION_ROW.finditer(original):
                instructions.append((unescape(m.group(1)), int(m.group(2)), unescape(m.group(3))))
        elif "update public.recipes" in lowered:
            for m in UPDATE_NAME.finditer(original):
                updated_names.append(unescape(m.group(1)))
            continue
        else:
            continue

        if (len(recipes), len(ingredients), len(instructions)) == before:
            table = re.search(r"insert into (public\.\w+)", lowered)
            unparsed.append(table.group(1) if table else "?")

    return recipes, ingredients, instructions, updated_names, unterminated, unparsed


def find_migrations_dir(target: Path | None) -> Path | None:
    if target is not None and target.parent.name == "migrations":
        return target.parent
    here = Path(__file__).resolve()
    for parent in [Path.cwd().resolve(), *Path.cwd().resolve().parents, *here.parents]:
        candidate = parent / "supabase" / "migrations"
        if candidate.is_dir():
            return candidate
    return None


def load_catalogue(migrations_dir: Path, exclude: Path | None):
    """Reconstruit le catalogue existant à partir de toutes les migrations déjà écrites."""
    recipes: dict[str, Recipe] = {}
    units_by_ingredient: dict[str, Counter] = defaultdict(Counter)
    for path in sorted(migrations_dir.glob("*.sql")):
        if exclude is not None and path.resolve() == exclude.resolve():
            continue
        parsed_recipes, parsed_ingredients, *_ = parse_sql(path.read_text(encoding="utf-8"))
        for recipe in parsed_recipes:
            recipes[recipe.name] = recipe
        for _, ingredient, _, unit in parsed_ingredients:
            units_by_ingredient[ingredient][unit] += 1
    return recipes, units_by_ingredient


class Report:
    def __init__(self):
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, message: str) -> None:
        self.errors.append(message)

    def warn(self, message: str) -> None:
        self.warnings.append(message)

    def render(self) -> int:
        for message in self.errors:
            print(f"  ERREUR    {message}")
        for message in self.warnings:
            print(f"  ATTENTION {message}")
        print()
        if self.errors:
            print(f"✗ {len(self.errors)} erreur(s), {len(self.warnings)} avertissement(s).")
            return 1
        if self.warnings:
            print(f"✓ Aucune erreur. {len(self.warnings)} avertissement(s) à évaluer.")
            return 0
        print("✓ Migration valide.")
        return 0


def check_macros(recipe: Recipe, report: Report) -> None:
    computed = recipe.protein * 4 + recipe.fat * 9 + recipe.carbs * 4
    if recipe.calories <= 0:
        report.error(f"« {recipe.name} » : base_calories doit être > 0 (contrainte CHECK).")
        return
    drift = abs(computed - recipe.calories) / recipe.calories
    if drift > MACRO_ERROR:
        report.error(
            f"« {recipe.name} » : macros incohérentes — "
            f"{recipe.protein:g}P×4 + {recipe.fat:g}L×9 + {recipe.carbs:g}G×4 = {computed:g} kcal "
            f"contre {recipe.calories:g} déclarées ({drift:.0%} d'écart, max {MACRO_ERROR:.0%})."
        )
    elif drift > MACRO_WARN:
        report.warn(
            f"« {recipe.name} » : {drift:.0%} d'écart entre les macros et les calories déclarées "
            f"({computed:g} kcal calculées) — ajuste plutôt les calories sur le calcul 4/9/4."
        )

    for label, value in (
        ("base_protein_g", recipe.protein),
        ("base_fat_g", recipe.fat),
        ("base_carbs_g", recipe.carbs),
    ):
        if value < 0:
            report.error(f"« {recipe.name} » : {label} négatif (contrainte CHECK).")
    if recipe.serving <= 0:
        report.error(f"« {recipe.name} » : base_serving_g doit être > 0 (contrainte CHECK).")

    if recipe.meal_type in CALORIE_RANGES:
        low, high = CALORIE_RANGES[recipe.meal_type]
        if not low <= recipe.calories <= high:
            report.warn(
                f"« {recipe.name} » : {recipe.calories:g} kcal est hors de la fourchette habituelle "
                f"des {recipe.meal_type} ({low}–{high} kcal). Le multiplicateur de portion étant "
                f"borné à 0,5–2, la recette sera inutilisable pour une partie des objectifs."
            )
        protein_share = (recipe.protein * 4) / recipe.calories
        if recipe.meal_type in ("lunch", "dinner") and protein_share < 0.20:
            report.warn(
                f"« {recipe.name} » : seulement {protein_share:.0%} des calories viennent des "
                f"protéines, c'est bas pour un plat FitFork (cible ≥ 25 %)."
            )


def check_ingredient_vocabulary(pairs: set[tuple[str, str]], catalogue_units, report: Report) -> None:
    """Contrôle le vocabulaire sur les couples (ingrédient, unité) distincts.

    Une migration en lot réutilise les mêmes ingrédients des dizaines de fois ; signaler chaque
    occurrence noierait les avertissements réellement actionnables sous les répétitions.
    """
    genuinely_new: list[tuple[str, str]] = []

    for name, unit in sorted(pairs):
        if unit not in UNITS:
            report.error(f"Ingrédient « {name} » : unité « {unit} » invalide (attendu g, ml ou piece).")
            continue

        if name in catalogue_units:
            known = catalogue_units[name]
            if unit not in known:
                usual = ", ".join(sorted(known))
                report.warn(
                    f"Ingrédient « {name} » utilisé en « {unit} » alors que le catalogue l'exprime "
                    f"en {usual}. La liste de courses agrège sur nom+unité : ce sera deux lignes."
                )
            continue

        # Le doublon le plus fréquent est la variante singulier/pluriel (« Carotte » vs
        # « Carottes »), que la normalisation attrape sans faux positif — contrairement à une
        # simple distance de chaînes, qui rapproche « Cracottes » de « Carottes ».
        twins = [other for other in catalogue_units if normalize(other) == normalize(name)]
        if twins:
            report.error(
                f"Ingrédient « {name} » est une variante de "
                f"{', '.join('« ' + t + ' »' for t in sorted(twins))} déjà au catalogue. Reprends "
                f"le nom existant : la liste de courses agrège sur le nom exact et afficherait "
                f"deux lignes pour le même produit."
            )
            continue

        close = difflib.get_close_matches(name, list(catalogue_units), n=2, cutoff=0.88)
        if close:
            report.warn(
                f"Ingrédient « {name} » ressemble à "
                f"{', '.join('« ' + c + ' »' for c in close)}. Si c'est bien un produit distinct "
                f"(taux de matière grasse, conditionnement), garde-le ; sinon reprends l'existant."
            )
        else:
            genuinely_new.append((name, unit))

    if genuinely_new:
        listed = ", ".join(f"{name} ({unit})" for name, unit in genuinely_new)
        report.warn(
            f"{len(genuinely_new)} ingrédient(s) entrent au catalogue — vérifie qu'aucun n'existe "
            f"déjà sous un autre nom : {listed}."
        )


def check_migration(path: Path, report: Report) -> None:
    sql = path.read_text(encoding="utf-8")

    if "’" in sql:
        report.error(
            "Apostrophe typographique « ’ » détectée. Utilise l'apostrophe droite doublée "
            "(l''escalope) : le nom sert de clé de jointure et les deux caractères ne matchent pas."
        )

    recipes, ingredients, instructions, updated_names, unterminated, unparsed = parse_sql(sql)

    if unterminated:
        report.error(
            "Chaîne SQL non fermée : une apostrophe n'est pas doublée quelque part. "
            "L'analyse qui suit est peu fiable tant que ce n'est pas corrigé."
        )

    for table in unparsed:
        report.error(
            f"Un insert dans {table} a été trouvé mais aucune ligne n'a pu en être extraite. "
            f"C'est presque toujours une apostrophe non doublée (écris l''ail, jusqu''à) qui "
            f"décale la lecture des chaînes, ou une structure différente du modèle du skill."
        )

    migrations_dir = find_migrations_dir(path)
    if migrations_dir is None:
        report.warn("Dossier supabase/migrations introuvable : vérifications de vocabulaire ignorées.")
        catalogue, catalogue_units = {}, {}
    else:
        catalogue, catalogue_units = load_catalogue(migrations_dir, exclude=path)

    if not recipes and not instructions and not ingredients and not updated_names:
        report.error(
            f"{path.name} ne touche aucune des tables recipes / recipe_ingredients / "
            f"recipe_instructions. Vérifie que tu vises bien la migration de recette."
        )
        return

    contents = (
        f"Contenu : {len(recipes)} recette(s), {len(ingredients)} ingrédient(s), "
        f"{len(instructions)} étape(s)"
    )
    if updated_names:
        contents += f", {len(updated_names)} update(s)"

    print(f"Migration : {path}")
    print(f"Catalogue existant : {len(catalogue)} recettes, {len(catalogue_units)} ingrédients distincts")
    print(contents)
    print()

    names_here = {recipe.name for recipe in recipes}
    seen = Counter(recipe.name for recipe in recipes)
    for name, count in seen.items():
        if count > 1:
            report.error(f"« {name} » est inséré {count} fois dans cette migration.")
        if name in catalogue:
            report.error(
                f"« {name} » existe déjà dans le catalogue. Le nom est la clé de jointure : "
                f"un doublon rattacherait les ingrédients aux deux recettes."
            )

    for recipe in recipes:
        if recipe.meal_type not in MEAL_TYPES:
            report.error(
                f"« {recipe.name} » : meal_type « {recipe.meal_type} » invalide "
                f"(attendu {', '.join(sorted(MEAL_TYPES))})."
            )
        check_macros(recipe, report)

    known_names = names_here | set(catalogue)
    for name in updated_names:
        if name not in known_names:
            report.error(
                f"L'update cible « {name} », qui n'existe ni dans cette migration ni dans le "
                f"catalogue : la requête ne touchera aucune ligne."
            )

    by_recipe_ingredients = defaultdict(list)
    vocabulary_pairs: set[tuple[str, str]] = set()
    fractional_pieces: set[tuple[str, float]] = set()
    orphan_ingredients: set[str] = set()

    for recipe_name, ingredient, quantity, unit in ingredients:
        if recipe_name not in known_names:
            orphan_ingredients.add(recipe_name)
        if quantity <= 0:
            report.error(f"Ingrédient « {ingredient} » : quantité {quantity:g} ≤ 0 (contrainte CHECK).")
        if unit == "piece" and (quantity * 2) % 1 != 0:
            fractional_pieces.add((ingredient, quantity))
        vocabulary_pairs.add((ingredient, unit))
        by_recipe_ingredients[recipe_name].append((ingredient, quantity, unit))

    for recipe_name in sorted(orphan_ingredients):
        report.error(
            f"Des ingrédients sont rattachés à « {recipe_name} », introuvable dans cette migration "
            f"comme dans le catalogue : la jointure par nom insérera zéro ligne."
        )
    for ingredient, quantity in sorted(fractional_pieces):
        report.warn(
            f"Ingrédient « {ingredient} » : {quantity:g} piece — le code arrondit les pièces à "
            f"l'entier lors de la mise à l'échelle, préfère un entier ou un demi."
        )
    check_ingredient_vocabulary(vocabulary_pairs, catalogue_units, report)

    by_recipe_steps = defaultdict(list)
    for recipe_name, step_number, text in instructions:
        if recipe_name not in known_names:
            report.error(
                f"Étape {step_number} rattachée à « {recipe_name} », introuvable dans cette migration "
                f"comme dans le catalogue : la jointure par nom insérera zéro ligne."
            )
        if not text.strip():
            report.error(f"« {recipe_name} » : étape {step_number} vide.")
        by_recipe_steps[recipe_name].append((step_number, text))

    for recipe in recipes:
        recipe_ingredients = by_recipe_ingredients.get(recipe.name, [])
        steps = sorted(by_recipe_steps.get(recipe.name, []))

        if not recipe_ingredients:
            report.error(f"« {recipe.name} » n'a aucun ingrédient : la liste de courses sera vide.")
        if not steps:
            report.error(f"« {recipe.name} » n'a aucune étape : la fiche recette sera vide.")
        elif [n for n, _ in steps] != list(range(1, len(steps) + 1)):
            report.error(
                f"« {recipe.name} » : numérotation des étapes non contiguë "
                f"({', '.join(str(n) for n, _ in steps)}), attendu 1 à {len(steps)}."
            )
        elif len(steps) < 2:
            report.warn(f"« {recipe.name} » : une seule étape, le catalogue en compte 2 à 5.")

        weighed = sum(q for _, q, u in recipe_ingredients if u in ("g", "ml"))
        if weighed > 0 and recipe.serving > 0:
            ratio = recipe.serving / weighed
            if not SERVING_RATIO_MIN <= ratio <= SERVING_RATIO_MAX:
                report.warn(
                    f"« {recipe.name} » : base_serving_g = {recipe.serving:g} g pour {weighed:g} g "
                    f"d'ingrédients pesés (rapport {ratio:.1f}). Vérifie le poids de portion."
                )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("migration", nargs="?", help="Fichier de migration à vérifier")
    parser.add_argument(
        "--list-ingredients", action="store_true", help="Affiche le vocabulaire d'ingrédients du catalogue"
    )
    parser.add_argument(
        "--list-recipes", action="store_true", help="Affiche les recettes du catalogue par type de repas"
    )
    args = parser.parse_args()

    if args.list_ingredients or args.list_recipes:
        migrations_dir = find_migrations_dir(None)
        if migrations_dir is None:
            print("Dossier supabase/migrations introuvable.", file=sys.stderr)
            return 1
        catalogue, catalogue_units = load_catalogue(migrations_dir, exclude=None)
        if args.list_ingredients:
            print(f"{len(catalogue_units)} ingrédients dans le catalogue :\n")
            for name in sorted(catalogue_units, key=str.casefold):
                units = ", ".join(f"{u} (×{c})" for u, c in catalogue_units[name].most_common())
                print(f"  {name}  —  {units}")
        if args.list_recipes:
            if args.list_ingredients:
                print()
            print(f"{len(catalogue)} recettes dans le catalogue :\n")
            for meal_type in ("breakfast", "lunch", "dinner", "snack"):
                subset = sorted(
                    (r for r in catalogue.values() if r.meal_type == meal_type),
                    key=lambda r: r.calories,
                )
                print(f"  {meal_type} ({len(subset)}) :")
                for recipe in subset:
                    print(
                        f"    {recipe.calories:>4.0f} kcal  "
                        f"{recipe.protein:>3.0f}P {recipe.fat:>3.0f}L {recipe.carbs:>3.0f}G  "
                        f"{recipe.name}"
                    )
                print()
        return 0

    if not args.migration:
        parser.error("indique un fichier de migration, ou --list-ingredients / --list-recipes")

    path = Path(args.migration)
    if not path.is_file():
        print(f"Fichier introuvable : {path}", file=sys.stderr)
        return 1

    report = Report()
    check_migration(path, report)
    return report.render()


if __name__ == "__main__":
    sys.exit(main())
