import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MortgagePaymentsTable } from "@/pages/mortgage/MortgagePaymentsTable";

test("MortgagePaymentsTable shows empty state when no payments", () => {
  render(<MortgagePaymentsTable payments={[]} onRemove={() => {}} />);
  expect(
    screen.getByText("No mortgage payments yet. Add your first payment."),
  ).toBeInTheDocument();
});

test("MortgagePaymentsTable shows Date and Category headers when has payments", () => {
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
      onRemove={() => {}}
    />,
  );
  expect(
    screen.getByRole("columnheader", { name: "Date" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("columnheader", { name: "Category" }),
  ).toBeInTheDocument();
});
