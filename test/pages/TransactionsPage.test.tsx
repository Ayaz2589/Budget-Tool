import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/context/BudgetContext";
import { RulesProvider } from "@/context/RulesContext";
import { GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";
import { Layout } from "@/components/Layout";
import { TransactionsPage } from "@/pages/TransactionsPage";

function TestWrapper() {
  return (
    <BudgetProvider>
      <RulesProvider>
        <GoogleAuthProviderFallback>
          <MemoryRouter initialEntries={["/transactions"]}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route path="transactions" element={<TransactionsPage />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </GoogleAuthProviderFallback>
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
