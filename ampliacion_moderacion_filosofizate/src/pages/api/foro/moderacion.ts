import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
export const prerender = false;

function autorizado(request: Request): boolean {
  const esperado = env.ADMIN_TOKEN;
  return Boolean(esperado && request.headers.get('authorization') === `Bearer ${esperado}`);
}
const respuestaError = (error: string, status: number) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

export const GET: APIRoute = async ({ request }) => {
  if (!autorizado(request)) return respuestaError('No autorizado', 401);
  const estado = new URL(request.url).searchParams.get('estado') ?? 'pendiente';
  if (!['pendiente', 'publicado', 'rechazado'].includes(estado)) return respuestaError('Estado incorrecto', 400);
  const [conversaciones, mensajes] = await Promise.all([
    env.DB.prepare('SELECT * FROM foro_conversaciones WHERE estado=? ORDER BY creada DESC LIMIT 200').bind(estado).all(),
    env.DB.prepare('SELECT * FROM foro_mensajes WHERE estado=? ORDER BY creada DESC LIMIT 200').bind(estado).all(),
  ]);
  return Response.json({ conversaciones: conversaciones.results, mensajes: mensajes.results, estado }, { headers: { 'Cache-Control': 'no-store' } });
};

export const POST: APIRoute = async ({ request }) => {
  if (!autorizado(request)) return respuestaError('No autorizado', 401);
  let datos: unknown;
  try { datos = await request.json(); } catch { return respuestaError('JSON incorrecto', 400); }
  if (!datos || typeof datos !== 'object') return respuestaError('Petición inválida', 400);
  const { tipo, id, accion } = datos as { tipo?: unknown; id?: unknown; accion?: unknown };
  if ((tipo !== 'conversacion' && tipo !== 'mensaje') || typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0 ||
      !['publicar', 'rechazar', 'retirar', 'eliminar'].includes(String(accion))) return respuestaError('Petición inválida', 400);
  const tabla = tipo === 'mensaje' ? 'foro_mensajes' : 'foro_conversaciones';
  const actual = await env.DB.prepare(`SELECT estado FROM ${tabla} WHERE id=?`).bind(id).first<{ estado: string }>();
  if (!actual) return respuestaError('La intervención ya no existe', 404);
  if (accion === 'eliminar') {
    if (tipo === 'conversacion') {
      // La conversación y sus respuestas se eliminan juntas, de forma atómica.
      await env.DB.batch([
        env.DB.prepare('DELETE FROM foro_mensajes WHERE conversacion_id=?').bind(id),
        env.DB.prepare('DELETE FROM foro_conversaciones WHERE id=?').bind(id),
      ]);
    } else {
      await env.DB.prepare('DELETE FROM foro_mensajes WHERE id=?').bind(id).run();
    }
    return Response.json({ ok: true, eliminado: true });
  }
  if (accion === 'retirar' && actual.estado !== 'publicado') return respuestaError('Solo se pueden retirar intervenciones publicadas', 409);
  const nuevoEstado = accion === 'publicar' ? 'publicado' : 'rechazado';
  await env.DB.prepare(`UPDATE ${tabla} SET estado=? WHERE id=?`).bind(nuevoEstado, id).run();
  return Response.json({ ok: true, estado: nuevoEstado });
};
