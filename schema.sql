CREATE TABLE IF NOT EXISTS comentarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  nombre TEXT,
  comentario TEXT NOT NULL,
  fecha TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comentarios_slug_fecha
ON comentarios (slug, fecha);