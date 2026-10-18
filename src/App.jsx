// ============================================================================
// src/App.jsx
// Enrutador principal.
// ============================================================================
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { LanguageProvider } from "./lib/LanguageContext";
import PageViewTracker from "./components/PageViewTracker";

const HomePage = lazy(() => import("./pages/HomePage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const DevicePage = lazy(() => import("./pages/DevicePage"));
const ComparisonPage = lazy(() => import("./pages/ComparisonPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const SuggestPage = lazy(() => import("./pages/SuggestPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const CookiesPage = lazy(() => import("./pages/CookiesPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const RecommenderPage = lazy(() => import("./pages/RecommenderPage"));
function PageFallback() {
  return <div style={{ minHeight: "100vh", backgroundColor: "#EDEFF3" }} aria-hidden="true" />;
}

export default function App() {
  return (
    <BrowserRouter>
    <LanguageProvider>
      <ScrollToTop />
<PageViewTracker />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recomendador" element={<RecommenderPage />} />
          <Route path="/:slugType" element={<CategoryPage />} />
          <Route path="/:slugType/:slug" element={<DevicePage />} />
          <Route path="/comparar/:pair" element={<ComparisonPage />} />
     <Route path="/sugerir" element={<SuggestPage />} />
          <Route path="/acerca-de" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
<Route path="/blog/:id" element={<ArticlePage />} />
          <Route path="/preguntas-frecuentes" element={<FaqPage />} />
          <Route path="/privacidad" element={<PrivacyPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/politica-cookies" element={<CookiesPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </LanguageProvider>
    </BrowserRouter>
  );
}
