# Ampliación del panel de moderación de FilosofíZate

Esta actualización sustituye **solo dos archivos**:

- `src/pages/administracion/foro.astro`
- `src/pages/api/foro/moderacion.ts`

No modifica el esquema D1, la portada ni los ensayos. Usa el `ADMIN_TOKEN` ya existente.

## Instalación

1. Haz una copia de los dos archivos originales.
2. Descomprime el ZIP en `C:\Users\vicen\filosofizate`, conservando las carpetas.
3. Ejecuta `npm run build` y luego `npx wrangler dev --config dist/server/wrangler.json`.
4. Abre `http://127.0.0.1:8787/administracion/foro/` y entra con tu token local.
5. Prueba primero con una intervención creada expresamente para pruebas.

Si reaparece el error `no such table`, utiliza la configuración de D1 local que ya has comprobado:
`npx wrangler d1 execute filosofizate-comentarios --local --config dist/server/wrangler.json --file=migrations/0002_foro.sql`

## Funciones

- **Pendientes:** aprobar o rechazar.
- **Publicadas:** retirar de publicación o eliminar definitivamente.
- **Rechazadas o retiradas:** volver a publicar o eliminar definitivamente.
- Eliminar una conversación elimina también todas sus respuestas, mediante operaciones atómicas en D1.
- La eliminación irreversible requiere dos confirmaciones, incluida la palabra `ELIMINAR`.
- La retirada usa el estado `rechazado` existente, por lo que las retiradas y las rechazadas aparecen juntas.
- Cada lista muestra hasta 200 conversaciones y 200 respuestas. No incluye aún paginación ni búsqueda.

## Seguridad y producción

El servidor exige `ADMIN_TOKEN` para todas las consultas y operaciones. La clave se conserva solo en memoria de la pestaña. No se añade al repositorio ni al HTML.

**No publiques sin probar antes en local**, especialmente la retirada y eliminación de una conversación con respuestas. Confirma que el secreto está configurado en el Worker de producción. La API existente queda sustituida por esta versión ampliada.

**Advertencia:** la eliminación definitiva no es reversible; haz una copia de seguridad de D1 antes de utilizarla en producción. Los comentarios de ensayos anteriores no están incluidos en este panel.
