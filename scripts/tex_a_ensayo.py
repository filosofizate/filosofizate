from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import unicodedata
from datetime import date
from pathlib import Path


def crear_slug(texto: str) -> str:
    """Convierte un título en un nombre válido para la URL."""
    normalizado = unicodedata.normalize("NFKD", texto)
    sin_acentos = "".join(
        caracter
        for caracter in normalizado
        if not unicodedata.combining(caracter)
    )

    slug = sin_acentos.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


def escapar_yaml(texto: str) -> str:
    """Escapa texto para incluirlo entre comillas YAML."""
    return texto.replace("\\", "\\\\").replace('"', '\\"')


def extraer_titulo_latex(contenido: str) -> str | None:
    """Intenta obtener el contenido de \\title{...}."""
    coincidencia = re.search(
        r"\\title\s*\{(?P<titulo>.*?)\}",
        contenido,
        flags=re.DOTALL,
    )

    if not coincidencia:
        return None

    titulo = coincidencia.group("titulo")
    titulo = re.sub(r"\s+", " ", titulo)
    titulo = re.sub(r"\\[a-zA-Z]+\*?(?:\[[^\]]*\])?", "", titulo)
    titulo = titulo.replace("{", "").replace("}", "")
    return titulo.strip()


def extraer_documento_latex(contenido: str) -> str:
    """
    Conserva únicamente lo incluido entre begin{document}
    y end{document}, cuando esas órdenes existen.
    """
    coincidencia = re.search(
        r"\\begin\{document\}(.*?)\\end\{document\}",
        contenido,
        flags=re.DOTALL,
    )

    if coincidencia:
        contenido = coincidencia.group(1)

    # El título se incorporará mediante el frontmatter.
    contenido = re.sub(r"\\maketitle\s*", "", contenido)

    return contenido.strip()


def ejecutar_pandoc(
    archivo_temporal: Path,
    salida_temporal: Path,
) -> None:
    if shutil.which("pandoc") is None:
        raise RuntimeError(
            "No se encontró Pandoc. Instálalo y comprueba "
            "que 'pandoc --version' funciona."
        )

    comando = [
        "pandoc",
        str(archivo_temporal),
        "--from=latex",
        "--to=markdown",
        "--wrap=none",
        "--markdown-headings=atx",
        "--output",
        str(salida_temporal),
    ]

    resultado = subprocess.run(
        comando,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )

    if resultado.returncode != 0:
        raise RuntimeError(
            "Pandoc no pudo convertir el archivo:\n"
            f"{resultado.stderr.strip()}"
        )


def limpiar_markdown(markdown: str) -> str:
    """Realiza algunas correcciones cómodas para Astro."""
    # Elimina saltos excesivos.
    markdown = re.sub(r"\n{4,}", "\n\n\n", markdown)

    # Evita que aparezca un título H1 duplicado al comienzo.
    markdown = re.sub(
        r"\A\s*#\s+.+?\n+",
        "",
        markdown,
        count=1,
    )

    # Sustituye espacios inseparables típicos de LaTeX.
    markdown = markdown.replace("\u00a0", " ")

    return markdown.strip() + "\n"


def convertir(
    entrada: Path,
    titulo: str | None,
    descripcion: str,
    conceptos: list[str],
    autor: str,
    fecha_publicacion: str,
    borrador: bool,
    destacado: bool,
    slug: str | None,
    carpeta_salida: Path,
) -> Path:
    if not entrada.exists():
        raise FileNotFoundError(f"No existe el archivo: {entrada}")

    contenido_latex = entrada.read_text(encoding="utf-8")

    titulo_detectado = titulo or extraer_titulo_latex(contenido_latex)
    if not titulo_detectado:
        raise ValueError(
            "No pude detectar el título. Usa --titulo "
            '"Título del ensayo".'
        )

    slug_final = slug or crear_slug(titulo_detectado)

    carpeta_salida.mkdir(parents=True, exist_ok=True)
    salida = carpeta_salida / f"{slug_final}.md"

    cuerpo_latex = extraer_documento_latex(contenido_latex)

    temporal_tex = entrada.parent / f".{entrada.stem}.conversion.tex"
    temporal_md = entrada.parent / f".{entrada.stem}.conversion.md"

    try:
        temporal_tex.write_text(cuerpo_latex, encoding="utf-8")
        ejecutar_pandoc(temporal_tex, temporal_md)

        markdown = temporal_md.read_text(encoding="utf-8")
        markdown = limpiar_markdown(markdown)
    finally:
        temporal_tex.unlink(missing_ok=True)
        temporal_md.unlink(missing_ok=True)

    conceptos_yaml = "\n".join(
        f'  - "{escapar_yaml(concepto)}"'
        for concepto in conceptos
    )

    if not conceptos_yaml:
        conceptos_yaml = "  []"

    frontmatter = f"""---
titulo: "{escapar_yaml(titulo_detectado)}"
descripcion: "{escapar_yaml(descripcion)}"
fecha: {fecha_publicacion}
autor: "{escapar_yaml(autor)}"
conceptos:
{conceptos_yaml}
destacado: {str(destacado).lower()}
borrador: {str(borrador).lower()}
---

"""

    salida.write_text(
        frontmatter + markdown,
        encoding="utf-8",
    )

    return salida


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Convierte un archivo LaTeX en un ensayo Markdown "
            "para la colección de Astro."
        )
    )

    parser.add_argument(
        "entrada",
        type=Path,
        help="Ruta del archivo .tex",
    )

    parser.add_argument(
        "--titulo",
        help="Título; si se omite se intenta leer de \\title{}.",
    )

    parser.add_argument(
        "--descripcion",
        required=True,
        help="Resumen breve para la portada y los buscadores.",
    )

    parser.add_argument(
        "--conceptos",
        nargs="*",
        default=[],
        help='Conceptos, por ejemplo: --conceptos Deuda Reciprocidad Justicia',
    )

    parser.add_argument(
        "--autor",
        default="Vicente Domínguez Arca",
    )

    parser.add_argument(
        "--fecha",
        default=date.today().isoformat(),
        help="Fecha en formato AAAA-MM-DD.",
    )

    parser.add_argument(
        "--slug",
        help="Nombre opcional para la URL.",
    )

    parser.add_argument(
        "--borrador",
        action="store_true",
        help="Marca la nota para que todavía no se publique.",
    )

    parser.add_argument(
        "--destacado",
        action="store_true",
    )

    parser.add_argument(
        "--salida",
        type=Path,
        default=Path("src/content/ensayos"),
        help="Carpeta de salida.",
    )

    argumentos = parser.parse_args()

    try:
        resultado = convertir(
            entrada=argumentos.entrada,
            titulo=argumentos.titulo,
            descripcion=argumentos.descripcion,
            conceptos=argumentos.conceptos,
            autor=argumentos.autor,
            fecha_publicacion=argumentos.fecha,
            borrador=argumentos.borrador,
            destacado=argumentos.destacado,
            slug=argumentos.slug,
            carpeta_salida=argumentos.salida,
        )
    except (OSError, RuntimeError, ValueError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    print(f"Ensayo creado: {resultado}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())