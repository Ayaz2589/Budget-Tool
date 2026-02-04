import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { AddMortgagePaymentDialog } from "@/pages/mortgage/AddMortgagePaymentDialog";

test("AddMortgagePaymentDialog shows title when open", () => {
  render(
    <AddMortgagePaymentDialog
      open={true}
      onOpenChange={() => {}}
      date="2025-01-15"
      onDateChange={() => {}}
      amount="2000"
      onAmountChange={() => {}}
      onSubmit={() => {}}
    />,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("Add mortgage payment")).toBeInTheDocument();
});
