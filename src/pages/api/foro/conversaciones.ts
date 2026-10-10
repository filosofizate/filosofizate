import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { validoTema } from '../../../lib/foro';
export const prerender = false;
export const POST: APIRoute = async ({request}) => {
 try {
  const f = await request.formData();
  const get = (k:string) => String(f.get(k) ?? '').trim();
  if (get('web')) return new Response(JSON.stringify({ok:true}),{status:202});
  const espacio=get('espacio'),tema=get('tema'),titulo=get('titulo'),contenido=get('contenido'),autor=get('autor')||'Anónimo';
  if (!['general','autor','tema'].includes(espacio) || (espacio==='tema'&&!validoTema(tema)) || get('licencia')!=='si' || titulo.length<5 || titulo.length>160 || contenido.length<10 || contenido.length>10000 || autor.length>80) return Response.json({error:'Revisa los campos y la aceptación de licencia.'},{status:400});
  await env.DB.prepare("INSERT INTO foro_conversaciones (espacio,tema,titulo,contenido,autor,estado) VALUES (?,?,?,?,?,'pendiente')").bind(espacio,espacio==='tema'?tema:null,titulo,contenido,autor).run();
  return Response.json({ok:true},{status:202});
 } catch {return Response.json({error:'No se pudo guardar la conversación.'},{status:500});}
};
