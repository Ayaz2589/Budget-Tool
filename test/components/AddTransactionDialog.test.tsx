import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { BudgetProvider } from "@/context/BudgetContext";
import { RulesProvider } from "@/context/RulesContext";
import { PresetTransactionsProvider } from "@/context/PresetTransactionsContext";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";

function TestWrapper() {
  return (
    <BudgetProvider>
      <RulesProvider>
        <PresetTransactionsProvider>
          <AddTransactionDialog open={true} onOpenChange={() => {}} />
        </PresetTransactionsProvider>
      </RulesProvider>
    </BudgetProvider>
  );
}

test("AddTransactionDialog renders when open", () => {
  render(<TestWrapper />);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});
