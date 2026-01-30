import { test, expect } from "bun:test";
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import { RulesPage } from "@/pages/rules/RulesPage";
import { BudgetProvider } from "@/context/BudgetContext";
import { RulesProvider } from "@/context/RulesContext";
import { PresetTransactionsProvider } from "@/context/PresetTransactionsContext";

const RULES_STORAGE_KEY = "budget-tool-rules";
const PRESET_STORAGE_KEY = "budget-tool-preset-transactions";

test("RulesPage shows delete rule confirmation dialog when rule delete is clicked", () => {
  localStorage.clear();
  localStorage.setItem(
    RULES_STORAGE_KEY,
    JSON.stringify([
      {
        id: "rule-1",
        enabled: true,
        condition: { type: "source", value: "amex" },
        action: { type: "setCategory", value: "My Purchase" },
      },
    ]),
  );
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify([]));

  render(
    <BudgetProvider>
      <RulesProvider>
        <PresetTransactionsProvider>
          <RulesPage />
        </PresetTransactionsProvider>
      </RulesProvider>
    </BudgetProvider>,
  );

  const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
  fireEvent.click(deleteButtons[0]);

  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("Delete this rule?")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Delete", hidden: false }),
  ).toBeInTheDocument();
});

test("RulesPage shows delete preset confirmation dialog when preset delete is clicked", () => {
  cleanup();
  localStorage.clear();
  localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify([]));
  localStorage.setItem(
    PRESET_STORAGE_KEY,
    JSON.stringify([
      {
        id: "preset-1",
        source: "manual",
        description: "Rent",
        category: "My Purchase",
        cardMember: "AYAZ UDDIN",
      },
    ]),
  );

  render(
    <BudgetProvider>
      <RulesProvider>
        <PresetTransactionsProvider>
          <RulesPage />
        </PresetTransactionsProvider>
      </RulesProvider>
    </BudgetProvider>,
  );

  const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
  fireEvent.click(deleteButtons[0]);

  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("Delete this preset?")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Delete", hidden: false }),
  ).toBeInTheDocument();
});
