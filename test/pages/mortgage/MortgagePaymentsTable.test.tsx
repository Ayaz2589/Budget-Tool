import { test, expect, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { MortgagePaymentsTable } from "@/pages/mortgage/MortgagePaymentsTable";

test("MortgagePaymentsTable shows empty state when no payments", () => {
  render(
    <MortgagePaymentsTable
      payments={[]}
      onPaymentTap={() => {}}
    />,
  );
  expect(
    screen.getByText("No mortgage payments yet. Add your first payment."),
  ).toBeInTheDocument();
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
    screen.getByRole("columnheader", { name: "Date" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("columnheader", { name: "Category" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Mortgage/i }));
  expect(onPaymentTap).toHaveBeenCalledWith(
    expect.objectContaining({ id: "e1" }),
  );
});
