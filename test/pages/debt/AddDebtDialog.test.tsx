import { afterEach, test, expect, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AddDebtDialog } from "@/pages/debt/AddDebtDialog";

afterEach(() => cleanup());

test("AddDebtDialog does not show dialog content when closed", () => {
  render(
    <AddDebtDialog open={false} onOpenChange={() => {}} onSubmit={() => {}} />,
  );
  expect(screen.queryAllByText("New debt").length).toBe(0);
});

test("AddDebtDialog shows dialog title when open", () => {
  render(
    <AddDebtDialog open={true} onOpenChange={() => {}} onSubmit={() => {}} />,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("New debt")).toBeInTheDocument();
});

test("AddDebtDialog submits normalized payload", () => {
  const onSubmit = mock(() => {});
  render(
    <AddDebtDialog
      open={true}
      onOpenChange={() => {}}
      owners={["Ayaz"]}
      dateFormat="YYYY/MM/DD"
      onSubmit={onSubmit}
    />,
  );

  fireEvent.change(screen.getByPlaceholderText(/car loan/i), {
    target: { value: "Credit Card" },
  });
  fireEvent.change(screen.getByPlaceholderText("0.00"), {
    target: { value: "1234.5" },
  });
  fireEvent.change(screen.getByPlaceholderText("YYYY/MM/DD"), {
    target: { value: "2026" },
  });
  fireEvent.change(screen.getByPlaceholderText("YYYY/MM/DD"), {
    target: { value: "20260203" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add debt" }));

  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit.mock.calls[0]?.[0]).toEqual({
    name: "Credit Card",
    initialAmount: 1234.5,
    startDate: "2026-02-03",
    owner: "Ayaz",
  });
});
