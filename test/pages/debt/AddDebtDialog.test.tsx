import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { AddDebtDialog } from "@/pages/debt/AddDebtDialog";

test("AddDebtDialog does not show dialog content when closed", () => {
  render(
    <AddDebtDialog open={false} onOpenChange={() => {}} onSubmit={() => {}} />,
  );
  expect(screen.queryByText("New debt")).not.toBeInTheDocument();
});

test("AddDebtDialog shows dialog title when open", () => {
  render(
    <AddDebtDialog open={true} onOpenChange={() => {}} onSubmit={() => {}} />,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("New debt")).toBeInTheDocument();
});
