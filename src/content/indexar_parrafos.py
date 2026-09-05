from pathlib import Path
import re

# Detecta índices ya existentes como:
# [§1] texto...
# [§be6ebf69] texto...
PARAGRAPH_ID_RE = re.compile(r"^\[§[0-9a-zA-Z]+\]\s+")


def should_index(block: str) -> bool:
    """
    Decide si un bloque Markdown debe tratarse como párrafo indexable.
    """
    stripped = block.strip()

    if not stripped:
        return False

    # Frontmatter YAML
    if stripped.startswith("---") and stripped.endswith("---"):
        return False

    # Encabezados
    if stripped.startswith("#"):
        return False

    # Bloques de código
    if stripped.startswith("```") or stripped.startswith("~~~"):
        return False

    # Citas
    if stripped.startswith(">"):
        return False

    # Listas
    if re.match(r"^([-*+]|\d+\.)\s+", stripped):
        return False

    # Separadores horizontales
    if re.fullmatch(r"[-*_]{3,}", stripped.replace(" ", "")):
        return False

    # HTML de bloque
    if stripped.startswith("<") and stripped.endswith(">"):
        return False

    return True


def strip_existing_id(block: str) -> str:
    """
    Elimina un índice previo, ya sea numérico o hexadecimal.
    """
    return PARAGRAPH_ID_RE.sub("", block.strip(), count=1)


def index_markdown(content: str) -> str:
    """
    Numera secuencialmente los párrafos Markdown:
    [§1], [§2], [§3]...
    """
    blocks = re.split(r"\n\s*\n", content)

    result = []
    paragraph_number = 1

    for block in blocks:
        clean = strip_existing_id(block)

        if should_index(clean):
            result.append(f"[§{paragraph_number}] {clean}")
            paragraph_number += 1
        else:
            result.append(clean)

    return "\n\n".join(result).rstrip() + "\n"


def process_file(path: Path) -> None:
    original = path.read_text(encoding="utf-8")
    indexed = index_markdown(original)

    if indexed != original:
        path.write_text(indexed, encoding="utf-8")
        print(f"✓ {path}")
    else:
        print(f"= {path}")


def process_directory(root: Path) -> None:
    for path in sorted(root.rglob("*.md")):
        process_file(path)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Numera los párrafos de archivos Markdown con §1, §2, §3..."
    )

    parser.add_argument(
        "directory",
        type=Path,
        help="Carpeta que contiene los archivos .md",
    )

    args = parser.parse_args()

    if not args.directory.exists():
        raise SystemExit(f"No existe la carpeta: {args.directory}")

    process_directory(args.directory)