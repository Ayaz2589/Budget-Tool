import { afterEach, test, expect, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DebtListMobile } from "@/pages/debt/DebtListMobile";

afterEach(() => cleanup());

test("DebtListMobile renders debts and triggers actions", () => {
  const onAddPayment = mock(() => {});
  const onDelete = mock(() => {});

  render(
    <DebtListMobile
      debts={[
        {
          id: "d1",
          name: "Loan",
          initialAmount: 1000,
          startDate: "2026-01-01",
          owner: "Ayaz",
        },
      ]}
      paymentsByDebt={
        new Map([
          [
            "d1",
            [{ id: "p1", debtId: "d1", date: "2026-02-01", amount: 50, note: "Monthly" }],
          ],
        ])
      }
      onAddPayment={onAddPayment}
      onDelete={onDelete}
    />,
  );

  expect(screen.getByText("Loan")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /make payment loan/i }));
  fireEvent.click(screen.getByRole("button", { name: /delete debt loan/i }));
  expect(onAddPayment).toHaveBeenCalledWith("d1");
  expect(onDelete).toHaveBeenCalledWith("d1");
});
