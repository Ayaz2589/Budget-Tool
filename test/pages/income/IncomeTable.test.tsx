import { afterEach, test, expect, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { IncomeTable } from "@/pages/income/IncomeTable";

afterEach(() => cleanup());

test("IncomeTable shows empty state when no income", () => {
  render(
    <IncomeTable
      byMonth={[]}
      defaultOpenMonth=""
      onIncomeTap={() => {}}
    />,
  );
  expect(
    screen.getAllByText("No income yet. Add your first entry to get started.")
      .length,
  ).toBeGreaterThan(0);
});

test("IncomeTable shows month header and row tap action", () => {
  const onIncomeTap = mock(() => {});
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
      onIncomeTap={onIncomeTap}
    />,
  );

  expect(screen.getAllByText("February 2026").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: /Salary/i }));
  expect(onIncomeTap).toHaveBeenCalledWith(
    expect.objectContaining({ id: "i1" }),
  );
});
