import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const ensayos = defineCollection({
  loader: glob({
    base: "./src/content/ensayos",
    pattern: "**/*.{md,mdx}",
  }),

  schema: z.object({
    titulo: z.string(),
    descripcion: z.string(),
    fecha: z.coerce.date(),
    autor: z.string().default("Vicente Domínguez Arca"),
    conceptos: z.array(z.string()).default([]),
    destacado: z.boolean().default(false),
    borrador: z.boolean().default(false),
  }),
});

export const collections = {
  ensayos,
};