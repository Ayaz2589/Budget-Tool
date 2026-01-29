import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { BudgetProvider } from "@/context/BudgetContext";
import { RulesProvider } from "@/context/RulesContext";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";

function TestWrapper() {
  return (
    <BudgetProvider>
      <RulesProvider>
        <AddTransactionDialog open={true} onOpenChange={() => {}} />
      </RulesProvider>
    </BudgetProvider>
  );
}

test("AddTransactionDialog renders when open", () => {
  render(<TestWrapper />);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});
