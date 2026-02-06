import { afterEach, test, expect, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { IncomeActionsDialog } from "@/pages/income/IncomeActionsDialog";

const t = (key: string) => key;

afterEach(() => cleanup());

test("IncomeActionsDialog triggers edit and delete flow", () => {
  const onEdit = mock(() => {});
  const onDelete = mock(() => {});
  render(
    <IncomeActionsDialog
      income={{
        id: "i1",
        date: "2026-02-01",
        amount: 500,
        description: "Salary",
        category: "Paycheck",
        owner: "Ayaz",
      }}
      onClose={() => {}}
      onUpdateCategory={() => {}}
      onUpdateOwner={() => {}}
      onEdit={onEdit}
      onDelete={onDelete}
      incomeCategories={["Paycheck", "Other"]}
      ownerOptions={["Ayaz"]}
      t={t}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "common.edit" }));
  expect(onEdit).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: "common.delete" }));
  expect(screen.getByText("income.deleteIncomeTitle")).toBeInTheDocument();
  const deleteButtons = screen.getAllByRole("button", { name: "common.delete" });
  fireEvent.click(deleteButtons[deleteButtons.length - 1]!);
  expect(onDelete).toHaveBeenCalledWith("i1");
});
