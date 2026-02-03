import type { Expense, ExpenseSource } from "./core";

export type RuleCondition =
  | { type: "source"; value: ExpenseSource }
  | { type: "owner"; value: string; match?: "equals" | "contains" }
  // Legacy alias for older saved rules
  | { type: "cardMember"; value: string; match?: "equals" | "contains" }
  | {
      type: "expenseAmount";
      operator: "lt" | "gte" | "between";
      value: number;
      valueMax?: number;
    }
  | {
      type: "categoryTotal";
      category: string;
      operator: "lt" | "gte";
      value: number;
      period: "current_month";
    };

export type RuleAction =
  | { type: "setCategory"; value: string }
  | { type: "showWarning"; message: string };

export type Rule = {
  id: string;
  enabled: boolean;
  condition: RuleCondition;
  action: RuleAction;
};

export type RuleContext = {
  totalsByCategory?: Record<string, number>;
  currentMonthKey?: string;
};

export type ConditionType = RuleCondition["type"];

export type RuleExpense = Pick<
  Expense,
  "date" | "amount" | "description" | "category" | "source" | "owner"
>;
