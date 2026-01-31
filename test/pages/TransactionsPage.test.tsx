import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/context/BudgetContext";
import { RulesProvider } from "@/context/RulesContext";
import { PresetTransactionsProvider } from "@/context/PresetTransactionsContext";
import { GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";
import { Layout } from "@/components/Layout";
import { TransactionsPage } from "@/pages/transactions/TransactionsPage";

function TestWrapper() {
  return (
    <BudgetProvider>
      <RulesProvider>
        <PresetTransactionsProvider>
          <GoogleAuthProviderFallback>
            <MemoryRouter initialEntries={["/dashboard/transactions"]}>
              <Routes>
                <Route path="/dashboard" element={<Layout />}>
                  <Route path="transactions" element={<TransactionsPage />} />
                </Route>
              </Routes>
            </MemoryRouter>
          </GoogleAuthProviderFallback>
        </PresetTransactionsProvider>
      </RulesProvider>
    </BudgetProvider>
  );
}

test("TransactionsPage renders without throwing", () => {
  render(<TestWrapper />);
  expect(
    screen.getByRole("heading", { name: "Transactions" }),
  ).toBeInTheDocument();
});
