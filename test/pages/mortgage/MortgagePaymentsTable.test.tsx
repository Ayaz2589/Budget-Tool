import { test, expect, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { MortgagePaymentsTable } from "@/pages/mortgage/MortgagePaymentsTable";
import i18n from "@/i18n";

test("MortgagePaymentsTable shows empty state when no payments", () => {
  render(
    <MortgagePaymentsTable
      payments={[]}
      onPaymentTap={() => {}}
    />,
  );
  expect(screen.getByText(i18n.t("mortgage.noPaymentsYet"))).toBeInTheDocument();
});

test("MortgagePaymentsTable shows Date and Category headers when has payments", () => {
  const onPaymentTap = mock(() => {});
  render(
    <MortgagePaymentsTable
      payments={[
        {
          id: "e1",
          date: "2025-01-15",
          amount: 2000,
          description: "Mortgage",
          category: "Mortgage",
          source: "manual",
        },
      ]}
      onPaymentTap={onPaymentTap}
    />,
  );
  expect(
    screen.getByRole("columnheader", { name: i18n.t("common.date") }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("columnheader", { name: i18n.t("common.category") }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Mortgage/i }));
  expect(onPaymentTap).toHaveBeenCalledWith(
    expect.objectContaining({ id: "e1" }),
  );
});
