import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/context/BudgetContext";
import { PresetTransactionsProvider } from "@/context/PresetTransactionsContext";
import { GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";
import { Layout } from "@/components/Layout";
import { TransactionsPage } from "@/pages/transactions/TransactionsPage";

function TestWrapper() {
  return (
    <BudgetProvider>
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
    </BudgetProvider>
  );
}

test("TransactionsPage renders without throwing", () => {
  render(<TestWrapper />);
  expect(
    screen.getAllByRole("heading", { name: "Transactions" }).length,
  ).toBeGreaterThan(0);
});
