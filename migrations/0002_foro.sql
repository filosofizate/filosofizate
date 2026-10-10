-- Aplicar sobre la D1 existente; no modifica la tabla comentarios.
CREATE TABLE IF NOT EXISTS foro_conversaciones (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 espacio TEXT NOT NULL CHECK (espacio IN ('general','autor','tema')),
 tema TEXT,
 titulo TEXT NOT NULL,
 autor TEXT NOT NULL DEFAULT 'Anónimo',
 contenido TEXT NOT NULL,
 estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','publicado','rechazado')),
 creada TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_foro_conversaciones ON foro_conversaciones(estado,espacio,tema,creada);
CREATE TABLE IF NOT EXISTS foro_mensajes (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 conversacion_id INTEGER NOT NULL REFERENCES foro_conversaciones(id),
 autor TEXT NOT NULL DEFAULT 'Anónimo',
 contenido TEXT NOT NULL,
 estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','publicado','rechazado')),
 creada TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_foro_mensajes ON foro_mensajes(conversacion_id,estado,creada);
