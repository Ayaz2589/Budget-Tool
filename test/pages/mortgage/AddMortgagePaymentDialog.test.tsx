import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { AddMortgagePaymentDialog } from "@/pages/mortgage/AddMortgagePaymentDialog";
import i18n from "@/i18n";

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
  expect(screen.getByText(i18n.t("mortgage.addMortgagePayment"))).toBeInTheDocument();
});
