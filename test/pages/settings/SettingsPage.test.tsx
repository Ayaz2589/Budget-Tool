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

test("SettingsPage renders title and nav sections", () => {
  render(<TestWrapper />);
  expect(
    screen.getAllByRole("heading", { name: i18n.t("settings.title") }).length,
  ).toBeGreaterThanOrEqual(1);
  // Nav buttons for each section
  expect(
    screen.getByRole("button", { name: i18n.t("settings.googleSheets") }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: i18n.t("settings.preferencesTitle") }),
  ).toBeInTheDocument();
});

// Expense/income categories sections have been removed — categories are now preset from the registry
