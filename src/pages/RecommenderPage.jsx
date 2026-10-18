// ============================================================================
// src/pages/RecommenderPage.jsx
// Asistente "¿Cuál me conviene?": el usuario elige categoría, presupuesto y
// qué le importa más, y la página le recomienda los 3 mejores dispositivos del
// catálogo. Toda la lógica de cálculo vive en src/lib/recommender.js.
// Los textos están en este archivo (es/en) para no tocar i18n.js.
// ============================================================================
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { COLORS, FONT_IMPORT } from "../data/theme";
import { CATEGORY_CONFIG } from "../data/devices";
import { comparisonSlug } from "../lib/seo";
import { useLanguage } from "../lib/LanguageContext";
import { REC_CATEGORIES, BUDGET_STEPS, priorityOptions, recommend } from "../lib/recommender";
import SeoHead from "../components/SeoHead";
import CategoryNav from "../components/CategoryNav";
import Logo from "../components/Logo";

const TXT = {
  es: {
    seoTitle: "¿Cuál me conviene? Recomendador de celulares, laptops y más",
    seoDescription:
      "Responde tres preguntas (categoría, presupuesto y qué te importa más) y te recomendamos los 3 mejores dispositivos del catálogo según tus prioridades.",
    home: "Inicio",
    title: "¿Cuál me conviene?",
    subtitle: "Responde tres preguntas y te recomendamos los 3 mejores dispositivos según lo que te importa.",
    step1: "1. ¿Qué estás buscando?",
    step2: "2. ¿Cuál es tu presupuesto?",
    step3: "3. ¿Qué te importa más? (elige hasta 2)",
    upTo: "Hasta",
    noLimit: "Sin límite",
    pickCategory: "Elige una categoría para ver recomendaciones.",
    resultsTitle: "Tus mejores opciones",
    none: "No encontramos dispositivos con ese presupuesto. Prueba con uno mayor.",
    match: "Puntuación para ti",
    stands: "Destaca en",
    viewSpecs: "Ver ficha",
    compareTop: "Comparar la 1 con la 2",
    note: "Las puntuaciones son estimaciones comparativas basadas en las especificaciones publicadas, no pruebas de laboratorio. Los precios son de referencia en USD y pueden variar en tu país.",
  },
  en: {
    seoTitle: "Which one fits me? Phone, laptop and gadget recommender",
    seoDescription:
      "Answer three questions (category, budget and what matters most to you) and we recommend the 3 best devices in the catalog for your priorities.",
    home: "Home",
    title: "Which one fits me?",
    subtitle: "Answer three questions and we will recommend the 3 best devices for what matters to you.",
    step1: "1. What are you looking for?",
    step2: "2. What is your budget?",
    step3: "3. What matters most to you? (pick up to 2)",
    upTo: "Up to",
    noLimit: "No limit",
    pickCategory: "Pick a category to see recommendations.",
    resultsTitle: "Your best options",
    none: "We could not find devices within that budget. Try a higher one.",
    match: "Score for you",
    stands: "Stands out in",
    viewSpecs: "View specs",
    compareTop: "Compare #1 with #2",
    note: "Scores are comparative estimates based on published specifications, not lab tests. Prices are USD reference prices and may vary in your country.",
  },
};

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="px-3 py-2 rounded-full text-sm font-medium transition-colors"
      style={{
        backgroundColor: active ? COLORS.ink : "#fff",
        color: active ? "#fff" : COLORS.ink,
        border: `1px solid ${active ? COLORS.ink : COLORS.line}`,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {children}
    </button>
  );
}

export default function RecommenderPage() {
  const { t, lang } = useLanguage();
  const tx = TXT[lang] || TXT.es;

  const [slug, setSlug] = useState(null);
  const [budget, setBudget] = useState(null); // null = sin límite
  const [priorities, setPriorities] = useState([]);

  const options = useMemo(() => (slug ? priorityOptions(slug) : []), [slug]);
  const results = useMemo(
    () => (slug ? recommend({ slug, maxPrice: budget, priorities, limit: 3 }) : []),
    [slug, budget, priorities]
  );

  const catLabel = (c) => {
    const key = `cat.${c.key}`;
    const txt = t(key);
    return txt === key ? c.label : txt;
  };

  const chooseCategory = (s) => {
    setSlug(s);
    setBudget(null);
    setPriorities([]);
  };

  const togglePriority = (key) => {
    setPriorities((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 2) return [prev[1], key];
      return [...prev, key];
    });
  };

  const budgetSteps = slug ? BUDGET_STEPS[slug] : [];
  const sectionTitle = "text-base font-semibold mb-3";

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: COLORS.bg }}>
      <SeoHead
        title={tx.seoTitle}
        description={tx.seoDescription}
        canonical={typeof window !== "undefined" ? window.location.origin + "/recomendador" : "/recomendador"}
      />
      <style>{FONT_IMPORT}</style>

      <div className="relative z-20 px-5 sm:px-10 pt-10 pb-8 sm:pb-10" style={{ backgroundColor: COLORS.panelDark }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-3">
            <Logo size={28} />
          </div>
          <CategoryNav />
          <nav className="text-[11px] mb-3" style={{ color: "#9BA1AD" }} aria-label="Ruta de navegación">
            <Link to="/" className="underline">{tx.home}</Link> · {tx.title}
          </nav>
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {tx.title}
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "#9BA1AD", fontFamily: "'Inter', sans-serif" }}>
            {tx.subtitle}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 sm:px-10 py-8">
        <div className="rounded-lg shadow-lg p-5 sm:p-7 flex flex-col gap-6" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.line}` }}>
          <section>
            <h2 className={sectionTitle} style={{ color: COLORS.ink, fontFamily: "'Space Grotesk', sans-serif" }}>{tx.step1}</h2>
            <div className="flex flex-wrap gap-2">
              {REC_CATEGORIES.map((s) => (
                <Chip key={s} active={slug === s} onClick={() => chooseCategory(s)}>
                  {t(CATEGORY_CONFIG[s].labelKey)}
                </Chip>
              ))}
            </div>
          </section>

          {slug && (
            <section>
              <h2 className={sectionTitle} style={{ color: COLORS.ink, fontFamily: "'Space Grotesk', sans-serif" }}>{tx.step2}</h2>
              <div className="flex flex-wrap gap-2">
                {budgetSteps.map((n) => (
                  <Chip key={n} active={budget === n} onClick={() => setBudget(n)}>
                    {tx.upTo} ${n}
                  </Chip>
                ))}
                <Chip active={budget === null} onClick={() => setBudget(null)}>
                  {tx.noLimit}
                </Chip>
              </div>
            </section>
          )}

          {slug && (
            <section>
              <h2 className={sectionTitle} style={{ color: COLORS.ink, fontFamily: "'Space Grotesk', sans-serif" }}>{tx.step3}</h2>
              <div className="flex flex-wrap gap-2">
                {options.map((c) => (
                  <Chip key={c.key} active={priorities.includes(c.key)} onClick={() => togglePriority(c.key)}>
                    {catLabel(c)}
                  </Chip>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="mt-6">
          {!slug && (
            <p className="text-center text-sm" style={{ color: COLORS.muted, fontFamily: "'Inter', sans-serif" }}>
              {tx.pickCategory}
            </p>
          )}

          {slug && results.length === 0 && (
            <p className="text-center text-sm" style={{ color: COLORS.a, fontFamily: "'Inter', sans-serif" }}>
              {tx.none}
            </p>
          )}

          {slug && results.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold" style={{ color: COLORS.ink, fontFamily: "'Space Grotesk', sans-serif" }}>
                {tx.resultsTitle}
              </h2>
              {results.map((r, i) => (
                <div
                  key={r.device.id}
                  className="rounded-lg shadow p-4 flex flex-col gap-2"
                  style={{ backgroundColor: "#fff", border: `1px solid ${i === 0 ? COLORS.b : COLORS.line}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: i === 0 ? COLORS.b : COLORS.muted, fontFamily: "'IBM Plex Mono', monospace" }}>
                        #{i + 1}
                      </p>
                      <h3 className="text-base font-bold leading-tight" style={{ color: COLORS.ink, fontFamily: "'Space Grotesk', sans-serif" }}>
                        {r.device.name}
                      </h3>
                      <p className="text-sm" style={{ color: COLORS.muted, fontFamily: "'Inter', sans-serif" }}>
                        {r.device.price} · {r.device.year}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold" style={{ color: COLORS.ink, fontFamily: "'Space Grotesk', sans-serif" }}>
                        {r.score}
                      </p>
                      <p className="text-[11px]" style={{ color: COLORS.muted, fontFamily: "'Inter', sans-serif" }}>
                        {tx.match}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: COLORS.muted, fontFamily: "'Inter', sans-serif" }}>
                    {tx.stands}: {r.strengths.map((s) => `${catLabel(s)} (${s.value})`).join(" · ")}
                  </p>
                  <div>
                    <Link
                      to={`/${r.device.slugType}/${r.device.slug}`}
                      className="text-sm font-semibold underline"
                      style={{ color: COLORS.ink, fontFamily: "'Inter', sans-serif" }}
                    >
                      {tx.viewSpecs}
                    </Link>
                  </div>
                </div>
              ))}
              {results.length > 1 && (
                <Link
                  to={`/comparar/${comparisonSlug(results[0].device, results[1].device)}`}
                  className="w-full py-3 rounded-md font-semibold text-sm uppercase tracking-wide text-center"
                  style={{ backgroundColor: COLORS.ink, color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {tx.compareTop}
                </Link>
              )}
              <p className="text-xs text-center" style={{ color: COLORS.muted, fontFamily: "'Inter', sans-serif" }}>
                {tx.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
