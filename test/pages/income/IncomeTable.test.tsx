import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { IncomeTable } from "@/pages/income/IncomeTable";

test("IncomeTable shows Date header and empty state when no income", () => {
  render(
    <IncomeTable
      sortedIncome={[]}
      incomeCategories={["Paycheck", "Other"]}
      onEdit={() => {}}
      onDelete={() => {}}
      onUpdateCategory={() => {}}
      onUpdateOwner={() => {}}
    />,
  );
  expect(
    screen.getByRole("columnheader", { name: "Date" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("No income yet. Add your first entry to get started."),
  ).toBeInTheDocument();
});
