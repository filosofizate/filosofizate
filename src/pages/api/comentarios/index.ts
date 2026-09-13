import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

function respuestaJson(datos: unknown, status = 200) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug")?.trim();

    if (!slug) {
      return respuestaJson({ error: "Falta el slug." }, 400);
    }

    const resultado = await env.DB.prepare(
      `SELECT id, slug, nombre, comentario, fecha
       FROM comentarios
       WHERE slug = ?
       ORDER BY fecha ASC, id ASC`,
    )
      .bind(slug)
      .all();

    return respuestaJson({
      comentarios: resultado.results ?? [],
    });
  } catch (error) {
    console.error("Error GET /api/comentarios:", error);

    return respuestaJson(
      { error: "No se pudieron cargar los comentarios." },
      500,
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const tipo = request.headers.get("content-type") ?? "";

    if (!tipo.includes("application/json")) {
      return respuestaJson({ error: "Formato de solicitud no válido." }, 415);
    }

    const cuerpo = await request.json();

    const slug =
      typeof cuerpo?.slug === "string" ? cuerpo.slug.trim() : "";

    const nombre =
      typeof cuerpo?.nombre === "string" ? cuerpo.nombre.trim() : "";

    const comentario =
      typeof cuerpo?.comentario === "string" ? cuerpo.comentario.trim() : "";

    const web =
      typeof cuerpo?.web === "string" ? cuerpo.web.trim() : "";

    // Campo trampa contra bots.
    if (web) {
      return respuestaJson({ ok: true }, 200);
    }

    if (!slug) {
      return respuestaJson({ error: "Falta el slug." }, 400);
    }

    // Por ahora solo admitimos comentarios en esta entrada.
    if (slug !== "neoliberalismo-ia") {
      return respuestaJson(
        { error: "Los comentarios no están habilitados para esta entrada." },
        403,
      );
    }

    if (!comentario) {
      return respuestaJson(
        { error: "El comentario no puede estar vacío." },
        400,
      );
    }

    if (nombre.length > 80) {
      return respuestaJson(
        { error: "El nombre o pseudónimo es demasiado largo." },
        400,
      );
    }

    if (comentario.length > 5000) {
      return respuestaJson(
        { error: "El comentario supera el máximo de 5000 caracteres." },
        400,
      );
    }

    const fecha = new Date().toISOString();

    const resultado = await env.DB.prepare(
      `INSERT INTO comentarios (slug, nombre, comentario, fecha)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(slug, nombre || null, comentario, fecha)
      .run();

    return respuestaJson(
      {
        ok: true,
        id: resultado.meta.last_row_id,
      },
      201,
    );
  } catch (error) {
    console.error("Error POST /api/comentarios:", error);

    return respuestaJson(
      { error: "No se pudo publicar el comentario." },
      500,
    );
  }
};
