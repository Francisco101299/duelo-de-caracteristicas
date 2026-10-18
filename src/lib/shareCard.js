// ============================================================================
// src/lib/shareCard.js
// Genera la "tarjeta del duelo": una imagen vertical (1080x1350) con los dos
// dispositivos, su puntuación, quién gana y las categorías, lista para
// mandar por WhatsApp/Facebook o subir a TikTok/Reels.
//
// Cómo funciona: buildCardSvg() arma un SVG como texto (sin librerías ni
// recursos externos) y svgToPngBlob() lo convierte a PNG en el navegador con
// un <canvas>. shareOrDownload() usa el menú de compartir del celular si
// existe, y si no descarga la imagen.
// ============================================================================

const W = 1080;
const H = 1350;
const FONT = "'Space Grotesk', 'Inter', 'Segoe UI', Roboto, Arial, sans-serif";
const MONO = "'IBM Plex Mono', 'Courier New', monospace";

const C = {
  bg: "#14181F",
  panel: "#1C222C",
  track: "#262D3A",
  a: "#F0553B",
  b: "#0E8F86",
  text: "#FFFFFF",
  muted: "#9BA1AD",
  soft: "#C9CDD6",
  gold: "#C99A2E",
};

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Parte un texto en hasta `maxLines` líneas de `maxChars` caracteres, cortando
// por palabras. Si no cabe, la última línea termina en "…".
export function wrapLines(text, maxChars, maxLines) {
  const words = String(text ?? "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxChars || !cur) {
      cur = next;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    if (last.length > maxChars - 1) last = last.slice(0, maxChars - 1);
    kept[maxLines - 1] = last.replace(/[\s.,;:-]+$/, "") + "…";
    return kept;
  }
  return lines.length ? lines : [""];
}

function t(lang, es, en) {
  return lang === "en" ? en : es;
}

// data = { nameA, nameB, priceA, priceB, overallA, overallB,
//          rows: [{ label, a, b }], lang, host }
export function buildCardSvg(data) {
  const lang = data.lang === "en" ? "en" : "es";
  const overallA = Number(data.overallA) || 0;
  const overallB = Number(data.overallB) || 0;
  const aWins = overallA > overallB;
  const bWins = overallB > overallA;
  const rows = (data.rows || []).slice(0, 6);

  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  parts.push(`<rect width="${W}" height="${H}" fill="${C.bg}"/>`);
  // Franjas de color arriba (naranja = A, verde azulado = B)
  parts.push(`<rect x="0" y="0" width="${W / 2}" height="14" fill="${C.a}"/>`);
  parts.push(`<rect x="${W / 2}" y="0" width="${W / 2}" height="14" fill="${C.b}"/>`);

  // Encabezado
  parts.push(
    `<text x="${W / 2}" y="86" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="700" letter-spacing="5" fill="${C.muted}">${esc(
      t(lang, "DUELO DE CARACTERÍSTICAS", "FEATURE DUEL")
    )}</text>`
  );
  parts.push(
    `<text x="${W / 2}" y="160" text-anchor="middle" font-family="${FONT}" font-size="64" font-weight="700" fill="${C.text}">${esc(
      t(lang, "¿Cuál gana?", "Which one wins?")
    )}</text>`
  );

  // Nombres, precios y puntuación general
  const cols = [
    { x: 270, color: C.a, name: data.nameA, price: data.priceA, score: overallA, win: aWins },
    { x: 810, color: C.b, name: data.nameB, price: data.priceB, score: overallB, win: bWins },
  ];
  for (const col of cols) {
    const long = String(col.name || "").length > 26;
    const size = long ? 38 : 44;
    const lines = wrapLines(col.name, long ? 20 : 17, 2);
    lines.forEach((ln, i) => {
      parts.push(
        `<text x="${col.x}" y="${255 + i * (size + 8)}" text-anchor="middle" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${col.color}">${esc(ln)}</text>`
      );
    });
    if (col.price) {
      parts.push(
        `<text x="${col.x}" y="365" text-anchor="middle" font-family="${MONO}" font-size="30" font-weight="600" fill="${C.soft}">${esc(col.price)}</text>`
      );
    }
    parts.push(
      `<text x="${col.x}" y="515" text-anchor="middle" font-family="${FONT}" font-size="160" font-weight="700" fill="${col.win ? col.color : C.text}" fill-opacity="${col.win || (!aWins && !bWins) ? 1 : 0.55}">${col.score}</text>`
    );
    parts.push(
      `<text x="${col.x}" y="560" text-anchor="middle" font-family="${FONT}" font-size="22" letter-spacing="3" fill="${C.muted}">${esc(
        t(lang, "PUNTUACIÓN GENERAL", "OVERALL SCORE")
      )}</text>`
    );
  }
  parts.push(
    `<text x="${W / 2}" y="440" text-anchor="middle" font-family="${FONT}" font-size="64" font-weight="700" fill="${C.muted}">VS</text>`
  );

  // Banner del ganador
  const winnerName = aWins ? data.nameA : bWins ? data.nameB : "";
  const bannerColor = aWins ? C.a : bWins ? C.b : "#3A4150";
  const prefix = t(lang, "Gana ", "Winner: ");
  const longBanner = winnerName && prefix.length + String(winnerName).length > 28;
  const bannerSize = longBanner ? 34 : 40;
  const bannerText = winnerName
    ? prefix + wrapLines(winnerName, longBanner ? 38 - prefix.length : 28, 1)[0]
    : t(lang, "Empate", "It's a tie");
  parts.push(`<rect x="90" y="610" width="${W - 180}" height="86" rx="43" fill="${bannerColor}"/>`);
  parts.push(
    `<text x="${W / 2}" y="668" text-anchor="middle" font-family="${FONT}" font-size="${bannerSize}" font-weight="700" fill="${C.text}">${esc(bannerText)}</text>`
  );

  // Barras por categoría
  const top = 750;
  const rowH = 82;
  rows.forEach((r, i) => {
    const y0 = top + i * rowH;
    const a = typeof r.a === "number" ? r.a : null;
    const b = typeof r.b === "number" ? r.b : null;
    const aBetter = a !== null && b !== null && a > b;
    const bBetter = a !== null && b !== null && b > a;
    const maxLen = 380;
    const lenA = a === null ? 0 : Math.max(0, Math.min(100, a)) / 100 * maxLen;
    const lenB = b === null ? 0 : Math.max(0, Math.min(100, b)) / 100 * maxLen;
    parts.push(
      `<text x="${W / 2}" y="${y0}" text-anchor="middle" font-family="${FONT}" font-size="25" fill="${C.soft}">${esc(
        wrapLines(r.label, 30, 1)[0]
      )}</text>`
    );
    // pistas
    parts.push(`<rect x="${510 - maxLen}" y="${y0 + 14}" width="${maxLen}" height="24" rx="12" fill="${C.track}"/>`);
    parts.push(`<rect x="570" y="${y0 + 14}" width="${maxLen}" height="24" rx="12" fill="${C.track}"/>`);
    // barras (la A crece hacia la izquierda, la B hacia la derecha)
    if (lenA > 0)
      parts.push(
        `<rect x="${510 - lenA}" y="${y0 + 14}" width="${lenA}" height="24" rx="12" fill="${C.a}" fill-opacity="${aBetter || !bBetter ? 1 : 0.5}"/>`
      );
    if (lenB > 0)
      parts.push(
        `<rect x="570" y="${y0 + 14}" width="${lenB}" height="24" rx="12" fill="${C.b}" fill-opacity="${bBetter || !aBetter ? 1 : 0.5}"/>`
      );
    parts.push(
      `<text x="100" y="${y0 + 36}" text-anchor="end" font-family="${FONT}" font-size="30" font-weight="700" fill="${aBetter ? C.a : C.soft}">${a === null ? "–" : a}</text>`
    );
    parts.push(
      `<text x="980" y="${y0 + 36}" text-anchor="start" font-family="${FONT}" font-size="30" font-weight="700" fill="${bBetter ? C.b : C.soft}">${b === null ? "–" : b}</text>`
    );
  });

  // Pie
  const host = data.host || "duelo-de-caracteristicas.vercel.app";
  parts.push(
    `<text x="${W / 2}" y="1262" text-anchor="middle" font-family="${FONT}" font-size="26" fill="${C.muted}">${esc(
      t(lang, "Compáralos gratis en", "Compare them free at")
    )}</text>`
  );
  parts.push(
    `<text x="${W / 2}" y="1306" text-anchor="middle" font-family="${FONT}" font-size="34" font-weight="700" fill="${C.text}">${esc(host)}</text>`
  );
  parts.push(`</svg>`);
  return parts.join("\n");
}

// ---- Solo navegador ---------------------------------------------------------

export function svgToPngBlob(svg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, W, H);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob falló"))), "image/png");
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("No se pudo cargar el SVG"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

// Devuelve "shared" (se abrió el menú de compartir), "downloaded" (se bajó el
// archivo) o "cancelled" (el usuario cerró el menú).
export async function shareOrDownload(blob, filename, { title, text, url } = {}) {
  const file = new File([blob], filename, { type: "image/png" });
  if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text, url });
      return "shared";
    } catch (e) {
      if (e && e.name === "AbortError") return "cancelled";
      // cualquier otro error: se cae a la descarga normal
    }
  }
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(href), 4000);
  return "downloaded";
}
