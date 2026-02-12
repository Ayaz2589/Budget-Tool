import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import {
  BudgetProvider,
  PresetTransactionsProvider,
  GoogleAuthProvider,
  GoogleAuthProviderFallback,
} from "@/context";
import { Layout } from "@/components";
import { AboutPage } from "@/pages/about";
import { AuthGate, AuthLoginRoute } from "@/pages/auth";
import { Dashboard } from "@/pages/dashboard";
import { DebtPage } from "@/pages/debt";
import { ImportPage } from "@/pages/import";
import { IncomePage } from "@/pages/income";
import { LandingRoute } from "@/pages/landing";
import { MortgagePage } from "@/pages/mortgage";
import { PresetsPage } from "@/pages/presets";
import { SettingsPage } from "@/pages/settings";
import { TourPage } from "@/pages/tour";
import { TransactionsPage } from "@/pages/transactions";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/tour" element={<TourPage />} />
        <Route path="/auth" element={<AuthLoginRoute />} />
        <Route element={<AuthGate />}>
          <Route path="dashboard" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="income" element={<IncomePage />} />
            <Route path="debt" element={<DebtPage />} />
            <Route path="mortgage" element={<MortgagePage />} />
            <Route path="presets" element={<PresetsPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="settings" element={<SettingsPage />} />
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
