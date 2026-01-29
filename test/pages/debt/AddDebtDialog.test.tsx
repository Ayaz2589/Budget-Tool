import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { AddDebtDialog } from "@/pages/debt/AddDebtDialog";

test("AddDebtDialog shows Add debt button when closed", () => {
  render(
    <AddDebtDialog open={false} onOpenChange={() => {}} onSubmit={() => {}} />,
  );
  expect(screen.getByRole("button", { name: /add debt/i })).toBeInTheDocument();
});

test("AddDebtDialog shows dialog title when open", () => {
  render(
    <AddDebtDialog open={true} onOpenChange={() => {}} onSubmit={() => {}} />,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("New debt")).toBeInTheDocument();
});
