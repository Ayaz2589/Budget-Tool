import { afterEach, test, expect, mock } from "bun:test";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { BudgetProvider } from "@/context/BudgetContext";
import { AddPaymentDialog } from "@/pages/debt/AddPaymentDialog";

afterEach(() => cleanup());

test("AddPaymentDialog submits payment payload", () => {
  const onSubmit = mock(() => {});
  render(
    <BudgetProvider>
      <AddPaymentDialog
        open={true}
        debtId="d1"
        onClose={() => {}}
        onSubmit={onSubmit}
      />
    </BudgetProvider>,
  );

  const dialog = screen.getByRole("dialog");
  const dateInput = within(dialog).getByPlaceholderText("YYYY/MM/DD");
  fireEvent.change(dateInput, { target: { value: "2026" } });
  fireEvent.change(dateInput, { target: { value: "20260205" } });
  fireEvent.change(within(dialog).getByPlaceholderText("0.00"), {
    target: { value: "550.75" },
  });
  fireEvent.change(within(dialog).getByPlaceholderText(/monthly payment/i), {
    target: { value: "Feb payment" },
  });

  fireEvent.click(within(dialog).getByRole("button", { name: "Add payment" }));

  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit.mock.calls[0]?.[0]).toEqual({
    debtId: "d1",
    date: "2026-02-05",
    amount: 550.75,
    note: "Feb payment",
  });
});
