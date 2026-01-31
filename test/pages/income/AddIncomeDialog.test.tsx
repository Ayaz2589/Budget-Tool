import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { AddIncomeDialog } from "@/pages/income/AddIncomeDialog";

test("AddIncomeDialog does not show dialog content when closed", () => {
  render(
    <AddIncomeDialog
      open={false}
      onOpenChange={() => {}}
      incomeCategories={["Paycheck", "Other"]}
      onSubmit={() => {}}
    />,
  );
  expect(screen.queryByText("New income")).not.toBeInTheDocument();
});

test("AddIncomeDialog shows New income title when open", () => {
  render(
    <AddIncomeDialog
      open={true}
      onOpenChange={() => {}}
      incomeCategories={["Paycheck", "Other"]}
      onSubmit={() => {}}
    />,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("New income")).toBeInTheDocument();
});
