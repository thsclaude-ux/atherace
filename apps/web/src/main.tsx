import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider, AuthProvider } from "@/context/AppContext";
import { PageLoader } from "@/components/PageLoader";
import { LandingPage } from "@/pages/LandingPage";
import "@/styles/global.css";

const PredictPage = lazy(() => import("@/pages/PredictPage").then((m) => ({ default: m.PredictPage })));
const LeaderboardPage = lazy(() => import("@/pages/LeaderboardPage").then((m) => ({ default: m.LeaderboardPage })));
const AdminPage = lazy(() => import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/predict" element={<PredictPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  </StrictMode>
);
