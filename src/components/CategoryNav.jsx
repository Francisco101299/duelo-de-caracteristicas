// ============================================================================
// src/components/CategoryNav.jsx
// Menú compacto: "Categorías" y "Más" — con textos traducidos según el
// idioma activo, más el selector de idioma (ES/EN).
// ============================================================================
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { CATEGORY_CONFIG, TOOL_TYPES } from "../data/devices";
import LanguageSwitcher from "./LanguageSwitcher";

// Slugs de herramientas derivados de CATEGORY_CONFIG (misma fuente que usan
// CategoryPage y el sitemap) en vez de una lista aparte a mano -- antes este
// menú solo tenía celulares/computadoras/tablets/relojes, así que aunque
// /taladros funcionara no había forma de llegar ahí navegando.
const TOOL_SLUGS_LIST = Object.entries(CATEGORY_CONFIG)
  .filter(([, cfg]) => TOOL_TYPES.includes(cfg.types[0]))
  .map(([slug, cfg]) => ({ slug, labelKey: cfg.labelKey }));

function Dropdown({ label, items }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("touchstart", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("touchstart", onClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full"
        style={{ color: "#B9BEC9", border: "1px solid #2A2F3A" }}
      >
        {label} <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 left-1/2 -translate-x-1/2 min-w-[180px] rounded-md shadow-lg overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #D6DAE2" }}>
          {items.map((c) => (
            <Link
              key={c.path}
              to={c.path}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm hover:bg-[#F3F4F7] transition-colors whitespace-nowrap"
              style={{ color: "#14181F" }}
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryNav() {
  const { t, lang } = useLanguage();

  const categories = [
    { label: t("nav.phones"), path: "/celulares" },
    { label: t("nav.computers"), path: "/computadoras" },
    { label: t("nav.tablets"), path: "/tablets" },
    { label: t("nav.watches"), path: "/relojes" },
    { label: t("category.sub.drones"), path: "/drones" },
  ];

  const toolLinks = TOOL_SLUGS_LIST.map((s) => ({ label: t(s.labelKey), path: `/${s.slug}` }));

  const moreLinks = [
    { label: lang === "en" ? "Which one fits me?" : "¿Cuál me conviene?", path: "/recomendador" },
    { label: t("nav.suggest"), path: "/sugerir" },
    { label: t("nav.blog"), path: "/blog" },
    { label: t("nav.faq"), path: "/preguntas-frecuentes" },
    { label: t("nav.about"), path: "/acerca-de" },
  ];

  return (
    <nav className="flex items-center justify-center gap-3 text-sm mb-4 flex-wrap" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Dropdown label={t("nav.categories")} items={categories} />
      <Dropdown label={t("category.group.tools")} items={toolLinks} />
      <Dropdown label={t("nav.more")} items={moreLinks} />
      <LanguageSwitcher />
    </nav>
  );
            }
