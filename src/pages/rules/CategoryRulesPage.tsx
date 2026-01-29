import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRules } from "@/context/RulesContext";
import { useBudget } from "@/context/BudgetContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BASELINE_RULES_READONLY } from "@/lib/categoryRules";
import { AddRuleDialog } from "./AddRuleDialog";
import { RulesTable } from "./RulesTable";

export function CategoryRulesPage() {
  const { rules, addRule, removeRule } = useRules();
  const { expenseCategories } = useBudget();
  const [open, setOpen] = useState(false);
  const [pattern, setPattern] = useState("");
  const [category, setCategory] = useState<string>(
    expenseCategories[0] ?? "My Purchase",
  );

  const { t } = useTranslation();
  const expenseRules = rules.filter((r) => r.type === "expense");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pattern.trim()) return;
    addRule({
      pattern: pattern.trim(),
      category: category || (expenseCategories[0] ?? "My Purchase"),
      type: "expense",
    });
    setPattern("");
    setCategory(expenseCategories[0] ?? "My Purchase");
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("rules.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("rules.expenseRules")}</CardTitle>
          <CardDescription>{t("rules.expenseRulesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddRuleDialog
            open={open}
            onOpenChange={setOpen}
            pattern={pattern}
            onPatternChange={setPattern}
            category={category}
            onCategoryChange={setCategory}
            expenseCategories={expenseCategories}
            onSubmit={handleAdd}
          />
          <RulesTable
            baselineRules={BASELINE_RULES_READONLY}
            customRules={expenseRules}
            onRemoveRule={removeRule}
          />
        </CardContent>
      </Card>
    </div>
  );
}
