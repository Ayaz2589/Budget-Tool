import { afterEach, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DatePicker } from "@/components/ui/date-picker";

afterEach(() => cleanup());

function getCurrentMonthDayButton(day: number): HTMLButtonElement {
  const candidates = screen.getAllByRole("button", { name: String(day) });
  const match = candidates.find(
    (button) => !button.className.includes("text-muted-foreground/50"),
  );
  if (!match) throw new Error(`No in-month day button found for ${day}`);
  return match as HTMLButtonElement;
}

test("DatePicker opens calendar dropdown from trigger", () => {
  render(
    <DatePicker
      valueIso="2026-02-12"
      triggerLabel="2026/02/12"
      onChangeIso={() => {}}
      triggerClassName="h-10 w-full"
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "2026/02/12" }));

  expect(screen.getAllByText("February 2026").length).toBeGreaterThan(0);
  expect(screen.getByText("Su")).toBeInTheDocument();
  expect(screen.getByText("Sa")).toBeInTheDocument();
});

test("DatePicker emits ISO date when a day is selected", () => {
  const onChangeIso = mock(() => {});
  render(
    <DatePicker
      valueIso="2026-02-12"
      triggerLabel="2026/02/12"
      onChangeIso={onChangeIso}
      triggerClassName="h-10 w-full"
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "2026/02/12" }));
  fireEvent.click(getCurrentMonthDayButton(20));

  expect(onChangeIso).toHaveBeenCalledWith("2026-02-20");
});
