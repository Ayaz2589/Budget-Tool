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
        { id: "e1", date: "2026-01-15", amount: 50, description: "Lunch", category: "Dining", source: "manual", owner: "Alice", paidByOwner: "Alice" },
        { id: "e2", date: "2026-01-16", amount: 30, description: "Gas", category: "Transport", source: "manual" },
      ],
      income: [
        { id: "i1", date: "2026-01-01", amount: 5000, description: "Salary", category: "Paycheck", owner: "Alice" },
      ],
      debts: [],
      debtPayments: [],
      ownerTransfers: [],
      ownerBalances: {},
      cardSources: ["manual"],
      expenseCategories: ["Dining", "Transport", "Shopping"],
      incomeCategories: ["Paycheck", "Bonus"],
      owners: ["Alice", "Bob"],
    }),
  );
}

test("Expense categories section shows pencil (rename) buttons for each category", async () => {
  seedData();
  render(<TestWrapper />);
  navigateToSection("settings.expenseCategories");

  await waitFor(() => {
    const renameButtons = screen.getAllByLabelText(/Rename/i);
    expect(renameButtons.length).toBe(3); // Dining, Transport, Shopping
  });
});

test("Clicking pencil icon enters inline edit mode with pre-filled input", async () => {
  seedData();
  render(<TestWrapper />);
  navigateToSection("settings.expenseCategories");

  await waitFor(() => {
    expect(screen.getAllByLabelText(/Rename/i).length).toBeGreaterThan(0);
  });

  // Click rename on "Dining"
  const renameBtn = screen.getByLabelText("Rename Dining");
  fireEvent.click(renameBtn);

  // Should show an input pre-filled with "Dining"
  await waitFor(() => {
    const inputs = screen.getAllByRole("textbox");
    const editInput = inputs.find((input) => (input as HTMLInputElement).value === "Dining");
    expect(editInput).toBeTruthy();
  });
});

test("Pressing Enter on edited category renames it", async () => {
  seedData();
  render(<TestWrapper />);
  navigateToSection("settings.expenseCategories");

  await waitFor(() => {
    expect(screen.getByLabelText("Rename Dining")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByLabelText("Rename Dining"));

  const editInput = await waitFor(() => {
    const inputs = screen.getAllByRole("textbox");
    return inputs.find((input) => (input as HTMLInputElement).value === "Dining")!;
  });

  fireEvent.change(editInput, { target: { value: "Eating Out" } });
  fireEvent.keyDown(editInput, { key: "Enter" });

  // "Dining" should be gone, "Eating Out" should appear
  await waitFor(() => {
    expect(screen.getByText("Eating Out")).toBeInTheDocument();
  });
});

test("Pressing Escape cancels inline edit without changes", async () => {
  seedData();
  render(<TestWrapper />);
  navigateToSection("settings.expenseCategories");

  await waitFor(() => {
    expect(screen.getByLabelText("Rename Dining")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByLabelText("Rename Dining"));

  const editInput = await waitFor(() => {
    const inputs = screen.getAllByRole("textbox");
    return inputs.find((input) => (input as HTMLInputElement).value === "Dining")!;
  });

  fireEvent.change(editInput, { target: { value: "Changed" } });
  fireEvent.keyDown(editInput, { key: "Escape" });

  // Should still show "Dining" unchanged
  await waitFor(() => {
    expect(screen.getByText("Dining")).toBeInTheDocument();
  });
});

test("Owners section shows rename buttons for each owner", async () => {
  seedData();
  render(<TestWrapper />);
  navigateToSection("settings.owners");

  await waitFor(() => {
    expect(screen.getByLabelText("Rename Alice")).toBeInTheDocument();
    expect(screen.getByLabelText("Rename Bob")).toBeInTheDocument();
  });
});

test("Income categories section shows rename buttons", async () => {
  seedData();
  render(<TestWrapper />);
  navigateToSection("settings.incomeCategories");

  await waitFor(() => {
    expect(screen.getByLabelText("Rename Paycheck")).toBeInTheDocument();
    expect(screen.getByLabelText("Rename Bonus")).toBeInTheDocument();
  });
});
