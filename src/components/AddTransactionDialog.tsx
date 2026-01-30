import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import { usePresetTransactions } from "@/context/PresetTransactionsContext";
import { useRules } from "@/context/RulesContext";
import type { ExpenseSource } from "@/lib/types";
import {
  CategoryOption,
  getCategoryColor,
} from "@/lib/categoryColors";
import {
  applyRulesToExpenses,
  computeTotalsByCategoryForMonth,
} from "@/lib/rules";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Copy, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SOURCE_KEYS: Record<ExpenseSource, string> = {
  amex: "addTransaction.sourceAmex",
  chase: "addTransaction.sourceChase",
  apple: "addTransaction.sourceApple",
  manual: "addTransaction.sourceManual",
  td: "addTransaction.sourceTd",
};

interface TransactionRow {
  id: string;
  date: string;
  amount: string;
  description: string;
  category: string;
  source: ExpenseSource;
  cardMember: string;
  presetId?: string;
}

function defaultRow(): TransactionRow {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    description: "",
    category: "",
    source: "manual",
    cardMember: "",
  };
}

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTransactionDialog({
  open,
  onOpenChange,
}: AddTransactionDialogProps) {
  const { t } = useTranslation();
  const { expenses, addExpense, expenseCategories } = useBudget();
  const { rules } = useRules();
  const { presetTransactions } = usePresetTransactions();
  const [rows, setRows] = useState<TransactionRow[]>(() => [defaultRow()]);

  useEffect(() => {
    if (open) {
      setRows([defaultRow()]);
    }
  }, [open]);

  const cardMemberOptions = useMemo(() => {
    const fromExpenses = [
      ...new Set(
        expenses.map((e) => e.cardMember).filter((m): m is string => !!m),
      ),
    ].sort();
    if (fromExpenses.length > 0) return fromExpenses;
    return ["AYAZ UDDIN", "TASNUVA AHMED"];
  }, [expenses]);

  const updateRow = (index: number, updates: Partial<TransactionRow>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...updates } : r)),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, defaultRow()]);
  };

  const copyRow = (index: number) => {
    const template = rows[index]!;
    const newRow: TransactionRow = { ...template, id: crypto.randomUUID() };
    setRows((prev) => [
      ...prev.slice(0, index + 1),
      newRow,
      ...prev.slice(index + 1),
    ]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
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
            row.description.trim() || t("addTransaction.sourceManual"),
          category: row.category || "",
          source: row.source,
          cardMember: row.cardMember.trim() || undefined,
        },
      ];
    });
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const totals = computeTotalsByCategoryForMonth(
      [...expenses, ...toAdd],
      currentMonthKey,
    );
    const withRules =
      rules.length > 0
        ? applyRulesToExpenses(toAdd, rules, {
            totalsByCategory: totals,
            currentMonthKey,
          })
        : toAdd;
    withRules.forEach((expense) => addExpense(expense));
    const added = withRules.length;
    if (added > 0) {
      setRows([defaultRow()]);
      onOpenChange(false);
    }
  };

  const validCount = rows.filter((r) => {
    const n = parseFloat(r.amount.replace(/[$,]/g, ""));
    return !Number.isNaN(n) && n > 0;
  }).length;

  const compactInput = "h-8 px-2 text-sm min-w-0";
  const compactSelectTrigger = "h-8 min-w-0 max-w-full";

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
        cardMember: preset.cardMember,
        presetId: preset.id,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col w-[94vw] max-w-[94vw]! h-[92vh] max-h-[92vh] p-4 gap-3 overflow-hidden">
        <DialogHeader className="shrink-0 gap-1">
          <DialogTitle className="text-lg">
            {rows.length > 1
              ? t("addTransaction.newTransactions")
              : t("addTransaction.newTransaction")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t("addTransaction.dialogDesc")}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 gap-3 overflow-hidden"
        >
          <div className="flex-1 min-h-0 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {presetTransactions.length > 0 && (
                    <TableHead className="w-32 py-1.5 text-xs font-medium">
                      {t("addTransaction.preset")}
                    </TableHead>
                  )}
                  <TableHead className="w-20 py-1.5 text-xs font-medium">
                    {t("addTransaction.source")}
                  </TableHead>
                  <TableHead className="w-28 py-1.5 text-xs font-medium">
                    {t("addTransaction.date")}
                  </TableHead>
                  <TableHead className="w-24 py-1.5 text-xs font-medium">
                    {t("addTransaction.amount")}
                  </TableHead>
                  <TableHead className="min-w-[140px] py-1.5 text-xs font-medium">
                    {t("addTransaction.description")}
                  </TableHead>
                  <TableHead className="w-36 py-1.5 text-xs font-medium">
                    {t("addTransaction.category")}
                  </TableHead>
                  <TableHead className="w-28 py-1.5 text-xs font-medium">
                    {t("addTransaction.member")}
                  </TableHead>
                  <TableHead className="w-20 py-1.5 text-right text-xs font-medium">
                    {t("addTransaction.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.id} className="align-middle">
                    {presetTransactions.length > 0 && (
                      <TableCell className="p-1 align-middle">
                        <Select
                          value={row.presetId ?? PRESET_NONE_VALUE}
                          onValueChange={(v) =>
                            handlePresetChange(index, v)
                          }
                        >
                          <SelectTrigger
                            className={`${compactSelectTrigger} border-0 bg-transparent shadow-none focus-visible:ring-2`}
                          >
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
                                SOURCE_KEYS[preset.source],
                              );
                              const descPart =
                                preset.description.trim().length > 0
                                  ? `${preset.description.slice(0, 30)}${preset.description.length > 30 ? "…" : ""}`
                                  : "";
                              const label = descPart
                                ? `${sourceLabel} – ${descPart} · ${preset.category}`
                                : `${sourceLabel} · ${preset.category}`;
                              const dotColor = getCategoryColor(
                                preset.category,
                                "expense",
                              );
                              return (
                                <SelectItem
                                  key={preset.id}
                                  value={preset.id}
                                >
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
                      </TableCell>
                    )}
                    <TableCell className="p-1 align-middle">
                      <Select
                        value={row.source}
                        onValueChange={(v) =>
                          updateRow(index, { source: v as ExpenseSource })
                        }
                      >
                        <SelectTrigger
                          className={`${compactSelectTrigger} border-0 bg-transparent shadow-none focus-visible:ring-2`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">
                            {t(SOURCE_KEYS.manual)}
                          </SelectItem>
                          <SelectItem value="td">
                            {t(SOURCE_KEYS.td)}
                          </SelectItem>
                          <SelectItem value="amex">
                            {t(SOURCE_KEYS.amex)}
                          </SelectItem>
                          <SelectItem value="apple">
                            {t(SOURCE_KEYS.apple)}
                          </SelectItem>
                          <SelectItem value="chase">
                            {t(SOURCE_KEYS.chase)}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-1 align-middle">
                      <Input
                        type="date"
                        className={compactInput}
                        value={row.date}
                        onChange={(e) =>
                          updateRow(index, { date: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell className="p-1 align-middle">
                      <Input
                        type="text"
                        placeholder={t("addTransaction.placeholderAmount")}
                        className={compactInput}
                        value={row.amount}
                        onChange={(e) =>
                          updateRow(index, { amount: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell className="p-1 align-middle min-w-[140px]">
                      <Input
                        placeholder={t("addTransaction.placeholderDescription")}
                        className={compactInput}
                        value={row.description}
                        onChange={(e) =>
                          updateRow(index, { description: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell className="p-1 align-middle">
                      <Select
                        value={row.category || "_"}
                        onValueChange={(v) =>
                          updateRow(index, { category: v === "_" ? "" : v })
                        }
                      >
                        <SelectTrigger
                          className={`${compactSelectTrigger} border-0 bg-transparent shadow-none focus-visible:ring-2`}
                        >
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
                    </TableCell>
                    <TableCell className="p-1 align-middle">
                      <Select
                        value={row.cardMember || "_none"}
                        onValueChange={(v) =>
                          updateRow(index, {
                            cardMember: v === "_none" ? "" : v,
                          })
                        }
                      >
                        <SelectTrigger
                          className={`${compactSelectTrigger} border-0 bg-transparent shadow-none focus-visible:ring-2`}
                        >
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">—</SelectItem>
                          {cardMemberOptions.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-1 align-middle text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => copyRow(index)}
                          title={t("addTransaction.copyRow")}
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        {rows.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeRow(index)}
                            title={t("addTransaction.removeRow")}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
              >
                <Plus className="size-4" />
                {t("addTransaction.addRow")}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t("addTransaction.withValidAmount", { count: validCount })}
              </span>
            </div>
            <DialogFooter className="flex-row gap-2 p-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" size="sm" disabled={validCount === 0}>
                {validCount === 0
                  ? t("addTransaction.addTransaction")
                  : validCount === 1
                    ? t("addTransaction.addTransaction")
                    : t("addTransaction.addTransactions", {
                        count: validCount,
                      })}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
