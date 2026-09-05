from pathlib import Path
import hashlib
import re

# Ejemplo de salida:
# [§a13f9c2d] Este es un párrafo del ensayo.

PARAGRAPH_ID_RE = re.compile(r"^\[§[0-9a-f]{8}\]\s+")


def paragraph_id(text: str) -> str:
    """
    Genera un identificador estable a partir del contenido del párrafo.
    """
    normalized = " ".join(text.split())
    digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    return digest[:8]


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
    Elimina un identificador previamente generado.
    Esto hace que el script sea idempotente.
    """
    return PARAGRAPH_ID_RE.sub("", block.strip(), count=1)


def index_markdown(content: str) -> str:
    """
    Añade identificadores estables a los párrafos Markdown.
    """
    blocks = re.split(r"\n\s*\n", content)
    result = []

    for block in blocks:
        clean = strip_existing_id(block)

        if should_index(clean):
            pid = paragraph_id(clean)
            result.append(f"[§{pid}] {clean}")
        else:
            result.append(block.strip())

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
        description="Añade identificadores estables a los párrafos de archivos Markdown."
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