import { afterEach, test, expect, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { IncomeTable } from "@/pages/income/IncomeTable";

afterEach(() => cleanup());

test("IncomeTable shows empty state when no income", () => {
  render(
    <IncomeTable
      byMonth={[]}
      defaultOpenMonth=""
      incomeCategories={["Paycheck", "Other"]}
      onEdit={() => {}}
      onDelete={() => {}}
      onUpdateCategory={() => {}}
      onUpdateOwner={() => {}}
    />,
  );
  expect(
    screen.getAllByText("No income yet. Add your first entry to get started.")
      .length,
  ).toBeGreaterThan(0);
});

test("IncomeTable shows month header and action buttons", () => {
  const onEdit = mock(() => {});
  const onDelete = mock(() => {});
  render(
    <IncomeTable
      byMonth={[
        [
          "2026-02",
          [
            {
              id: "i1",
              date: "2026-02-01",
              amount: 1200,
              description: "Salary",
              category: "Paycheck",
              owner: "Ayaz",
            },
          ],
        ],
      ]}
      defaultOpenMonth="2026-02"
      incomeCategories={["Paycheck", "Other"]}
      ownerOptions={["Ayaz"]}
      onEdit={onEdit}
      onDelete={onDelete}
      onUpdateCategory={() => {}}
      onUpdateOwner={() => {}}
    />,
  );

  expect(screen.getAllByText("February 2026").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  expect(onEdit).toHaveBeenCalledTimes(1);
  expect(onDelete).toHaveBeenCalledWith("i1");
});
