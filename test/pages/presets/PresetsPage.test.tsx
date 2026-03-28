import { afterEach, beforeEach, test, expect } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/context";
import { PresetTransactionsProvider } from "@/context";
import { GoogleAuthProviderFallback } from "@/context";
import { Layout } from "@/components/Layout";
import { PresetsPage } from "@/pages/presets/PresetsPage";
import i18n from "@/i18n";

const BUDGET_STORAGE_KEY = "budget-tool-data";
const PRESET_STORAGE_KEY = "budget-tool-preset-transactions";

function seedBudget() {
  localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      expenses: [],
      income: [],
      debts: [],
      debtPayments: [],
      ownerBalances: {},
      cardSources: ["amex", "manual", "td"],
      expenseCategories: ["Food", "Bills", "Transport"],
      incomeCategories: ["Paycheck"],
      owners: ["Alice", "Bob"],
    }),
  );
}

function seedPresets() {
  localStorage.setItem(
    PRESET_STORAGE_KEY,
    JSON.stringify([
      {
        id: "p1",
        source: "amex",
        description: "Weekly groceries",
        amount: 150,
        category: "Food",
        owner: "Alice",
      },
      {
        id: "p2",
        source: "manual",
        description: "Electricity bill",
        amount: 80,
        category: "Bills",
        owner: "Bob",
      },
      {
        id: "p3",
        source: "td",
        description: "Bus pass",
        category: "Transport",
        owner: "",
      },
    ]),
  );
}

function TestWrapper({
  initialEntry = "/dashboard/presets",
}: {
  initialEntry?: string;
}) {
  return (
    <BudgetProvider>
      <PresetTransactionsProvider>
        <GoogleAuthProviderFallback>
          <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
              <Route path="/dashboard" element={<Layout />}>
                <Route path="presets" element={<PresetsPage />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </GoogleAuthProviderFallback>
      </PresetTransactionsProvider>
    </BudgetProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  seedBudget();
});

afterEach(() => cleanup());

// ---------------------------------------------------------------------------
// Basic rendering
// ---------------------------------------------------------------------------

test("PresetsPage renders without crashing", () => {
  render(<TestWrapper />);
  expect(
    screen.getAllByText(i18n.t("nav.presets")).length,
  ).toBeGreaterThan(0);
});

test("PresetsPage shows empty state when no presets exist", () => {
  render(<TestWrapper />);
  expect(
    screen.getByText(i18n.t("presetTransactions.empty")),
  ).toBeInTheDocument();
});

// Categories are now preset from the registry and can never be empty,
// so the "no categories" empty state is no longer reachable.

// ---------------------------------------------------------------------------
// Rendering with seeded presets
// ---------------------------------------------------------------------------

test("PresetsPage renders preset descriptions when presets exist", () => {
  seedPresets();
  render(<TestWrapper />);
  expect(screen.getAllByText("Weekly groceries").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Electricity bill").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Bus pass").length).toBeGreaterThan(0);
});

test("PresetsPage shows table headers on desktop view", () => {
  seedPresets();
  render(<TestWrapper />);
  expect(screen.getAllByText(i18n.t("common.description")).length).toBeGreaterThan(0);
  expect(screen.getAllByText(i18n.t("common.source")).length).toBeGreaterThan(0);
  expect(screen.getAllByText(i18n.t("common.amount")).length).toBeGreaterThan(0);
  expect(screen.getAllByText(i18n.t("common.owner")).length).toBeGreaterThan(0);
  expect(screen.getAllByText(i18n.t("common.category")).length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Add preset flow
// ---------------------------------------------------------------------------

test("PresetsPage opens add preset sheet when clicking the add button", () => {
  render(<TestWrapper />);
  const addButtons = screen.getAllByRole("button", {
    name: new RegExp(i18n.t("presetTransactions.addPreset"), "i"),
  });
  fireEvent.click(addButtons[0]!);
  expect(
    screen.getAllByText(i18n.t("presetTransactions.newPreset")).length,
  ).toBeGreaterThan(0);
});

test("PresetsPage add sheet has all required fields", () => {
  render(<TestWrapper />);
  const addButtons = screen.getAllByRole("button", {
    name: new RegExp(i18n.t("presetTransactions.addPreset"), "i"),
  });
  fireEvent.click(addButtons[0]!);

  expect(
    screen.getAllByText(i18n.t("presetTransactions.source")).length,
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByText(i18n.t("presetTransactions.descriptionLabel")).length,
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByText(i18n.t("common.amount")).length,
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByText(i18n.t("presetTransactions.category")).length,
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByText(i18n.t("common.owner")).length,
  ).toBeGreaterThan(0);
});

test("PresetsPage can save a new preset", () => {
  render(<TestWrapper />);
  const addButtons = screen.getAllByRole("button", {
    name: new RegExp(i18n.t("presetTransactions.addPreset"), "i"),
  });
  fireEvent.click(addButtons[0]!);

  const descInput = screen.getByPlaceholderText(
    i18n.t("addTransaction.placeholderDescription"),
  );
  fireEvent.change(descInput, { target: { value: "Test preset" } });

  const saveButton = screen.getByRole("button", {
    name: i18n.t("common.save"),
  });
  fireEvent.click(saveButton);

  // After save, the preset should appear in the list
  expect(screen.getAllByText("Test preset").length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Preset row actions
// ---------------------------------------------------------------------------

test("PresetsPage opens actions sheet on row click", () => {
  seedPresets();
  render(<TestWrapper />);
  // Click on a row (which has role="button") in the desktop table
  const rowButtons = screen.getAllByRole("button", {
    name: /Weekly groceries/i,
  });
  fireEvent.click(rowButtons[0]!);
  // Actions sheet should show Edit and Delete buttons
  expect(screen.getByRole("button", { name: i18n.t("common.edit") })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: i18n.t("common.delete") })).toBeInTheDocument();
});

test("PresetsPage opens delete confirmation dialog", () => {
  seedPresets();
  render(<TestWrapper />);
  // Open actions for a preset
  const rowButtons = screen.getAllByRole("button", {
    name: /Weekly groceries/i,
  });
  fireEvent.click(rowButtons[0]!);
  // Click delete
  fireEvent.click(
    screen.getByRole("button", { name: i18n.t("common.delete") }),
  );
  // Confirmation dialog should appear
  expect(
    screen.getByText(i18n.t("presetTransactions.deletePresetTitle")),
  ).toBeInTheDocument();
  expect(
    screen.getByText(i18n.t("presetTransactions.deletePresetDesc")),
  ).toBeInTheDocument();
});

test("PresetsPage can cancel delete", () => {
  seedPresets();
  render(<TestWrapper />);
  const rowButtons = screen.getAllByRole("button", {
    name: /Weekly groceries/i,
  });
  fireEvent.click(rowButtons[0]!);
  fireEvent.click(
    screen.getByRole("button", { name: i18n.t("common.delete") }),
  );
  // Cancel the delete
  const cancelButtons = screen.getAllByRole("button", {
    name: i18n.t("common.cancel"),
  });
  fireEvent.click(cancelButtons[cancelButtons.length - 1]!);
  // The preset should still be visible
  expect(screen.getAllByText("Weekly groceries").length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// URL-based tour sheet
// ---------------------------------------------------------------------------

test("PresetsPage opens add sheet via tourSheet query param", () => {
  render(
    <TestWrapper initialEntry="/dashboard/presets?tourSheet=presets-add" />,
  );
  expect(
    screen.getAllByText(i18n.t("presetTransactions.newPreset")).length,
  ).toBeGreaterThan(0);
});
