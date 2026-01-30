import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { RulesPage } from "@/pages/rules/RulesPage";
import { BudgetProvider } from "@/context/BudgetContext";
import { RulesProvider } from "@/context/RulesContext";

test("RulesPage shows title and empty state", () => {
  localStorage.clear();
  render(
    <BudgetProvider>
      <RulesProvider>
        <RulesPage />
      </RulesProvider>
    </BudgetProvider>,
  );
  expect(screen.getByRole("heading", { name: /rules/i })).toBeInTheDocument();
  expect(screen.getByText(/no rules yet/i)).toBeInTheDocument();
});
