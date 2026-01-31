import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";
import { usePresetTransactions } from "@/context/PresetTransactionsContext";
import { useRules } from "@/context/RulesContext";
import { getCategoryColor } from "@/lib/categoryColors";
import type { ExpenseSource } from "@/lib/types";
import type { RuleCondition, RuleAction } from "@/lib/rules";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PageTourTrigger } from "@/components/PageTourTrigger";
import { SOURCE_OPTIONS } from "@/lib/sourceLabels";
import { rulesTourSteps } from "@/lib/pageTourSteps";

type ConditionType = RuleCondition["type"];

const AMOUNT_OPERATORS = [
  { value: "lt", label: "<" },
  { value: "gte", label: "≥" },
  { value: "between", label: "Between" },
] as const;

const CATEGORY_TOTAL_OPERATORS = [
  { value: "lt", label: "<" },
  { value: "gte", label: "≥" },
] as const;

export function RulesPage() {
  const { t } = useTranslation();
  const { expenseCategories, cardSources } = useBudget();
  const { rules, addRule, removeRule, reorderRule, toggleRule } = useRules();
  const {
    presetTransactions,
    addPreset,
    removePreset,
  } = usePresetTransactions();

  const sourceOptionsFiltered = useMemo(
    () => SOURCE_OPTIONS.filter((o) => cardSources.includes(o.value)),
    [cardSources],
  );
  const cardMemberOptions = useMemo(() => ["AYAZ UDDIN", "TASNUVA AHMED"], []);

  const [presetOpen, setPresetOpen] = useState(false);
  const [presetSource, setPresetSource] = useState<ExpenseSource>("manual");
  const [presetDescription, setPresetDescription] = useState("");
  const [presetCategory, setPresetCategory] = useState(
    expenseCategories[0] ?? "",
  );
  const [presetMember, setPresetMember] = useState(cardMemberOptions[0] ?? "");

  const [open, setOpen] = useState(false);
  const [conditionType, setConditionType] = useState<ConditionType>("source");
  const [sourceValue, setSourceValue] = useState<ExpenseSource>("amex");
  const [cardMemberValue, setCardMemberValue] = useState(
    cardMemberOptions[0] ?? "",
  );
  const [cardMemberMatch, setCardMemberMatch] = useState<"equals" | "contains">(
    "contains",
  );
  const [amountOperator, setAmountOperator] = useState<
    "lt" | "gte" | "between"
  >("lt");
  const [amountValue, setAmountValue] = useState("");
  const [amountValueMax, setAmountValueMax] = useState("");
  const [categoryTotalCategory, setCategoryTotalCategory] = useState(
    expenseCategories[0] ?? "",
  );
  const [categoryTotalOperator, setCategoryTotalOperator] = useState<
    "lt" | "gte"
  >("gte");
  const [categoryTotalValue, setCategoryTotalValue] = useState("");
  const [actionType, setActionType] =
    useState<RuleAction["type"]>("setCategory");
  const [actionCategory, setActionCategory] = useState(
    expenseCategories[0] ?? "",
  );
  const [warningMessage, setWarningMessage] = useState("");
  const [ruleToDeleteId, setRuleToDeleteId] = useState<string | null>(null);
  const [presetToDeleteId, setPresetToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (conditionType !== "categoryTotal" && actionType === "showWarning") {
      setActionType("setCategory");
      setWarningMessage("");
    }
  }, [conditionType, actionType]);

  const handleAddPreset = () => {
    addPreset({
      source: presetSource,
      description: presetDescription.trim(),
      category: presetCategory,
      cardMember: presetMember,
    });
    setPresetSource("manual");
    setPresetDescription("");
    setPresetCategory(expenseCategories[0] ?? "");
    setPresetMember(cardMemberOptions[0] ?? "");
    setPresetOpen(false);
  };

  const resetForm = () => {
    setConditionType("source");
    setSourceValue("amex");
    setCardMemberValue(cardMemberOptions[0] ?? "");
    setCardMemberMatch("contains");
    setAmountOperator("lt");
    setAmountValue("");
    setAmountValueMax("");
    setCategoryTotalCategory(expenseCategories[0] ?? "");
    setCategoryTotalOperator("gte");
    setCategoryTotalValue("");
    setActionType("setCategory");
    setActionCategory(expenseCategories[0] ?? "");
    setWarningMessage("");
  };

  const buildCondition = (): RuleCondition | null => {
    switch (conditionType) {
      case "source":
        return { type: "source", value: sourceValue };
      case "cardMember":
        if (!cardMemberValue.trim()) return null;
        return {
          type: "cardMember",
          value: cardMemberValue.trim(),
          match: cardMemberMatch,
        };
      case "expenseAmount": {
        const value = Number(amountValue);
        if (Number.isNaN(value)) return null;
        if (amountOperator === "between") {
          const max = Number(amountValueMax);
          if (Number.isNaN(max)) return null;
          return {
            type: "expenseAmount",
            operator: "between",
            value,
            valueMax: max,
          };
        }
        return { type: "expenseAmount", operator: amountOperator, value };
      }
      case "categoryTotal": {
        const value = Number(categoryTotalValue);
        if (!categoryTotalCategory || Number.isNaN(value)) return null;
        return {
          type: "categoryTotal",
          category: categoryTotalCategory,
          operator: categoryTotalOperator,
          value,
          period: "current_month",
        };
      }
      default:
        return null;
    }
  };

  const buildAction = (): RuleAction | null => {
    if (actionType === "setCategory") {
      if (!actionCategory) return null;
      return { type: "setCategory", value: actionCategory };
    }
    if (conditionType !== "categoryTotal") return null;
    if (!warningMessage.trim()) return null;
    return { type: "showWarning", message: warningMessage.trim() };
  };

  const handleAddRule = () => {
    const condition = buildCondition();
    const action = buildAction();
    if (!condition || !action) return;
    addRule({
      enabled: true,
      condition,
      action,
    });
    setOpen(false);
    resetForm();
  };

  const renderCondition = (condition: RuleCondition) => {
    switch (condition.type) {
      case "source":
        return `${t("rules.ifSource")} ${SOURCE_OPTIONS.find((o) => o.value === condition.value)?.label ?? condition.value}`;
      case "cardMember":
        return `${t("rules.ifCardMember")} ${
          condition.match === "equals" ? t("rules.equals") : t("rules.contains")
        } ${condition.value}`;
      case "expenseAmount":
        if (condition.operator === "between") {
          return `${t("rules.ifAmount")} ${condition.value}–${condition.valueMax}`;
        }
        return `${t("rules.ifAmount")} ${
          condition.operator === "lt" ? "<" : "≥"
        } ${condition.value}`;
      case "categoryTotal":
        return `${t("rules.ifCategoryTotal")} ${condition.category} ${
          condition.operator === "lt" ? "<" : "≥"
        } ${condition.value}`;
      default:
        return "";
    }
  };

  const renderAction = (action: RuleAction) => {
    if (action.type === "setCategory") {
      return `${t("rules.thenSetCategory")} ${action.value}`;
    }
    if (action.type === "showWarning") {
      return `${t("rules.thenShowWarning")} ${action.message}`;
    }
    return "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{t("rules.title")}</h1>
            <PageTourTrigger pageId="rules" steps={rulesTourSteps} />
          </div>
          <p className="text-sm text-muted-foreground">{t("rules.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                {t("rules.addRule")}
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("rules.newRule")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("rules.conditionType")}</Label>
                <Select
                  value={conditionType}
                  onValueChange={(v) => setConditionType(v as ConditionType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="source">
                      {t("rules.conditionSource")}
                    </SelectItem>
                    <SelectItem value="cardMember">
                      {t("rules.conditionCardMember")}
                    </SelectItem>
                    <SelectItem value="expenseAmount">
                      {t("rules.conditionExpenseAmount")}
                    </SelectItem>
                    <SelectItem value="categoryTotal">
                      {t("rules.conditionCategoryTotal")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {conditionType === "source" && (
                <div className="space-y-2">
                  <Label>{t("rules.source")}</Label>
                  <Select
                    value={
                      cardSources.includes(sourceValue)
                        ? sourceValue
                        : (cardSources[0] as ExpenseSource)
                    }
                    onValueChange={(v) => setSourceValue(v as ExpenseSource)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceOptionsFiltered.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {conditionType === "cardMember" && (
                <>
                  <div className="space-y-2">
                    <Label>{t("rules.cardMemberMatch")}</Label>
                    <Select
                      value={cardMemberMatch}
                      onValueChange={(v) =>
                        setCardMemberMatch(v as "equals" | "contains")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contains">
                          {t("rules.contains")}
                        </SelectItem>
                        <SelectItem value="equals">
                          {t("rules.equals")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("rules.cardMember")}</Label>
                    <Select
                      value={cardMemberValue}
                      onValueChange={setCardMemberValue}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cardMemberOptions.map((member) => (
                          <SelectItem key={member} value={member}>
                            {member}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {conditionType === "expenseAmount" && (
                <>
                  <div className="space-y-2">
                    <Label>{t("rules.amountOperator")}</Label>
                    <Select
                      value={amountOperator}
                      onValueChange={(v) =>
                        setAmountOperator(v as "lt" | "gte" | "between")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AMOUNT_OPERATORS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>{t("rules.amount")}</Label>
                      <Input
                        inputMode="decimal"
                        value={amountValue}
                        onChange={(e) => setAmountValue(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    {amountOperator === "between" && (
                      <div className="space-y-2">
                        <Label>{t("rules.amountMax")}</Label>
                        <Input
                          inputMode="decimal"
                          value={amountValueMax}
                          onChange={(e) => setAmountValueMax(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {conditionType === "categoryTotal" && (
                <>
                  <div className="space-y-2">
                    <Label>{t("rules.category")}</Label>
                    <Select
                      value={categoryTotalCategory}
                      onValueChange={setCategoryTotalCategory}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>{t("rules.amountOperator")}</Label>
                      <Select
                        value={categoryTotalOperator}
                        onValueChange={(v) =>
                          setCategoryTotalOperator(v as "lt" | "gte")
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_TOTAL_OPERATORS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("rules.amount")}</Label>
                      <Input
                        inputMode="decimal"
                        value={categoryTotalValue}
                        onChange={(e) => setCategoryTotalValue(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("rules.categoryTotalNote")}
                  </p>
                </>
              )}

              <div className="space-y-2">
                <Label>{t("rules.actionType")}</Label>
                <Select
                  value={actionType}
                  onValueChange={(v) => setActionType(v as RuleAction["type"])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="setCategory">
                      {t("rules.actionSetCategory")}
                    </SelectItem>
                    {conditionType === "categoryTotal" && (
                      <SelectItem value="showWarning">
                        {t("rules.actionShowWarning")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {actionType === "setCategory" && (
                <div className="space-y-2">
                  <Label>{t("rules.action")}</Label>
                  <Select
                    value={actionCategory}
                    onValueChange={setActionCategory}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {actionType === "showWarning" && (
                <div className="space-y-2">
                  <Label>{t("rules.warningMessage")}</Label>
                  <Input
                    value={warningMessage}
                    onChange={(e) => setWarningMessage(e.target.value)}
                    placeholder={t("rules.warningPlaceholder")}
                  />
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleAddRule}>{t("common.save")}</Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card data-tour="rulesList">
        <CardHeader>
          <CardTitle>{t("rules.priorityTitle")}</CardTitle>
          <CardDescription>{t("rules.priorityDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rules.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t("rules.empty")}
            </div>
          ) : (
            rules.map((rule, index) => (
              <div
                key={rule.id}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                    aria-label={t("rules.toggleRule")}
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {renderCondition(rule.condition)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {renderAction(rule.action)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => reorderRule(rule.id, "up")}
                    disabled={index === 0}
                    aria-label={t("rules.moveUp")}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => reorderRule(rule.id, "down")}
                    disabled={index === rules.length - 1}
                    aria-label={t("rules.moveDown")}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRuleToDeleteId(rule.id)}
                    aria-label={t("common.delete")}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={ruleToDeleteId !== null}
        onOpenChange={(open) => !open && setRuleToDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rules.deleteRuleTitle")}</DialogTitle>
            <DialogDescription>
              {t("rules.deleteRuleDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRuleToDeleteId(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (ruleToDeleteId) {
                  removeRule(ruleToDeleteId);
                  setRuleToDeleteId(null);
                }
              }}
            >
              <Trash2 className="size-4" />
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={presetToDeleteId !== null}
        onOpenChange={(open) => !open && setPresetToDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("presetTransactions.deletePresetTitle")}</DialogTitle>
            <DialogDescription>
              {t("presetTransactions.deletePresetDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPresetToDeleteId(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (presetToDeleteId) {
                  removePreset(presetToDeleteId);
                  setPresetToDeleteId(null);
                }
              }}
            >
              <Trash2 className="size-4" />
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card data-tour="presets">
        <CardHeader>
          <CardTitle>{t("presetTransactions.title")}</CardTitle>
          <CardDescription>
            {t("presetTransactions.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Dialog open={presetOpen} onOpenChange={setPresetOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="size-4" />
                {t("presetTransactions.addPreset")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("presetTransactions.newPreset")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("presetTransactions.source")}</Label>
                  <Select
                    value={
                      cardSources.includes(presetSource)
                        ? presetSource
                        : (cardSources[0] as ExpenseSource)
                    }
                    onValueChange={(v) => setPresetSource(v as ExpenseSource)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceOptionsFiltered.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("presetTransactions.descriptionLabel")}</Label>
                  <Input
                    value={presetDescription}
                    onChange={(e) => setPresetDescription(e.target.value)}
                    placeholder={t("addTransaction.placeholderDescription")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("presetTransactions.category")}</Label>
                  <Select
                    value={presetCategory}
                    onValueChange={setPresetCategory}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("presetTransactions.member")}</Label>
                  <Select value={presetMember} onValueChange={setPresetMember}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cardMemberOptions.map((member) => (
                        <SelectItem key={member} value={member}>
                          {member}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={() => setPresetOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handleAddPreset}>{t("common.save")}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {presetTransactions.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t("presetTransactions.empty")}
            </div>
          ) : (
            presetTransactions.map((preset) => {
              const sourceLabel =
                SOURCE_OPTIONS.find((o) => o.value === preset.source)?.label ??
                preset.source;
              return (
                <div
                  key={preset.id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="text-sm flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{sourceLabel}</span>
                    {preset.description ? (
                      <span className="text-muted-foreground">
                        {" — "}
                        {preset.description}
                      </span>
                    ) : null}
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      {" · "}
                      <span
                        className={`size-2 shrink-0 rounded-full ${getCategoryColor(preset.category, "expense")}`}
                        aria-hidden
                      />
                      {preset.category} · {preset.cardMember}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPresetToDeleteId(preset.id)}
                    aria-label={t("presetTransactions.delete")}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
