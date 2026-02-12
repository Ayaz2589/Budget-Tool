import { afterEach, test, expect, mock } from "bun:test";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AddIncomeDialog } from "@/pages/income/AddIncomeDialog";

afterEach(() => cleanup());

test("AddIncomeDialog does not show dialog content when closed", () => {
  render(
    <AddIncomeDialog
      open={false}
      onOpenChange={() => {}}
      incomeCategories={["Paycheck", "Other"]}
      onSubmit={() => {}}
    />,
  );
  expect(screen.queryByText("New income")).not.toBeInTheDocument();
});

test("AddIncomeDialog shows New income title when open", () => {
  render(
    <AddIncomeDialog
      open={true}
      onOpenChange={() => {}}
      incomeCategories={["Paycheck", "Other"]}
      onSubmit={() => {}}
    />,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("New income")).toBeInTheDocument();
});

test("AddIncomeDialog submits payload", () => {
  const onSubmit = mock(() => {});
  const todayIso = new Date().toISOString().slice(0, 10);
  render(
    <AddIncomeDialog
      open={true}
      onOpenChange={() => {}}
      incomeCategories={["Paycheck", "Other"]}
      owners={["Ayaz"]}
      dateFormat="YYYY/MM/DD"
      onSubmit={onSubmit}
    />,
  );

  const dialog = screen.getByRole("dialog");
  fireEvent.change(within(dialog).getByPlaceholderText("0.00"), {
    target: { value: "2500.25" },
  });
  fireEvent.change(within(dialog).getByPlaceholderText(/paycheck, basement rent/i), {
    target: { value: "Salary" },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));

  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
    date: todayIso,
    amount: 2500.25,
    description: "Salary",
    owner: "Ayaz",
  });
});
