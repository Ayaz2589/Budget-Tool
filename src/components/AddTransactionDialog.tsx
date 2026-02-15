import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useBudget, usePresetTransactions } from "@/context";
import type { ExpenseSource, TransactionRow, AddTransactionDialogProps } from "@/types";
import {
  formatCurrencyFromNumber,
  parseCurrencyInput,
} from "@/lib/currencyInput";
import {
  dateInputToIso,
  isoToDateInput,
} from "@/lib/dateInput";
import {
  EXPENSE_SOURCE_LOCALE_KEYS,
} from "@/lib/sourceLabels";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ChevronDown, Copy, Plus, Trash2 } from "lucide-react";
import { DsSheetActions, DsSheetHeader } from "@/components/ds";
import {
  buildAllocationForRow,
  createDefaultTransactionRow,
  sortPresetTransactionsByCategory,
} from "./add-transaction-utils";
import { TransactionFormRow } from "./add-transaction/TransactionFormRow";

export function AddTransactionDialog({
  open,
  onOpenChange,
}: AddTransactionDialogProps) {
  const { t } = useTranslation();
  const {
    expenses,
    addExpense,
    addOwnerTransfer,
    expenseCategories,
    cardSources,
    owners,
    uiFormatSettings,
  } = useBudget();
  const { presetTransactions } = usePresetTransactions();
  const defaultSource = (cardSources[0] as ExpenseSource) ?? "manual";
  const [rows, setRows] = useState<TransactionRow[]>(() => [
    createDefaultTransactionRow({
      defaultSource,
      dateValue: isoToDateInput(
        new Date().toISOString().slice(0, 10),
        uiFormatSettings.dateFormat,
      ),
    }),
  ]);
  const [activeRowIndex, setActiveRowIndex] = useState(0);

  useEffect(() => {
    if (open) {
      const fallback = (cardSources[0] as ExpenseSource) ?? "manual";
      setRows([
        createDefaultTransactionRow({
          defaultSource: fallback,
          dateValue: isoToDateInput(
            new Date().toISOString().slice(0, 10),
            uiFormatSettings.dateFormat,
          ),
        }),
      ]);
      setActiveRowIndex(0);
    }
  }, [open, cardSources, uiFormatSettings.dateFormat]);

  const ownerOptions = useMemo(() => {
    if (owners.length > 0) return owners;
    const fromExpenses = [
      ...new Set(
        expenses
          .flatMap((e) => [e.paidByOwner, e.owner])
          .filter((m): m is string => !!m),
      ),
    ].sort();
    return fromExpenses;
  }, [owners, expenses]);

  const sortedPresetTransactions = useMemo(
    () => sortPresetTransactionsByCategory(presetTransactions),
    [presetTransactions],
  );

  const updateRow = (index: number, updates: Partial<TransactionRow>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...updates } : r)),
    );
  };

  const addRow = () => {
    setRows((prev) => {
      const next = [
        ...prev,
        createDefaultTransactionRow({
          defaultSource,
          dateValue: isoToDateInput(
            new Date().toISOString().slice(0, 10),
            uiFormatSettings.dateFormat,
          ),
        }),
      ];
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
    const expensesToAdd = rows.flatMap((row) => {
      if (row.entryType !== "expense") return [];
      const num = parseCurrencyInput(row.amount);
      if (Number.isNaN(num) || num <= 0) return [];
      const isoDate = dateInputToIso(row.date, uiFormatSettings.dateFormat);
      if (!isoDate) return [];
      const paidByOwner = (row.paidByOwner || row.owner || "").trim();
      const allocation = buildAllocationForRow({
        row,
        paidByOwner,
        ownerOptions,
      });
      return [
        {
          date: isoDate,
          amount: num,
          description:
            row.description.trim() ||
            t(`addTransaction.${EXPENSE_SOURCE_LOCALE_KEYS.manual}`),
          category: row.category || "",
          source: row.source,
          owner: paidByOwner || undefined,
          paidByOwner: paidByOwner || undefined,
          allocationMode: row.allocationMode,
          allocation,
        },
      ];
    });
    const transfersToAdd = rows.flatMap((row) => {
      if (row.entryType !== "owner-transfer") return [];
      const num = parseCurrencyInput(row.amount);
      if (Number.isNaN(num) || num <= 0) return [];
      const isoDate = dateInputToIso(row.date, uiFormatSettings.dateFormat);
      if (!isoDate) return [];
      const fromOwner = row.transferFromOwner.trim();
      const toOwner = row.transferToOwner.trim();
      if (!fromOwner || !toOwner || fromOwner === toOwner) return [];
      return [
        {
          date: isoDate,
          fromOwner,
          toOwner,
          amount: num,
          note: row.transferNote.trim() || undefined,
        },
      ];
    });

    expensesToAdd.forEach((expense) => addExpense(expense));
    transfersToAdd.forEach((transfer) => addOwnerTransfer(transfer));

    const added = expensesToAdd.length + transfersToAdd.length;
    if (added > 0) {
      setRows([
        createDefaultTransactionRow({
          defaultSource,
          dateValue: isoToDateInput(
            new Date().toISOString().slice(0, 10),
            uiFormatSettings.dateFormat,
          ),
        }),
      ]);
      onOpenChange(false);
    }
  };

  const validCount = rows.filter((row) => {
    const n = parseCurrencyInput(row.amount);
    if (Number.isNaN(n) || n <= 0) return false;
    if (row.entryType !== "owner-transfer") return true;
    const fromOwner = row.transferFromOwner.trim();
    const toOwner = row.transferToOwner.trim();
    return fromOwner.length > 0 && toOwner.length > 0 && fromOwner !== toOwner;
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
        entryType: "expense",
        source: preset.source,
        description: preset.description,
        amount:
          typeof preset.amount === "number" && Number.isFinite(preset.amount)
            ? formatCurrencyFromNumber(preset.amount)
            : rows[index]?.amount ?? "",
        category: preset.category,
        owner: preset.owner,
        paidByOwner: preset.owner,
        allocationMode: "single",
        allocationOwners: preset.owner ? [preset.owner] : [],
        allocationPercents: {},
        presetId: preset.id,
      });
    }
  };

  const fieldClass = "h-10 w-full min-w-0";
  const selectTriggerClass = "h-10 w-full data-[size=default]:h-10";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        data-tour="transactions-add-sheet"
        className="h-full !w-[85vw] !max-w-sm border-l p-0 gap-0 rounded-l-2xl flex flex-col overflow-hidden"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DsSheetHeader
          className="shrink-0"
          title={
            rows.length > 1
              ? t("addTransaction.newTransactions")
              : t("addTransaction.newTransaction")
          }
          description={t("addTransaction.dialogDesc")}
          helpContent={t("transactions.help.addSheet")}
          helpLabel={t("common.help")}
        />
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 gap-0 overflow-hidden"
        >
          <div className="flex-1 min-h-0 overflow-auto divide-y">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className={cn(
                  "px-2 py-2 md:px-3",
                  index % 2 === 1 ? "bg-muted/20" : "bg-background",
                )}
              >
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
                    <div className="text-sm font-semibold">
                      {t("addTransaction.transaction")} {index + 1}
                    </div>
                    {activeRowIndex !== index && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {row.description || t("addTransaction.placeholderDescription")}
                        {" \u00B7 "}
                        {row.category || t("addTransaction.uncategorized")}
                        {" \u00B7 "}
                        {row.amount || "0.00"}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
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
                        className="size-8 text-destructive hover:text-destructive"
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
                  <TransactionFormRow
                    row={row}
                    onUpdate={(updates) => updateRow(index, updates)}
                    ownerOptions={ownerOptions}
                    cardSources={cardSources}
                    defaultSource={defaultSource}
                    expenseCategories={expenseCategories}
                    presetTransactions={presetTransactions}
                    sortedPresetTransactions={sortedPresetTransactions}
                    onPresetChange={(v) => handlePresetChange(index, v)}
                    dateFormat={uiFormatSettings.dateFormat}
                    fieldClass={fieldClass}
                    selectTriggerClass={selectTriggerClass}
                  />
                )}
              </div>
            ))}
          </div>
          <DsSheetActions className="shrink-0 flex flex-col gap-2 pt-2 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
            <Button
              type="button"
              variant="secondary"
              className="h-11 w-full"
              onClick={addRow}
            >
              <Plus className="size-4" />
              {t("addTransaction.addRow")}
            </Button>
            <div className="flex flex-row gap-2 p-0">
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
            </div>
          </DsSheetActions>
        </form>
      </SheetContent>
    </Sheet>
  );
}
