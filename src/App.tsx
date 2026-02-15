import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import {
  BudgetProvider,
  PresetTransactionsProvider,
  GoogleAuthProvider,
  GoogleAuthProviderFallback,
} from "@/context";
import { Layout } from "@/components";
import { AuthGate, AuthLoginRoute } from "@/pages/auth";
import { LandingRoute } from "@/pages/landing";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/* ---- Route-level lazy imports ---- */
const Dashboard = lazy(() =>
  import("@/pages/dashboard/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const ImportPage = lazy(() =>
  import("@/pages/import/ImportPage").then((m) => ({ default: m.ImportPage })),
);
const TransactionsPage = lazy(() =>
  import("@/pages/transactions/TransactionsPage").then((m) => ({
    default: m.TransactionsPage,
  })),
);
const IncomePage = lazy(() =>
  import("@/pages/income/IncomePage").then((m) => ({
    default: m.IncomePage,
  })),
);
const DebtPage = lazy(() =>
  import("@/pages/debt/DebtPage").then((m) => ({ default: m.DebtPage })),
);
const MortgagePage = lazy(() =>
  import("@/pages/mortgage/MortgagePage").then((m) => ({
    default: m.MortgagePage,
  })),
);
const PresetsPage = lazy(() =>
  import("@/pages/presets/PresetsPage").then((m) => ({
    default: m.PresetsPage,
  })),
);
const AboutPage = lazy(() =>
  import("@/pages/about/AboutPage").then((m) => ({ default: m.AboutPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/settings/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);
const TourPage = lazy(() =>
  import("@/pages/tour/TourPage").then((m) => ({ default: m.TourPage })),
);

/* ---- Shared loading fallback ---- */
function PageLoader() {
  return (
    <div className="flex h-[50dvh] items-center justify-center">
      <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
    </div>
  );
}

function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route
          path="/tour"
          element={
            <LazyRoute>
              <TourPage />
            </LazyRoute>
          }
        />
        <Route path="/auth" element={<AuthLoginRoute />} />
        <Route element={<AuthGate />}>
          <Route path="dashboard" element={<Layout />}>
            <Route
              index
              element={
                <LazyRoute>
                  <Dashboard />
                </LazyRoute>
              }
            />
            <Route
              path="import"
              element={
                <LazyRoute>
                  <ImportPage />
                </LazyRoute>
              }
            />
            <Route
              path="transactions"
              element={
                <LazyRoute>
                  <TransactionsPage />
                </LazyRoute>
              }
            />
            <Route
              path="income"
              element={
                <LazyRoute>
                  <IncomePage />
                </LazyRoute>
              }
            />
            <Route
              path="debt"
              element={
                <LazyRoute>
                  <DebtPage />
                </LazyRoute>
              }
            />
            <Route
              path="mortgage"
              element={
                <LazyRoute>
                  <MortgagePage />
                </LazyRoute>
              }
            />
            <Route
              path="presets"
              element={
                <LazyRoute>
                  <PresetsPage />
                </LazyRoute>
              }
            />
            <Route
              path="about"
              element={
                <LazyRoute>
                  <AboutPage />
                </LazyRoute>
              }
            />
            <Route
              path="settings"
              element={
                <LazyRoute>
                  <SettingsPage />
                </LazyRoute>
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <BudgetProvider>
      <PresetTransactionsProvider>
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            <GoogleAuthProvider>
              <AppContent />
            </GoogleAuthProvider>
          </GoogleOAuthProvider>
        ) : (
          <GoogleAuthProviderFallback>
            <AppContent />
          </GoogleAuthProviderFallback>
        )}
      </PresetTransactionsProvider>
    </BudgetProvider>
  );
}

export default App;
