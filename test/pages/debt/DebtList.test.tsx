import { afterEach, test, expect, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DebtList } from "@/pages/debt/DebtList";

afterEach(() => cleanup());

test("DebtList shows empty state when no debts", () => {
  render(
    <DebtList
      debts={[]}
      paymentsByDebt={new Map()}
      onDebtTap={() => {}}
    />,
  );
  expect(
    screen.getAllByText("No debts yet. Add a debt to start tracking payments.")
      .length,
  ).toBeGreaterThan(0);
});

test("DebtList triggers row tap action", () => {
  const onDebtTap = mock(() => {});
  render(
    <DebtList
      debts={[
        {
          id: "d1",
          name: "Credit Card",
          initialAmount: 5000,
          startDate: "2026-01-01",
          owner: "Ayaz",
        },
      ]}
      paymentsByDebt={
        new Map([
          [
            "d1",
            [{ id: "p1", debtId: "d1", date: "2026-02-01", amount: 100, note: "" }],
          ],
        ])
      }
      onDebtTap={onDebtTap}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /credit card/i }));

  expect(onDebtTap).toHaveBeenCalledWith(
    expect.objectContaining({ id: "d1" }),
  );
});
