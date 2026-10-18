// ============================================================================
// src/components/ShareButtons.jsx
// Botones para compartir el resultado de una comparación: WhatsApp y
// copiar link. Usa la URL actual de la página (funciona en /comparar/...).
// ============================================================================
import { useState } from "react";
import { Share2, Copy, Check, Download } from "lucide-react";
import { COLORS } from "../data/theme";
import { useLanguage } from "../lib/LanguageContext";
import { buildCardSvg, svgToPngBlob, shareOrDownload } from "../lib/shareCard";

export default function ShareButtons({ devA, devB, cats = [], overallA = 0, overallB = 0 }) {
  const { t, lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [imgStatus, setImgStatus] = useState(null); // null | "busy" | "error"

  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = t("share.message", { a: devA.name, b: devB.name });

  const handleWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback si el navegador no soporta clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Crea la tarjeta del duelo (imagen PNG) y abre el menú de compartir del
  // celular; si el navegador no lo soporta, descarga la imagen.
  const handleImage = async () => {
    if (imgStatus === "busy") return;
    setImgStatus("busy");
    try {
      const rows = cats
        .filter((c) => typeof devA.scores[c.key] === "number" || typeof devB.scores[c.key] === "number")
        .map((c) => {
          const key = `cat.${c.key}`;
          const txt = t(key);
          return { label: txt === key ? c.label : txt, a: devA.scores[c.key], b: devB.scores[c.key] };
        });
      const svg = buildCardSvg({
        nameA: devA.name,
        nameB: devB.name,
        priceA: devA.price,
        priceB: devB.price,
        overallA,
        overallB,
        rows,
        lang,
        host: window.location.host,
      });
      const blob = await svgToPngBlob(svg);
      await shareOrDownload(blob, `duelo-${devA.slug}-vs-${devB.slug}.png`, {
        title: text,
        text: `${text} ${url}`,
      });
      setImgStatus(null);
    } catch {
      setImgStatus("error");
      setTimeout(() => setImgStatus(null), 3000);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
      <span className="text-xs flex items-center gap-1" style={{ color: COLORS.muted, fontFamily: "'Inter', sans-serif" }}>
        <Share2 size={13} /> {t("share.label")}
      </span>
      <button
        type="button"
        onClick={handleWhatsApp}
        className="text-xs px-3 py-1.5 rounded-full font-medium"
        style={{ backgroundColor: "#25D366", color: "#fff", fontFamily: "'Inter', sans-serif" }}
      >
        WhatsApp
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1"
        style={{ backgroundColor: copied ? COLORS.b : "#F0F2F5", color: copied ? "#fff" : COLORS.ink, fontFamily: "'Inter', sans-serif" }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? t("share.copied") : t("share.copyLink")}
      </button>
      <button
        type="button"
        onClick={handleImage}
        disabled={imgStatus === "busy"}
        className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 disabled:opacity-60"
        style={{ backgroundColor: imgStatus === "error" ? COLORS.a : COLORS.ink, color: "#fff", fontFamily: "'Inter', sans-serif" }}
      >
        <Download size={12} />
        {imgStatus === "busy"
          ? "..."
          : imgStatus === "error"
          ? lang === "en"
            ? "Could not create it"
            : "No se pudo crear"
          : lang === "en"
          ? "Image"
          : "Imagen"}
      </button>
    </div>
  );
          }
