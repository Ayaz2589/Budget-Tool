import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/context";
import { PresetTransactionsProvider } from "@/context";
import { GoogleAuthProviderFallback } from "@/context";
import { Layout } from "@/components/Layout";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import i18n from "@/i18n";

function TestWrapper() {
  return (
    <BudgetProvider>
      <PresetTransactionsProvider>
        <GoogleAuthProviderFallback>
          <MemoryRouter initialEntries={["/dashboard/settings"]}>
            <Routes>
              <Route path="/dashboard" element={<Layout />}>
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </GoogleAuthProviderFallback>
      </PresetTransactionsProvider>
    </BudgetProvider>
  );
}

test("SettingsPage renders title and Delete all data button", () => {
  render(<TestWrapper />);
  expect(
    screen.getAllByRole("heading", { name: i18n.t("settings.title") }).length,
  ).toBeGreaterThanOrEqual(1);
  expect(
    screen.getByRole("button", { name: i18n.t("settings.replayTour") }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: i18n.t("settings.deleteAllData") }),
  ).toBeInTheDocument();
});

test("SettingsPage shows expense and income category cards", () => {
  render(<TestWrapper />);
  expect(screen.getAllByText(i18n.t("settings.expenseCategories")).length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText(i18n.t("settings.incomeCategories")).length).toBeGreaterThanOrEqual(1);
});
