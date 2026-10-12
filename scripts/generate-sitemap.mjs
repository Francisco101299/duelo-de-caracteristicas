// ============================================================================
// scripts/generate-sitemap.mjs
// Genera public/sitemap.xml a partir de scripts/pages.mjs (la misma lista que
// usa el prerender, así sitemap y HTML estático siempre coinciden).
// Uso: node scripts/generate-sitemap.mjs
//
// Cambios respecto a la versión anterior:
//  - Incluye las comparaciones populares (/comparar/x-vs-y).
//  - <lastmod> ya no es "hoy" en todas las URLs en cada build: Google ignora
//    el lastmod de sitios que lo cambian siempre sin que el contenido cambie.
//    Solo los artículos del blog llevan lastmod (su fecha real).
//  - Se quitan changefreq/priority, que Google ignora.
// ============================================================================
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { SITE_URL } from "../src/lib/seo.js";
import { getPages } from "./pages.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const pages = getPages();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map((p) => {
    const lastmod = p.kind === "article" && p.article.date ? `\n    <lastmod>${p.article.date}</lastmod>` : "";
    return `  <url>\n    <loc>${SITE_URL}${p.path === "/" ? "/" : p.path}</loc>${lastmod}\n  </url>`;
  })
  .join("\n")}
</urlset>
`;

const outPath = resolve(__dirname, "../public/sitemap.xml");
writeFileSync(outPath, xml, "utf-8");
console.log(`sitemap.xml generado con ${pages.length} URLs -> ${outPath}`);
