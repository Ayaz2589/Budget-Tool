import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { BudgetProvider } from "@/context/BudgetContext";
import { PresetTransactionsProvider } from "@/context/PresetTransactionsContext";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";

function TestWrapper() {
  return (
    <BudgetProvider>
      <PresetTransactionsProvider>
        <AddTransactionDialog open={true} onOpenChange={() => {}} />
      </PresetTransactionsProvider>
    </BudgetProvider>
  );
}

test("AddTransactionDialog renders when open", () => {
  render(<TestWrapper />);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});
