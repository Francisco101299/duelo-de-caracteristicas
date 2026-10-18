// ============================================================================
// src/lib/recommender.js
// Lógica del asistente "¿Cuál me conviene?". Sin React: solo datos y cálculo,
// para poder probarla fuera del navegador.
//
// Cómo recomienda: toma los dispositivos de una categoría, descarta los que
// superan el presupuesto, y los ordena con un promedio ponderado de sus
// puntuaciones (las mismas del catálogo). Las categorías que el usuario marca
// como prioridad pesan 5 y el resto 2; si no marca ninguna, todas pesan igual.
// ============================================================================
import { DEVICES, CATEGORY_CONFIG, catsFor, overallOf } from "../data/devices.js";

// Categorías que ofrece el asistente (slugs de CATEGORY_CONFIG).
export const REC_CATEGORIES = ["celulares", "computadoras", "tablets", "relojes", "drones"];

// Escalones de presupuesto en USD por categoría (el último botón es "sin límite").
export const BUDGET_STEPS = {
  celulares: [200, 400, 700, 1000],
  computadoras: [600, 900, 1300, 2000],
  tablets: [250, 400, 600],
  relojes: [100, 200, 350],
  drones: [200, 500, 1000],
};

// Prioridades que no tienen sentido para una categoría aunque el catálogo
// tenga un número (por ejemplo, la "cámara" de un reloj).
const EXCLUDED_PRIORITIES = {
  relojes: ["camara"],
};

const WEIGHT_PRIORITY = 5;
const WEIGHT_OTHER = 2;
const WEIGHT_EQUAL = 3;

export function priceNumber(device) {
  if (!device || typeof device.price !== "string") return null;
  const n = parseFloat(device.price.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

export function devicesInCategory(slug) {
  const cfg = CATEGORY_CONFIG[slug];
  return cfg ? DEVICES.filter((d) => cfg.types.includes(d.type)) : [];
}

// Categorías de puntuación que se pueden elegir como prioridad: solo las que
// la mayoría de los dispositivos de la categoría sí tiene (por ejemplo, un
// reloj no tiene "Cámara", así que no se ofrece).
export function priorityOptions(slug) {
  const devices = devicesInCategory(slug);
  if (!devices.length) return [];
  const excluded = EXCLUDED_PRIORITIES[slug] || [];
  return catsFor(devices[0]).filter((c) => {
    if (excluded.includes(c.key)) return false;
    const withScore = devices.filter((d) => typeof d.scores[c.key] === "number").length;
    return withScore >= devices.length / 2;
  });
}

function weightedScore(device, cats, priorities) {
  let sum = 0;
  let total = 0;
  for (const c of cats) {
    const v = device.scores[c.key];
    const isPriority = priorities.includes(c.key);
    const w = priorities.length ? (isPriority ? WEIGHT_PRIORITY : WEIGHT_OTHER) : WEIGHT_EQUAL;
    if (typeof v === "number") {
      sum += v * w;
      total += w;
    } else if (isPriority) {
      // Si el usuario prioriza algo que este dispositivo no tiene, cuenta como 0.
      total += w;
    }
  }
  return total ? Math.round(sum / total) : 0;
}

// Devuelve hasta `limit` recomendaciones: [{ device, score, overall, strengths }]
// strengths = las 2 categorías donde más destaca (entre las prioridades, si hay).
export function recommend({ slug, maxPrice = null, priorities = [], limit = 3 }) {
  const all = devicesInCategory(slug);
  if (!all.length) return [];
  const cats = catsFor(all[0]);
  const validPriorities = priorities.filter((k) => cats.some((c) => c.key === k));

  const inBudget = all.filter((d) => {
    if (maxPrice === null) return true;
    const p = priceNumber(d);
    return p !== null && p <= maxPrice;
  });

  const ranked = inBudget.map((device) => {
    const score = weightedScore(device, cats, validPriorities);
    const pool = cats
      .filter((c) => typeof device.scores[c.key] === "number")
      .filter((c) => !validPriorities.length || validPriorities.includes(c.key));
    const strengths = pool
      .map((c) => ({ key: c.key, label: c.label, value: device.scores[c.key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 2);
    return { device, score, overall: overallOf(device), strengths };
  });

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.overall !== a.overall) return b.overall - a.overall;
    return (priceNumber(a.device) ?? Infinity) - (priceNumber(b.device) ?? Infinity);
  });

  return ranked.slice(0, limit);
}
