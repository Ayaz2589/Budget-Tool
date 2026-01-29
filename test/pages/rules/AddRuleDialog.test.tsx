import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { AddRuleDialog } from "@/pages/rules/AddRuleDialog";

test("AddRuleDialog shows Add rule button when closed", () => {
  render(
    <AddRuleDialog
      open={false}
      onOpenChange={() => {}}
      pattern=""
      onPatternChange={() => {}}
      category="My Purchase"
      onCategoryChange={() => {}}
      expenseCategories={["My Purchase", "Amazon"]}
      onSubmit={() => {}}
    />,
  );
  expect(screen.getByRole("button", { name: /add rule/i })).toBeInTheDocument();
});

test("AddRuleDialog shows New category rule title when open", () => {
  render(
    <AddRuleDialog
      open={true}
      onOpenChange={() => {}}
      pattern=""
      onPatternChange={() => {}}
      category="My Purchase"
      onCategoryChange={() => {}}
      expenseCategories={["My Purchase", "Amazon"]}
      onSubmit={() => {}}
    />,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("New category rule")).toBeInTheDocument();
  expect(
    screen.getByText("Pattern (substring in description)"),
  ).toBeInTheDocument();
});
