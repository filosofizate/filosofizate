# Foro de FilosofíZate — instalación

## Qué incluye

Portada adaptada desde `index(7).astro`, foro general, conversaciones con el autor, foros por concepto, hilos, respuestas, licencia, API y migración D1. El formulario de contacto anterior se mantiene. Los comentarios antiguos de IA no se migran ni se modifican.

**IMPORTANTE**: Es una primera versión funcional para pruebas, no una solución de producción completamente endurecida. No publiques el foro abierto hasta incorporar protección antispam/rate limiting (p. ej., Turnstile + Cloudflare WAF), una política de privacidad completa y un sistema de moderación más cómodo. Por defecto todo queda pendiente de aprobación.

## Copia de archivos

1. Haz copia de `src/pages/index.astro`.
2. Descomprime este ZIP en la raíz `C:\Users\vicen\filosofizate` respetando las carpetas. Sobrescribe **solo** `src/pages/index.astro`; el resto de rutas son nuevas, salvo que ya tengas archivos con esos nombres.
3. Revisa el contenido de `src/pages/index.astro` antes de confirmar los cambios.

## Base de datos

Desde la raíz del proyecto:

```powershell
npx wrangler d1 execute filosofizate-comentarios --local --file=migrations/0002_foro.sql
```

Para aplicar en producción **después de revisar y probar en local**:

```powershell
npx wrangler d1 execute filosofizate-comentarios --remote --file=migrations/0002_foro.sql
```

Si tu base de datos tiene otro nombre, cambia `filosofizate-comentarios`.

## Prueba local

```powershell
npm run build
npx wrangler dev --config dist/server/wrangler.json
```

Visita `/foro/`, `/foro/general/`, `/foro/autor/`, `/foro/tema/Desigualdad/` y `/licencia/`.

## Moderación (API, sin interfaz de administración aún)

Usa el secreto `ADMIN_TOKEN` ya existente. Nunca lo incluyas en código ni lo subas a Git.

Consultar pendientes con PowerShell (sustituye token y dominio):

```powershell
$token = 'TU_TOKEN_ADMIN'
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri 'http://localhost:8787/api/foro/moderacion' -Headers $headers
```

Aprobar una conversación:

```powershell
$body = @{ tipo = 'conversacion'; id = 1; accion = 'publicar' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:8787/api/foro/moderacion' -Headers $headers -ContentType 'application/json' -Body $body
```

Para una respuesta usa `tipo = 'mensaje'`. Para rechazar usa `accion = 'rechazar'`. El ID debe tomarse de la consulta de pendientes, no asumir que es 1.

En producción usa `https://filosofizate.es` como dominio, exclusivamente mediante HTTPS. Evita guardar el token en historial compartido.

## Publicación

```powershell
git add .
git commit -m "Incorpora foro abierto moderado"
git push
```

Cloudflare seguirá usando la configuración de despliegue que ya tienes.

## Limitaciones a revisar

- La página de conceptos usa una **lista inicial parcial** de relaciones ensayo-etiqueta. Hay que extraer todos los ensayos de una fuente única para que muestre los veinte automáticamente.
- No incluye interfaz gráfica privada de moderación; sí API autenticada.
- No incluye Turnstile ni límites de frecuencia; imprescindible antes de abrirlo al público.
- Los comentarios históricos no se relicencian ni migran.
- Revisa condiciones de licencia, privacidad, gestión de retiradas y textos de terceros antes del lanzamiento.
- La etiqueta y el tema se comprueban en servidor; el texto se representa como texto, no como HTML ejecutable.
