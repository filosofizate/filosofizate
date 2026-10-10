import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
export const prerender = false;
function autorizado(request:Request) {const esperado=env.ADMIN_TOKEN;const recibido=request.headers.get('authorization');return Boolean(esperado&&recibido===`Bearer ${esperado}`);}
export const GET: APIRoute = async ({request})=>{
 if(!autorizado(request))return new Response('No autorizado',{status:401});
 const conversaciones=await env.DB.prepare("SELECT * FROM foro_conversaciones WHERE estado='pendiente' ORDER BY creada ASC LIMIT 100").all();
 const mensajes=await env.DB.prepare("SELECT * FROM foro_mensajes WHERE estado='pendiente' ORDER BY creada ASC LIMIT 100").all();
 return Response.json({conversaciones:conversaciones.results,mensajes:mensajes.results});
};
export const POST: APIRoute = async ({request})=>{
 if(!autorizado(request))return new Response('No autorizado',{status:401});
 let datos:unknown;try{datos=await request.json()}catch{return Response.json({error:'JSON incorrecto'},{status:400})}
 const d=datos as {tipo?:string;id?:number;accion?:string};
 if(!['conversacion','mensaje'].includes(d.tipo??'')||!Number.isSafeInteger(d.id)||Number(d.id)<=0||!['publicar','rechazar'].includes(d.accion??''))return Response.json({error:'Petición inválida'},{status:400});
 const tabla=d.tipo==='mensaje'?'foro_mensajes':'foro_conversaciones';
 await env.DB.prepare(`UPDATE ${tabla} SET estado=? WHERE id=? AND estado='pendiente'`).bind(d.accion==='publicar'?'publicado':'rechazado',d.id).run();
 return Response.json({ok:true});
};
