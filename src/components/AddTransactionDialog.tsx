import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useBudget, usePresetTransactions } from "@/context";
import type { ExpenseSource, TransactionRow, AddTransactionDialogProps } from "@/types";
import {
  formatCurrencyFromNumber,
  parseCurrencyInput,
} from "@/lib/format/currencyInput";
import {
  dateInputToIso,
  isoToDateInput,
} from "@/lib/format/dateInput";
import {
  EXPENSE_SOURCE_LOCALE_KEYS,
} from "@/lib/format/sourceLabels";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Copy, Menu, Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  initialPresetId,
}: AddTransactionDialogProps) {
  const { t } = useTranslation();
  const {
    expenses,
    addExpense,
    addOwnerTransfer,
    expenseCategories,
    setExpenseCategories,
    cardSources,
    owners,
    setOwners,
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
      const defaultRow = createDefaultTransactionRow({
        defaultSource: fallback,
        dateValue: isoToDateInput(
          new Date().toISOString().slice(0, 10),
          uiFormatSettings.dateFormat,
        ),
      });
      if (initialPresetId) {
        const preset = presetTransactions.find((p) => p.id === initialPresetId);
        if (preset) {
          defaultRow.entryType = "expense";
          defaultRow.source = preset.source;
          defaultRow.description = preset.description;
          defaultRow.amount =
            typeof preset.amount === "number" && Number.isFinite(preset.amount)
              ? formatCurrencyFromNumber(preset.amount)
              : "";
          defaultRow.category = preset.category;
          defaultRow.owner = preset.owner;
          defaultRow.paidByOwner = preset.owner;
          defaultRow.presetId = preset.id;
        }
      }
      setRows([defaultRow]);
      setActiveRowIndex(0);
    }
  }, [open, cardSources, uiFormatSettings.dateFormat, initialPresetId, presetTransactions]);

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

  const fieldClass = "h-11 w-full min-w-0";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        desktopVariant="modal"
        desktopModalSize="wide"
        data-tour="transactions-add-sheet"
        className="flex flex-col p-0 gap-0 overflow-hidden"
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
          {/* Tab bar */}
          {(() => {
            const MAX_VISIBLE = 5;
            const visibleRows = rows.slice(0, MAX_VISIBLE);
            const overflowRows = rows.slice(MAX_VISIBLE);
            const activeInOverflow = activeRowIndex >= MAX_VISIBLE;

            function tabLabel(row: TransactionRow, index: number) {
              return row.description?.trim()
                ? `${index + 1}: ${row.description.slice(0, 12)}${row.description.length > 12 ? "…" : ""}`
                : `${t("addTransaction.transaction")} ${index + 1}`;
            }

            return (
              <div className="shrink-0 flex items-center gap-1.5 border-b border-[var(--border-subtle)] px-4 py-2">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  {visibleRows.map((row, index) => {
                    const isActive = activeRowIndex === index;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setActiveRowIndex(index)}
                        className={cn(
                          "group relative flex items-center gap-1.5 shrink-0 h-7 px-2.5 rounded-md text-xs font-medium transition-colors outline-none",
                          isActive
                            ? "bg-[var(--interactive-primary)] text-[var(--interactive-primary-foreground)]"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--control-hover)]",
                        )}
                      >
                        <span className="truncate max-w-[100px]">{tabLabel(row, index)}</span>
                        {rows.length > 1 && (
                          <span
                            role="button"
                            tabIndex={0}
                            className={cn(
                              "size-4 rounded-full flex items-center justify-center transition-opacity -mr-0.5",
                              isActive
                                ? "opacity-70 hover:opacity-100 hover:bg-white/20"
                                : "opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-[var(--control-active)]",
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRow(index);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                removeRow(index);
                              }
                            }}
                          >
                            <X className="size-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {overflowRows.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "shrink-0 h-7 px-2 rounded-md text-xs font-medium flex items-center gap-1 transition-colors",
                            activeInOverflow
                              ? "bg-[var(--interactive-primary)] text-[var(--interactive-primary-foreground)]"
                              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--control-hover)]",
                          )}
                        >
                          <Menu className="size-3" />
                          <span>+{overflowRows.length}</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-52 p-1 max-h-64 overflow-y-auto">
                        {overflowRows.map((row, i) => {
                          const globalIndex = MAX_VISIBLE + i;
                          const isActive = activeRowIndex === globalIndex;
                          return (
                            <div
                              key={row.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setActiveRowIndex(globalIndex)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setActiveRowIndex(globalIndex);
                                }
                              }}
                              className={cn(
                                "flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs cursor-pointer transition-colors",
                                isActive
                                  ? "bg-[var(--control-active)] text-[var(--text-primary)] font-medium"
                                  : "text-[var(--text-secondary)] hover:bg-[var(--control-hover)] hover:text-[var(--text-primary)]",
                              )}
                            >
                              <span className="truncate">{tabLabel(row, globalIndex)}</span>
                              <span
                                role="button"
                                tabIndex={0}
                                className="size-4 shrink-0 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-[var(--control-active)]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRow(globalIndex);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeRow(globalIndex);
                                  }
                                }}
                              >
                                <X className="size-2.5" />
                              </span>
                            </div>
                          );
                        })}
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    className="size-7 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--control-hover)] transition-colors"
                    onClick={() => copyRow(activeRowIndex)}
                    title={t("addTransaction.copyRow")}
                  >
                    <Copy className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="size-7 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--control-hover)] transition-colors"
                    onClick={addRow}
                    title={t("addTransaction.addRow")}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Active row form */}
          <div className="flex-1 min-h-0 overflow-auto px-4 md:px-5 py-4">
            {rows[activeRowIndex] && (
              <div>
                <TransactionFormRow
                  row={rows[activeRowIndex]}
                  onUpdate={(updates) => updateRow(activeRowIndex, updates)}
                  ownerOptions={ownerOptions}
                  cardSources={cardSources}
                  defaultSource={defaultSource}
                  expenseCategories={expenseCategories}
                  presetTransactions={presetTransactions}
                  sortedPresetTransactions={sortedPresetTransactions}
                  onPresetChange={(v) => handlePresetChange(activeRowIndex, v)}
                  dateFormat={uiFormatSettings.dateFormat}
                  fieldClass={fieldClass}
                  selectTriggerClass={selectTriggerClass}
                  onCreateCategory={(name) => {
                    if (!expenseCategories.includes(name)) {
                      setExpenseCategories([...expenseCategories, name]);
                    }
                  }}
                  onCreateOwner={(name) => {
                    if (!owners.includes(name)) {
                      setOwners([...owners, name]);
                    }
                  }}
                />
              </div>
            )}
          </div>

          <DsSheetActions className="shrink-0 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={validCount === 0}>
              {validCount === 0
                ? t("addTransaction.addTransaction")
                : validCount === 1
                ? t("addTransaction.addTransaction")
                : t("addTransaction.addTransactions", {
                    count: validCount,
                  })}
            </Button>
          </DsSheetActions>
        </form>
      </SheetContent>
    </Sheet>
  );
}
