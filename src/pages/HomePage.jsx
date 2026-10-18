// ============================================================================
// src/pages/HomePage.jsx
// Página principal, con textos traducidos según el idioma activo.
// ============================================================================
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { COLORS, FONT_IMPORT } from "../data/theme";
import { DEVICES } from "../data/devices";
import { comparisonSlug, homeMeta, websiteJsonLd, organizationJsonLd } from "../lib/seo";
import { useLanguage } from "../lib/LanguageContext";
import SeoHead from "../components/SeoHead";
import TypeaheadInput from "../components/TypeaheadInput";
import CategoryNav from "../components/CategoryNav";
import CategoryPicker from "../components/CategoryPicker";
import Logo from "../components/Logo";
import UpdateBanner from "../components/UpdateBanner";

export default function HomePage() {
  const [devA, setDevA] = useState(null);
  const [devB, setDevB] = useState(null);
  const [category, setCategory] = useState(null);
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const canCompare = devA && devB && devA.id !== devB.id;
  const meta = homeMeta();

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setDevA(null);
    setDevB(null);
  };

  const goCompare = () => {
    if (!canCompare) return;
    navigate(`/comparar/${comparisonSlug(devA, devB)}`);
  };

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: COLORS.bg }}>
      <SeoHead title={meta.title} description={meta.description} canonical={meta.canonical} jsonLd={[websiteJsonLd(), organizationJsonLd()]} />
      <UpdateBanner />
      <style>{FONT_IMPORT}</style>

      <div className="relative z-20 px-5 sm:px-10 pt-10 pb-8 sm:pb-10" style={{ backgroundColor: COLORS.panelDark }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/banner-hero.png"
              alt="Duelo de Características — Compara, decide y elige mejor"
              className="w-full"
              style={{
                maxWidth: 1200,
                mixBlendMode: "lighten",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 12%)",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 12%)",
              }}
            />
          </div>
          <CategoryNav />
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {t("home.title")}
          </h1>
          <p className="mt-2 mb-6 text-sm sm:text-base" style={{ color: "#9BA1AD", fontFamily: "'Inter', sans-serif" }}>
            {t("home.subtitle")}
          </p>
          <CategoryPicker value={category} onChange={handleCategoryChange} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-10 -mt-6">
        <h2 className="sr-only">{t("home.title")}</h2>
        <div className="rounded-lg shadow-lg p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-start" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.line}` }}>
          <TypeaheadInput label={t("home.deviceA")} accent={COLORS.a} value={devA} onSelect={setDevA} excludeId={devB ? devB.id : null} forcedCategory={category} />
          <div className="hidden sm:flex items-center justify-center font-bold text-sm shrink-0 pt-3" style={{ color: COLORS.muted, fontFamily: "'Space Grotesk', sans-serif" }}>
            VS
          </div>
          <TypeaheadInput label={t("home.deviceB")} accent={COLORS.b} value={devB} onSelect={setDevB} excludeId={devA ? devA.id : null} forcedCategory={category} />

          <button
            type="button"
            onClick={goCompare}
            disabled={!canCompare}
            className="sm:col-span-3 mt-1 w-full py-3 rounded-md font-semibold text-sm uppercase tracking-wide disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: COLORS.ink, color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {t("home.compare")}
          </button>
          {devA && devB && devA.id === devB.id && (
            <p className="sm:col-span-3 text-xs text-center" style={{ color: COLORS.a, fontFamily: "'Inter', sans-serif" }}>
              {t("home.pickTwo")}
            </p>
          )}
        </div>
        <p className="text-center text-xs mt-3" style={{ color: COLORS.muted, fontFamily: "'Inter', sans-serif" }}>
          {t("home.database", { count: DEVICES.length })}
        </p>
        <div className="text-center mt-4">
          <Link
            to="/recomendador"
            className="inline-block px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: COLORS.a, color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {lang === "en" ? "Not sure what to compare? Get a recommendation" : "¿No sabes qué comparar? Te recomendamos uno"}
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-10 py-10">
        <p className="text-center text-sm mt-8" style={{ color: COLORS.muted, fontFamily: "'Inter', sans-serif" }}>
          <Link to="/celulares" className="underline">{t("nav.phones")}</Link> ·{" "}
          <Link to="/computadoras" className="underline">{t("nav.computers")}</Link> ·{" "}
          <Link to="/tablets" className="underline">{t("nav.tablets")}</Link> ·{" "}
          <Link to="/relojes" className="underline">{t("nav.watches")}</Link>
        </p>
        <p className="text-center text-xs mt-6 flex items-center justify-center gap-3">
          <Link to="/privacidad" className="underline" style={{ color: COLORS.muted, fontFamily: "'Inter', sans-serif" }}>
            {t("footer.privacy")}
          </Link>
          <Link to="/contacto" className="underline" style={{ color: COLORS.muted, fontFamily: "'Inter', sans-serif" }}>
            {t("footer.contact")}
          </Link>
        </p>
      </div>
    </div>
  );
            }
