import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import { usePresetTransactions } from "@/context/PresetTransactionsContext";
import type { ExpenseSource } from "@/types/core";
import type {
  TransactionRow,
  AddTransactionDialogProps,
} from "@/types/transactions";
import { EXPENSE_SOURCE_LOCALE_KEYS } from "@/lib/sourceLabels";
import { SourceIcon } from "@/components/cards";
import { CategoryOption, getCategoryColor } from "@/lib/categoryColors";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ChevronDown, Copy, Plus, Trash2 } from "lucide-react";

function defaultRow(defaultSource: ExpenseSource = "manual"): TransactionRow {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    description: "",
    category: "", // default: Uncategorized (empty string; UI shows "_" in Select)
    source: defaultSource,
    owner: "",
  };
}

export function AddTransactionDialog({
  open,
  onOpenChange,
}: AddTransactionDialogProps) {
  const { t } = useTranslation();
  const { expenses, addExpense, expenseCategories, cardSources, owners } = useBudget();
  const { presetTransactions } = usePresetTransactions();
  const defaultSource = (cardSources[0] as ExpenseSource) ?? "manual";
  const [rows, setRows] = useState<TransactionRow[]>(() => [
    defaultRow(defaultSource),
  ]);
  const [activeRowIndex, setActiveRowIndex] = useState(0);

  useEffect(() => {
    if (open) {
      const fallback = (cardSources[0] as ExpenseSource) ?? "manual";
      setRows([defaultRow(fallback)]);
      setActiveRowIndex(0);
    }
  }, [open, cardSources]);

  const ownerOptions = useMemo(() => {
    if (owners.length > 0) return owners;
    const fromExpenses = [
      ...new Set(
        expenses.map((e) => e.owner).filter((m): m is string => !!m)
      ),
    ].sort();
    return fromExpenses;
  }, [owners, expenses]);

  const updateRow = (index: number, updates: Partial<TransactionRow>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...updates } : r))
    );
  };

  const addRow = () => {
    setRows((prev) => {
      const next = [...prev, defaultRow(defaultSource)];
      setActiveRowIndex(next.length - 1);
      return next;
    });
  };

  const copyRow = (index: number) => {
    const template = rows[index]!;
    const newRow: TransactionRow = { ...template, id: crypto.randomUUID() };
    setRows((prev) => [
      ...prev.slice(0, index + 1),
      newRow,
      ...prev.slice(index + 1),
    ]);
    setActiveRowIndex(index + 1);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setActiveRowIndex((current) => {
        if (current === index) return Math.max(0, index - 1);
        if (current > index) return current - 1;
        return current;
      });
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const toAdd = rows.flatMap((row) => {
      const num = parseFloat(row.amount.replace(/[$,]/g, ""));
      if (Number.isNaN(num) || num <= 0) return [];
      return [
        {
          date: row.date,
          amount: num,
          description:
            row.description.trim() ||
            t(`addTransaction.${EXPENSE_SOURCE_LOCALE_KEYS.manual}`),
          category: row.category || "",
          source: row.source,
          owner: row.owner.trim() || undefined,
        },
      ];
    });
    toAdd.forEach((expense) => addExpense(expense));
    const added = toAdd.length;
    if (added > 0) {
      setRows([defaultRow()]);
      onOpenChange(false);
    }
  };

  const validCount = rows.filter((r) => {
    const n = parseFloat(r.amount.replace(/[$,]/g, ""));
    return !Number.isNaN(n) && n > 0;
  }).length;

  const PRESET_NONE_VALUE = "_none";

  const handlePresetChange = (index: number, presetId: string) => {
    if (presetId === PRESET_NONE_VALUE || !presetId) {
      updateRow(index, { presetId: undefined });
      return;
    }
    const preset = presetTransactions.find((p) => p.id === presetId);
    if (preset) {
      updateRow(index, {
        source: preset.source,
        description: preset.description,
        category: preset.category,
        owner: preset.owner,
        presetId: preset.id,
      });
    }
  };

  const fieldClass = "h-11 w-full min-w-0";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";
  const sheetSide = "right";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={sheetSide}
       
        className="flex flex-col h-full w-[90vw] max-w-md border-l p-4 gap-3 overflow-hidden rounded-l-2xl md:w-[720px] md:max-w-[720px]"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader className="shrink-0 gap-2">
          <SheetTitle className="text-xl">
            {rows.length > 1
              ? t("addTransaction.newTransactions")
              : t("addTransaction.newTransaction")}
          </SheetTitle>
          <SheetDescription className="text-sm">
            {t("addTransaction.dialogDesc")}
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 gap-3 overflow-hidden"
        >
          <div className="flex-1 min-h-0 overflow-auto space-y-4">
            {rows.map((row, index) => (
              <div key={row.id} className="rounded-xl border p-4 space-y-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveRowIndex(index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveRowIndex(index);
                    }
                  }}
                  className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-base font-medium">
                      {t("addTransaction.transaction")} {index + 1}
                    </div>
                    {activeRowIndex !== index && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {(row.description || t("addTransaction.placeholderDescription"))}
                        {" · "}
                        {(row.category || t("addTransaction.uncategorized"))}
                        {" · "}
                        {row.amount || "0.00"}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyRow(index);
                      }}
                      title={t("addTransaction.copyRow")}
                    >
                      <Copy className="size-4" />
                    </Button>
                    {rows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRow(index);
                        }}
                        title={t("addTransaction.removeRow")}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                    <ChevronDown
                      className={`size-4 text-muted-foreground transition-transform ${
                        activeRowIndex === index ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {activeRowIndex === index && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {presetTransactions.length > 0 &&
                    expenseCategories.length > 0 && (
                      <div className="space-y-1 md:col-span-2">
                        <div className="text-xs text-muted-foreground">
                          {t("addTransaction.preset")}
                        </div>
                        <Select
                          value={row.presetId ?? PRESET_NONE_VALUE}
                          onValueChange={(v) => handlePresetChange(index, v)}
                        >
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue
                              placeholder={t("addTransaction.presetNone")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={PRESET_NONE_VALUE}>
                              {t("addTransaction.presetNone")}
                            </SelectItem>
                            {presetTransactions.map((preset) => {
                              const sourceLabel = t(
                                `addTransaction.${
                                  EXPENSE_SOURCE_LOCALE_KEYS[preset.source]
                                }`
                              );
                              const descPart =
                                preset.description.trim().length > 0
                                  ? `${preset.description.slice(0, 30)}${
                                      preset.description.length > 30 ? "…" : ""
                                    }`
                                  : "";
                              const label = descPart
                                ? `${sourceLabel} – ${descPart} · ${preset.category}`
                                : `${sourceLabel} · ${preset.category}`;
                              const dotColor = getCategoryColor(
                                preset.category,
                                "expense"
                              );
                              return (
                                <SelectItem key={preset.id} value={preset.id}>
                                  <span className="flex items-center gap-2">
                                    <span
                                      className={`size-2 shrink-0 rounded-full ${dotColor}`}
                                      aria-hidden
                                    />
                                    {label}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {t("addTransaction.source")}
                    </div>
                    <Select
                      value={
                        cardSources.includes(row.source)
                          ? row.source
                          : defaultSource
                      }
                      onValueChange={(v) =>
                        updateRow(index, { source: v as ExpenseSource })
                      }
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cardSources.map((s) => (
                          <SelectItem key={s} value={s}>
                            <span className="flex items-center gap-2">
                              <SourceIcon
                                source={s as ExpenseSource}
                                size={18}
                              />
                              {t(
                                `addTransaction.${
                                  EXPENSE_SOURCE_LOCALE_KEYS[
                                    s as ExpenseSource
                                  ]
                                }`
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {t("addTransaction.date")}
                    </div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="YYYY-MM-DD"
                      pattern="\d{4}-\d{2}-\d{2}"
                      maxLength={10}
                      className={fieldClass}
                      value={row.date}
                      onChange={(e) =>
                        updateRow(index, { date: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {t("addTransaction.amount")}
                    </div>
                    <Input
                      type="text"
                      placeholder={t("addTransaction.placeholderAmount")}
                      className={fieldClass}
                      value={row.amount}
                      onChange={(e) =>
                        updateRow(index, { amount: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {t("addTransaction.category")}
                    </div>
                    <Select
                      value={row.category || "_"}
                      onValueChange={(v) =>
                        updateRow(index, { category: v === "_" ? "" : v })
                      }
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_">
                          <CategoryOption
                            name={t("addTransaction.uncategorized")}
                            type="expense"
                          />
                        </SelectItem>
                        {expenseCategories.map((c) => (
                          <SelectItem key={c} value={c}>
                            <CategoryOption name={c} type="expense" />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <div className="text-xs text-muted-foreground">
                      {t("addTransaction.description")}
                    </div>
                    <Input
                      placeholder={t("addTransaction.placeholderDescription")}
                      className={fieldClass}
                      value={row.description}
                      onChange={(e) =>
                        updateRow(index, { description: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <div className="text-xs text-muted-foreground">
                      {t("common.owner")}
                    </div>
                    <Select
                      value={row.owner || "_none"}
                      onValueChange={(v) =>
                        updateRow(index, { owner: v === "_none" ? "" : v })
                      }
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder={t("common.noOwner")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">
                          {t("common.noOwner")}
                        </SelectItem>
                        {ownerOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                )}
              </div>
            ))}
          </div>
          <div className="shrink-0 flex flex-col gap-3 pt-3 border-t">
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={addRow}
              >
                <Plus className="size-4" />
                {t("addTransaction.addRow")}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t("addTransaction.withValidAmount", { count: validCount })}
              </span>
            </div>
            <SheetFooter className="flex-row gap-2 p-0">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1"
                onClick={() => onOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" className="h-11 flex-1" disabled={validCount === 0}>
                {validCount === 0
                  ? t("addTransaction.addTransaction")
                  : validCount === 1
                  ? t("addTransaction.addTransaction")
                  : t("addTransaction.addTransactions", {
                      count: validCount,
                    })}
              </Button>
            </SheetFooter>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
