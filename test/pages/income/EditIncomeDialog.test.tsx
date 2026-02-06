import { afterEach, test, expect, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BudgetProvider } from "@/context/BudgetContext";
import { EditIncomeDialog } from "@/pages/income/EditIncomeDialog";

afterEach(() => cleanup());

test("EditIncomeDialog submits edited income payload", () => {
  const onSubmit = mock(() => {});
  render(
    <BudgetProvider>
      <EditIncomeDialog
        income={{
          id: "i1",
          date: "2026-02-01",
          amount: 1000,
          description: "Paycheck",
          category: "Other",
          owner: "Ayaz",
        }}
        onClose={() => {}}
        incomeCategories={["Paycheck", "Other"]}
        owners={["Ayaz"]}
        onSubmit={onSubmit}
      />
    </BudgetProvider>,
  );

  fireEvent.change(screen.getByPlaceholderText("0.00"), {
    target: { value: "1500" },
  });
  fireEvent.change(screen.getByPlaceholderText(/paycheck, basement rent/i), {
    target: { value: "Updated paycheck" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit.mock.calls[0]?.[0]).toBe("i1");
  expect(onSubmit.mock.calls[0]?.[1]).toMatchObject({
    amount: 1500,
    description: "Updated paycheck",
    owner: "Ayaz",
  });
});
