import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { DebtList } from "@/pages/debt/DebtList";

test("DebtList shows empty state when no debts", () => {
  render(
    <DebtList
      debts={[]}
      paymentsByDebt={new Map()}
      onAddPayment={() => {}}
      onEditRecurring={() => {}}
      onDelete={() => {}}
      onRemovePayment={() => {}}
      deleteConfirmDebtId={null}
      onConfirmDelete={() => {}}
      onDismissDelete={() => {}}
    />,
  );
  expect(screen.getByText("No debts yet. Add one above.")).toBeInTheDocument();
});
