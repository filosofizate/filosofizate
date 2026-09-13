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

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const tokenRecibido = request.headers.get("X-Admin-Token") ?? "";

    if (!tokenRecibido || tokenRecibido !== env.ADMIN_TOKEN) {
      return respuestaJson({ error: "No autorizado." }, 401);
    }

    const tipo = request.headers.get("content-type") ?? "";

    if (!tipo.includes("application/json")) {
      return respuestaJson({ error: "Formato de solicitud no válido." }, 415);
    }

    const cuerpo = await request.json();
    const id = Number(cuerpo?.id);

    if (!Number.isInteger(id) || id <= 0) {
      return respuestaJson({ error: "Identificador no válido." }, 400);
    }

    const resultado = await env.DB.prepare(
      `DELETE FROM comentarios
       WHERE id = ?`,
    )
      .bind(id)
      .run();

    if ((resultado.meta.changes ?? 0) === 0) {
      return respuestaJson({ error: "Comentario no encontrado." }, 404);
    }

    return respuestaJson({ ok: true });
  } catch (error) {
    console.error("Error DELETE /api/comentarios/eliminar:", error);

    return respuestaJson(
      { error: "No se pudo eliminar el comentario." },
      500,
    );
  }
};
