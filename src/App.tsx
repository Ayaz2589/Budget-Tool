import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BudgetProvider } from "@/context/BudgetContext";
import { PresetTransactionsProvider } from "@/context/PresetTransactionsContext";
import {
  GoogleAuthProvider,
  GoogleAuthProviderFallback,
} from "@/context/GoogleAuthContext";
import { Layout } from "@/components/Layout";
import { AuthGate, AuthLoginRoute } from "@/pages/auth/AuthGate";
import { LandingRoute } from "@/pages/landing";
import { Dashboard } from "@/pages/dashboard/Dashboard";
import { DebtPage } from "@/pages/debt/DebtPage";
import { MortgagePage } from "@/pages/mortgage/MortgagePage";
import { ImportPage } from "@/pages/import/ImportPage";
import { TransactionsPage } from "@/pages/transactions/TransactionsPage";
import { IncomePage } from "@/pages/income/IncomePage";
import { PresetsPage } from "@/pages/presets/PresetsPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { InvestmentsPage } from "@/pages/investments/InvestmentsPage";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/auth" element={<AuthLoginRoute />} />
        <Route element={<AuthGate />}>
          <Route path="dashboard" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="investments" element={<InvestmentsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="income" element={<IncomePage />} />
            <Route path="debt" element={<DebtPage />} />
            <Route path="mortgage" element={<MortgagePage />} />
            <Route path="presets" element={<PresetsPage />} />
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
