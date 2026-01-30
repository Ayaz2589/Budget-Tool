import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BudgetProvider } from "@/context/BudgetContext";
import {
  GoogleAuthProvider,
  GoogleAuthProviderFallback,
} from "@/context/GoogleAuthContext";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/dashboard/Dashboard";
import { DebtPage } from "@/pages/debt/DebtPage";
import { MortgagePage } from "@/pages/mortgage/MortgagePage";
import { ImportPage } from "@/pages/import/ImportPage";
import { TransactionsPage } from "@/pages/transactions/TransactionsPage";
import { IncomePage } from "@/pages/income/IncomePage";
import { SettingsPage } from "@/pages/settings/SettingsPage";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="income" element={<IncomePage />} />
          <Route path="debt" element={<DebtPage />} />
          <Route path="mortgage" element={<MortgagePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <BudgetProvider>
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
    </BudgetProvider>
  );
}

export default App;
