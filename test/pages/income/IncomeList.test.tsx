import { afterEach, test, expect, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { IncomeList } from "@/pages/income/IncomeList";

afterEach(() => cleanup());

test("IncomeList toggles month and emits tap callback", () => {
  const onIncomeTap = mock(() => {});
  render(
    <IncomeList
      byMonth={[
        [
          "2026-02",
          [
            {
              id: "i1",
              date: "2026-02-01",
              amount: 1000,
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
  fireEvent.click(screen.getByRole("button", { name: /salary/i }));
  expect(onIncomeTap).toHaveBeenCalledTimes(1);
});
