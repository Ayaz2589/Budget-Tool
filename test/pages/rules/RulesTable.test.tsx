import { test, expect } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { RulesTable } from "@/pages/rules/RulesTable";
import { BASELINE_RULES_READONLY } from "@/lib/categoryRules";

test("RulesTable shows Pattern and Category headers", () => {
  render(
    <RulesTable
      baselineRules={BASELINE_RULES_READONLY}
      customRules={[]}
      onRemoveRule={() => {}}
    />,
  );
  expect(
    screen.getByRole("columnheader", { name: "Pattern" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("columnheader", { name: "Category" }),
  ).toBeInTheDocument();
});

test("RulesTable shows No custom rules message when no custom rules", () => {
  const { container } = render(
    <RulesTable
      baselineRules={BASELINE_RULES_READONLY}
      customRules={[]}
      onRemoveRule={() => {}}
    />,
  );
  const table = container.querySelector("table");
  expect(table).toBeTruthy();
  expect(
    within(table!).getByText(
      "No custom rules. Add one to auto-categorize imports.",
    ),
  ).toBeInTheDocument();
});
