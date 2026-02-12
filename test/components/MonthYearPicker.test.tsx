import { afterEach, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MonthYearPicker } from "@/components/ui/month-year-picker";

afterEach(() => cleanup());

test("MonthYearPicker opens dropdown from trigger", () => {
  render(
    <MonthYearPicker
      value="2026-02"
      triggerLabel="2026-02"
      onChange={() => {}}
      triggerClassName="h-10 w-full"
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "2026-02" }));

  expect(screen.getByText("2026")).toBeInTheDocument();
  const monthButtons = document.querySelectorAll("div.grid.grid-cols-3 button");
  expect(monthButtons.length).toBe(12);
});

test("MonthYearPicker emits YYYY-MM when month is selected", () => {
  const onChange = mock(() => {});
  render(
    <MonthYearPicker
      value="2026-02"
      triggerLabel="2026-02"
      onChange={onChange}
      triggerClassName="h-10 w-full"
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "2026-02" }));
  const monthButtons = document.querySelectorAll("div.grid.grid-cols-3 button");
  fireEvent.click(monthButtons[0] as HTMLButtonElement);

  expect(onChange).toHaveBeenCalledWith("2026-01");
});

