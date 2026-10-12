// ============================================================================
// scripts/prerender.mjs
// Se ejecuta DESPUÉS de `vite build` (ver "build" en package.json).
//
// Problema que resuelve: el sitio es una SPA de React. El HTML que recibía
// Google en cada URL era el mismo index.html vacío (<div id="root"></div>) con
// el título/canonical de la home; el título, la descripción, el canonical y el
// JSON-LD reales de cada página solo aparecían después de ejecutar JavaScript.
//
// Qué hace: toma dist/index.html (ya con los <script> con hash que genera
// Vite) y escribe un archivo dist/<ruta>/index.html por cada página de
// scripts/pages.mjs, con:
//   - <title>, meta description, canonical, Open Graph y JSON-LD propios,
//   - un resumen del contenido (h1, texto, specs, enlaces) dentro de #root.
// Cuando React carga, createRoot() reemplaza ese contenido por la app normal,
// así que para el usuario no cambia nada; no hay hidratación ni riesgo de
// desajustes. Vercel sirve estos archivos antes de aplicar los rewrites.
//
// También crea dist/spa-fallback.html: la plantilla SIN canonical ni
// og:url, usada por vercel.json para las rutas que no se prerenderizan (así
// una ruta desconocida ya no hereda "canonical = home").
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { DEVICES, CATEGORY_CONFIG, catsFor, catsForPair, overallOf, getDevicesByType } from "../src/data/devices.js";
import {
  SITE_NAME,
  homeMeta,
  categoryMeta,
  deviceMeta,
  comparisonMeta,
  comparisonSlug,
  absoluteUrl,
  deviceProductJsonLd,
  comparisonJsonLd,
  breadcrumbJsonLd,
  websiteJsonLd,
  organizationJsonLd,
} from "../src/lib/seo.js";
import { t as tr } from "../src/lib/i18n.js";
import { getPages } from "./pages.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.PRERENDER_DIST ? resolve(process.env.PRERENDER_DIST) : resolve(__dirname, "../dist");
const t = (key, vars) => tr("es", key, vars);

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function parsePriceNumber(priceStr) {
  if (!priceStr || typeof priceStr !== "string") return null;
  const n = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

function catLabel(c) {
  const key = `cat.${c.key}`;
  const txt = t(key);
  return txt === key ? c.label : txt;
}

const link = (path, text) => `<a href="${esc(path)}">${esc(text)}</a>`;

// Mismos "rivales" que muestra DevicePage.jsx (los 6 de precio más cercano).
function rivalsOf(device) {
  const currentPrice = parsePriceNumber(device.price);
  return getDevicesByType(device.type)
    .filter((d) => d.id !== device.id)
    .sort((a, b) => {
      if (currentPrice === null) return 0;
      const pa = parsePriceNumber(a.price);
      const pb = parsePriceNumber(b.price);
      const da = pa !== null ? Math.abs(pa - currentPrice) : Infinity;
      const db = pb !== null ? Math.abs(pb - currentPrice) : Infinity;
      return da - db;
    })
    .slice(0, 6);
}

// ---------------------------------------------------------------------------
// Contenido por tipo de página: { title, description, canonical, ogType, jsonLd, body }
// ---------------------------------------------------------------------------
const STATIC_META = {
  "/blog": { title: t("blog.seoTitle"), description: t("blog.seoDescription"), h1: "Blog", sub: t("blog.subtitle") },
  "/acerca-de": { title: t("about.seoTitle"), description: t("about.seoDescription"), h1: t("about.seoTitle") },
  "/preguntas-frecuentes": { title: t("nav.faq"), description: t("faq.seoDescription"), h1: t("nav.faq") },
  "/privacidad": { title: t("footer.privacy"), description: t("privacy.seoDescription"), h1: t("footer.privacy") },
  "/contacto": {
    title: "Contacto",
    description: "Ponte en contacto con Duelo de Características para dudas, sugerencias o comentarios.",
    h1: "Contacto",
  },
  "/politica-cookies": {
    title: "Política de cookies y divulgación de afiliados — Duelo de Características",
    description:
      "Cómo usamos el almacenamiento local en Duelo de Características y cómo funcionan nuestros enlaces de afiliados.",
    h1: "Política de cookies y divulgación de afiliados",
  },
  "/sugerir": {
    title: "Sugerir un dispositivo",
    description: "¿No encuentras tu celular, computadora o tablet? Sugiérelo y lo agregamos al comparador.",
    h1: "Sugerir un dispositivo",
  },
};

function buildHome() {
  const meta = homeMeta();
  const cats = Object.entries(CATEGORY_CONFIG)
    .map(([slug, cfg]) => `<li>${link(`/${slug}`, t(cfg.labelKey))}</li>`)
    .join("");
  return {
    title: meta.title,
    description: meta.description,
    canonical: meta.canonical,
    ogType: "website",
    jsonLd: [websiteJsonLd(), organizationJsonLd()],
    body: `<h1>${esc(t("home.title"))}</h1><p>${esc(t("home.subtitle"))}</p><nav aria-label="Categorías"><ul>${cats}</ul></nav>`,
  };
}

function buildCategory(page) {
  const cfg = CATEGORY_CONFIG[page.slugType];
  const devices = DEVICES.filter((d) => cfg.types.includes(d.type)).sort((a, b) => overallOf(b) - overallOf(a));
  const label = t(cfg.labelKey);
  const meta = categoryMeta(page.slugType, devices.length, label);
  const items = devices
    .map((d) => `<li>${link(`/${d.slugType}/${d.slug}`, d.name)} — ${esc(d.year)} · ${esc(d.price)}</li>`)
    .join("");
  return {
    title: meta.title,
    description: meta.description,
    canonical: meta.canonical,
    ogType: "website",
    jsonLd: [breadcrumbJsonLd([{ name: "Inicio", path: "/" }, { name: label, path: `/${page.slugType}` }])],
    body: `<nav><a href="/">${esc(t("breadcrumb.home"))}</a> · ${esc(label)}</nav><h1>${esc(label)}</h1><p>${esc(
      t("category.subtitle", { count: devices.length })
    )}</p><ul>${items}</ul>`,
  };
}

function buildDevice(page) {
  const d = page.device;
  const meta = deviceMeta(d);
  const cfg = CATEGORY_CONFIG[d.slugType];
  const label = cfg ? t(cfg.labelKey) : "Dispositivos";
  const specs = catsFor(d)
    .map((c) => {
      const score = typeof d.scores[c.key] === "number" ? d.scores[c.key] : t("device.notApplicable");
      return `<li><strong>${esc(catLabel(c))}</strong>: ${esc(d.details[c.key])} (${esc(score)})</li>`;
    })
    .join("");
  const rivals = rivalsOf(d)
    .map((o) => `<li>${link(`/comparar/${comparisonSlug(d, o)}`, `${d.name} vs ${o.name}`)}</li>`)
    .join("");
  return {
    title: meta.title,
    description: meta.description,
    canonical: meta.canonical,
    ogType: meta.ogType,
    jsonLd: [
      deviceProductJsonLd(d),
      breadcrumbJsonLd([
        { name: "Inicio", path: "/" },
        { name: label, path: `/${d.slugType}` },
        { name: d.name, path: meta.path },
      ]),
    ],
    body:
      `<nav>${link("/", t("breadcrumb.home"))} · ${link(`/${d.slugType}`, label)} · ${esc(d.name)}</nav>` +
      `<h1>${esc(d.name)}</h1><p>${esc(d.type)} · ${esc(d.year)}. ${esc(t("device.subtitle", { price: d.price }))}</p>` +
      `<p>${esc(t("device.overallScore"))}: ${overallOf(d)}/100</p>` +
      `<h2>${esc(t("device.specsTitle"))}</h2><ul>${specs}</ul>` +
      `<h2>${esc(t("device.compareTitle", { name: d.name, type: t(`type.${d.type}`) }))}</h2><ul>${rivals}</ul>`,
  };
}

function buildComparison(page) {
  const { a, b } = page;
  const meta = comparisonMeta(a, b);
  const cats = catsForPair(a, b);
  const rows = cats
    .map((c) => `<tr><th scope="row">${esc(catLabel(c))}</th><td>${esc(a.scores[c.key])}</td><td>${esc(b.scores[c.key])}</td></tr>`)
    .join("");
  const oa = overallOf(a);
  const ob = overallOf(b);
  const verdict =
    oa === ob
      ? `${a.name} y ${b.name} empatan con ${oa}/100 de puntuación general.`
      : `${oa > ob ? a.name : b.name} obtiene la mejor puntuación general (${Math.max(oa, ob)}/100 contra ${Math.min(oa, ob)}/100).`;
  return {
    title: meta.title,
    description: meta.description,
    canonical: meta.canonical,
    ogType: "website",
    jsonLd: [
      comparisonJsonLd(a, b),
      breadcrumbJsonLd([
        { name: "Inicio", path: "/" },
        { name: a.name, path: `/${a.slugType}/${a.slug}` },
        { name: `${a.name} vs ${b.name}`, path: meta.path },
      ]),
    ],
    body:
      `<nav>${link("/", "Inicio")} / Comparación</nav>` +
      `<h1>${esc(a.name)} vs ${esc(b.name)}</h1>` +
      `<p>Comparación categoría por categoría: ${esc(cats.map((c) => catLabel(c).toLowerCase()).join(", "))}.</p>` +
      `<p>${esc(verdict)}</p>` +
      `<table><thead><tr><th></th><th>${esc(a.name)}</th><th>${esc(b.name)}</th></tr></thead><tbody>${rows}</tbody></table>` +
      `<p>${link(`/${a.slugType}/${a.slug}`, `Ficha técnica de ${a.name}`)} · ${link(`/${b.slugType}/${b.slug}`, `Ficha técnica de ${b.name}`)}</p>`,
  };
}

function buildArticle(page) {
  const a = page.article;
  const paragraphs = (a.content || []).filter((x) => typeof x === "string").map((x) => `<p>${esc(x)}</p>`).join("");
  return {
    title: a.title,
    description: a.excerpt,
    canonical: absoluteUrl(`/blog/${a.id}`),
    ogType: "website",
    jsonLd: [],
    body: `<nav>${link("/", t("breadcrumb.home"))} · ${link("/blog", "Blog")}</nav><h1>${esc(a.title)}</h1><p>${esc(a.date)}</p>${paragraphs}`,
  };
}

function buildBlogIndex(path) {
  const m = STATIC_META[path];
  const items = [...(getPages().filter((p) => p.kind === "article").map((p) => p.article))]
    .sort((x, y) => (y.date || "").localeCompare(x.date || ""))
    .map((a) => `<li>${link(`/blog/${a.id}`, a.title)} — ${esc(a.excerpt)}</li>`)
    .join("");
  return `<h1>${esc(m.h1)}</h1><p>${esc(m.sub)}</p><ul>${items}</ul>`;
}

function buildStatic(page) {
  const m = STATIC_META[page.path];
  if (!m) throw new Error(`Falta STATIC_META para ${page.path}`);
  return {
    title: m.title,
    description: m.description,
    canonical: absoluteUrl(page.path),
    ogType: "website",
    jsonLd: [],
    body: page.path === "/blog" ? buildBlogIndex(page.path) : `<h1>${esc(m.h1)}</h1><p>${esc(m.description)}</p>`,
  };
}

function buildPage(page) {
  switch (page.kind) {
    case "home":
      return buildHome();
    case "category":
      return buildCategory(page);
    case "device":
      return buildDevice(page);
    case "comparison":
      return buildComparison(page);
    case "article":
      return buildArticle(page);
    case "static":
      return buildStatic(page);
    default:
      throw new Error(`Tipo de página desconocido: ${page.kind}`);
  }
}

// ---------------------------------------------------------------------------
// Plantilla HTML
// ---------------------------------------------------------------------------
// Quita del <head> lo que cambia por página (el resto -- og:image, twitter:card,
// fuentes, gtag, scripts con hash de Vite -- se conserva tal cual).
function stripSeo(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s[^>]*?name="description"[^>]*>/gi, "")
    .replace(/<link\s[^>]*?rel="canonical"[^>]*>/gi, "")
    .replace(/<meta\s[^>]*?property="og:(title|description|url|type)"[^>]*>/gi, "")
    .replace(/<meta\s[^>]*?name="twitter:(title|description)"[^>]*>/gi, "");
}

function fullTitle(title) {
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

function headBlock(p) {
  const title = fullTitle(p.title);
  const lines = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(p.description)}" />`,
  ];
  if (p.canonical) {
    lines.push(`<link rel="canonical" href="${esc(p.canonical)}" />`);
    lines.push(`<meta property="og:url" content="${esc(p.canonical)}" />`);
  }
  lines.push(
    `<meta property="og:type" content="${esc(p.ogType || "website")}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(p.description)}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(p.description)}" />`
  );
  (p.jsonLd || []).forEach((data, i) => {
    // Mismos ids que usa SeoHead.jsx: al montar React reemplaza estos
    // scripts en vez de duplicarlos.
    lines.push(
      `<script type="application/ld+json" id="seo-jsonld-${i}">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`
    );
  });
  return lines.join("\n");
}

const PRERENDER_CSS =
  "<style>.prerender{max-width:720px;margin:0 auto;padding:24px 20px;font-family:Inter,system-ui,sans-serif;color:#14181F;line-height:1.5}" +
  ".prerender a{color:#14181F}.prerender table{border-collapse:collapse}.prerender th,.prerender td{border:1px solid #D9DCE3;padding:4px 8px;text-align:left}</style>";

function render(template, p) {
  let html = stripSeo(template);
  html = html.replace(/<\/head>/i, `${headBlock(p)}\n${PRERENDER_CSS}\n</head>`);
  const root = /<div id="root">\s*<\/div>/i;
  if (!root.test(html)) throw new Error('No encontré <div id="root"></div> en dist/index.html');
  return html.replace(root, `<div id="root"><main class="prerender">${p.body}</main></div>`);
}

function outFile(path) {
  return path === "/" ? join(DIST, "index.html") : join(DIST, path.slice(1), "index.html");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const templatePath = join(DIST, "index.html");
if (!existsSync(templatePath)) {
  console.error(`No existe ${templatePath}. Ejecuta primero "vite build".`);
  process.exit(1);
}
const template = readFileSync(templatePath, "utf8");

// 1) Plantilla de respaldo (rutas no prerenderizadas): sin canonical ni og:url.
const fallback = render(template, {
  title: `${SITE_NAME}: compara celulares y computadoras`,
  description: homeMeta().description,
  canonical: null,
  ogType: "website",
  jsonLd: [],
  body: "",
}).replace(/<main class="prerender"><\/main>/, "");
writeFileSync(join(DIST, "spa-fallback.html"), fallback, "utf8");

// 2) Una página estática por ruta.
const pages = getPages();
const seen = new Set();
let count = 0;
for (const page of pages) {
  if (seen.has(page.path)) throw new Error(`Ruta duplicada: ${page.path}`);
  seen.add(page.path);
  const html = render(template, buildPage(page));
  const file = outFile(page.path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html, "utf8");
  count++;
}
console.log(`prerender: ${count} páginas + spa-fallback.html en ${DIST}`);
