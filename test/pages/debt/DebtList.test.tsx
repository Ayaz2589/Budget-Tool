import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { DebtList } from "@/pages/debt/DebtList";

test("DebtList shows empty state when no debts", () => {
  render(
    <DebtList
      debts={[]}
      paymentsByDebt={new Map()}
      onAddPayment={() => {}}
      onUpdateOwner={() => {}}
      ownerOptions={[]}
      onDelete={() => {}}
      onRemovePayment={() => {}}
    />,
  );
  expect(screen.getByText("No debts yet. Add one above.")).toBeInTheDocument();
});
