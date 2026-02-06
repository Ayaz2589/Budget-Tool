import { test, expect } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
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

test("TransactionsPage opens add transaction sheet", () => {
  render(<TestWrapper />);
  const addButtons = screen.getAllByRole("button", { name: /add expense/i });
  fireEvent.click(addButtons[0]!);
  expect(screen.getAllByText("New transaction").length).toBeGreaterThan(0);
});

test("TransactionsPage opens filters and actions sheet", () => {
  render(<TestWrapper />);
  const filterButtons = screen.getAllByRole("button", {
    name: /filters and actions|filters & actions/i,
  });
  fireEvent.click(filterButtons[0]!);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getAllByText(/filters/i).length).toBeGreaterThan(0);
});
