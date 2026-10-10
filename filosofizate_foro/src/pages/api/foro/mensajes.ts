import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
export const prerender = false;
export const POST: APIRoute = async ({request}) => {
 try {
  const f=await request.formData();const get=(k:string)=>String(f.get(k)??'').trim();
  if(get('web'))return Response.json({ok:true},{status:202});
  const id=Number(get('conversacion_id')),contenido=get('contenido'),autor=get('autor')||'Anónimo';
  if(!Number.isSafeInteger(id)||id<=0||contenido.length<10||contenido.length>10000||autor.length>80||get('licencia')!=='si')return Response.json({error:'Revisa los campos y la licencia.'},{status:400});
  const existe=await env.DB.prepare("SELECT id FROM foro_conversaciones WHERE id=? AND estado='publicado'").bind(id).first();
  if(!existe)return Response.json({error:'Conversación no disponible.'},{status:404});
  await env.DB.prepare("INSERT INTO foro_mensajes (conversacion_id,autor,contenido,estado) VALUES (?,?,?,'pendiente')").bind(id,autor,contenido).run();
  return Response.json({ok:true},{status:202});
 }catch{return Response.json({error:'No se pudo guardar la respuesta.'},{status:500});}
};
