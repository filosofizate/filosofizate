import { env } from 'cloudflare:workers';
export const DB = () => env.DB;
export const temas = ['Acumulación','Capital','Capitalismo','Clases','Condonación','Confianza','Control','Crédito','Deuda','Desigualdad','Donación','Especulación','Frontera','Huniverso','Igualdad','Información','Interés','Lo común','Neoliberalismo','Propiedad','Reciprocidad','Separación','Soberanía','Vivienda'];
export const rutaTema = (tema: string) => `/foro/tema/${encodeURIComponent(tema)}/`;
export function validoTema(t: string) { return temas.includes(t); }
export type Conversacion = { id: number; espacio: string; tema: string | null; titulo: string; autor: string; contenido: string; creada: string; respuestas?: number };
export type Mensaje = { id: number; conversacion_id: number; autor: string; contenido: string; creada: string };
