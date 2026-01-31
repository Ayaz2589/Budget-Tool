import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/context/BudgetContext";
import { RulesProvider } from "@/context/RulesContext";
import { PresetTransactionsProvider } from "@/context/PresetTransactionsContext";
import { GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";
import { Layout } from "@/components/Layout";
import { SettingsPage } from "@/pages/settings/SettingsPage";

function TestWrapper() {
  return (
    <BudgetProvider>
      <RulesProvider>
        <PresetTransactionsProvider>
          <GoogleAuthProviderFallback>
          <MemoryRouter initialEntries={["/settings"]}>
            <Routes>
              <Route path="/settings" element={<Layout />}>
                <Route index element={<SettingsPage />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </GoogleAuthProviderFallback>
        </PresetTransactionsProvider>
      </RulesProvider>
    </BudgetProvider>
  );
}

test("SettingsPage renders title and Delete all data button", () => {
  render(<TestWrapper />);
  expect(
    screen.getByRole("heading", { name: "Settings" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Delete all data" }),
  ).toBeInTheDocument();
});

test("SettingsPage shows expense and income category cards", () => {
  render(<TestWrapper />);
  expect(screen.getAllByText("Expense categories").length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText("Income categories").length).toBeGreaterThanOrEqual(1);
});
