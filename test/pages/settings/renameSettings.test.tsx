import { test, expect, beforeEach, afterEach } from "bun:test";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/context";
import { PresetTransactionsProvider } from "@/context";
import { GoogleAuthProviderFallback } from "@/context";
import { Layout } from "@/components/Layout";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import i18n from "@/i18n";
import { storage, STORAGE_KEYS } from "@/lib/platform/storage";

beforeEach(() => {
  cleanup();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

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

function navigateToSection(sectionKey: string) {
  const settingsContainer = document.querySelector("[data-tour='settings-page']")!;
  const btn = Array.from(settingsContainer.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === i18n.t(sectionKey),
  )!;
  fireEvent.click(btn);
}

function seedData() {
  storage.setItem(
    STORAGE_KEYS.BUDGET_DATA,
    JSON.stringify({
      expenses: [
        { id: "e1", date: "2026-01-15", amount: 50, description: "Lunch", category: "Food > Dining Out", source: "manual", owner: "Alice", paidByOwner: "Alice" },
        { id: "e2", date: "2026-01-16", amount: 30, description: "Gas", category: "Transport > Gas/Fuel", source: "manual" },
      ],
      income: [
        { id: "i1", date: "2026-01-01", amount: 5000, description: "Salary", category: "Income > Salary", owner: "Alice" },
      ],
      debts: [],
      debtPayments: [],
      ownerTransfers: [],
      ownerBalances: {},
      cardSources: ["manual"],
      owners: ["Alice", "Bob"],
    }),
  );
}

test("Owners section shows rename buttons for each owner", async () => {
  seedData();
  render(<TestWrapper />);
  navigateToSection("settings.owners");

  await waitFor(() => {
    expect(screen.getByLabelText("Rename Alice")).toBeInTheDocument();
    expect(screen.getByLabelText("Rename Bob")).toBeInTheDocument();
  });
});
