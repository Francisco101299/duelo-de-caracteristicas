// ============================================================================
// scripts/pages.mjs
// Fuente ÚNICA de las páginas indexables del sitio. La usan tanto
// generate-sitemap.mjs como prerender.mjs, para que el sitemap y el HTML
// estático nunca se desincronicen (todo lo que está en el sitemap tiene su
// propio HTML prerenderizado, y viceversa).
// ============================================================================
import { DEVICES, CATEGORY_CONFIG, overallOf } from "../src/data/devices.js";
import { ARTICLES } from "../src/data/articles.js";
import { comparisonSlug } from "../src/lib/seo.js";

// Duelos que se prerenderizan y van al sitemap: los N mejores dispositivos de
// cada tipo principal, todos contra todos. Son los duelos que la gente busca
// de verdad ("iPhone X vs Galaxy Y"). No se generan las ~100.000 combinaciones
// posibles: miles de páginas casi idénticas gastan el presupuesto de rastreo
// y Google tiende a descartarlas. Sube TOP_N solo cuando el sitio ya tenga
// páginas indexadas y tráfico.
export const COMPARISON_TYPES = ["Celular", "Laptop", "Tablet", "Smartwatch"];
export const TOP_N = 8;

export const STATIC_PATHS = [
  "/blog",
  "/acerca-de",
  "/preguntas-frecuentes",
  "/sugerir",
  "/privacidad",
  "/contacto",
  "/politica-cookies",
];

export function getComparisonPairs() {
  const pairs = [];
  const seen = new Set();
  for (const type of COMPARISON_TYPES) {
    const top = DEVICES.filter((d) => d.type === type)
      .sort((a, b) => overallOf(b) - overallOf(a))
      .slice(0, TOP_N);
    for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        const slug = comparisonSlug(top[i], top[j]);
        if (seen.has(slug)) continue;
        seen.add(slug);
        // Mismo orden que la URL (alfabético por slug): así el título y el
        // texto salen idénticos a lo que muestra ComparisonPage.jsx.
        const [a, b] = top[i].slug <= top[j].slug ? [top[i], top[j]] : [top[j], top[i]];
        pairs.push({ slug, a, b, type });
      }
    }
  }
  return pairs;
}

// Devuelve [{ path, kind, ...datos }] para todas las páginas indexables.
export function getPages() {
  const pages = [{ path: "/", kind: "home" }];

  for (const slug of Object.keys(CATEGORY_CONFIG)) {
    pages.push({ path: `/${slug}`, kind: "category", slugType: slug });
  }
  for (const p of STATIC_PATHS) {
    pages.push({ path: p, kind: "static" });
  }
  for (const d of DEVICES) {
    pages.push({ path: `/${d.slugType}/${d.slug}`, kind: "device", device: d });
  }
  for (const a of ARTICLES) {
    pages.push({ path: `/blog/${a.id}`, kind: "article", article: a });
  }
  for (const p of getComparisonPairs()) {
    pages.push({ path: `/comparar/${p.slug}`, kind: "comparison", a: p.a, b: p.b });
  }
  return pages;
}
