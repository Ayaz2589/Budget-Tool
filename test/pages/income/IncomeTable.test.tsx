import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { IncomeTable } from "@/pages/income/IncomeTable";

test("IncomeTable shows empty state when no income", () => {
  render(
    <IncomeTable
      byMonth={[]}
      defaultOpenMonth=""
      incomeCategories={["Paycheck", "Other"]}
      ownerOptions={[]}
      onEdit={() => {}}
      onDelete={() => {}}
      onUpdateCategory={() => {}}
      onUpdateOwner={() => {}}
    />,
  );
  expect(
    screen.getByText("No income yet. Add your first entry to get started."),
  ).toBeInTheDocument();
});
