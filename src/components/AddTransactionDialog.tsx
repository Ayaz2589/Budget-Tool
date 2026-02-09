import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import { usePresetTransactions } from "@/context/PresetTransactionsContext";
import type { ExpenseAllocation, ExpenseSource } from "@/types/core";
import type {
  TransactionRow,
  AddTransactionDialogProps,
} from "@/types/transactions";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/currencyInput";
import {
  dateInputToIso,
  formatDateInput,
  getDateInputPlaceholder,
  isoToDateInput,
} from "@/lib/dateInput";
import { EXPENSE_SOURCE_LOCALE_KEYS } from "@/lib/sourceLabels";
import { SourceIcon } from "@/components/cards";
import { CategoryOption, getCategoryColor } from "@/lib/categoryColors";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronDown, Copy, Plus, Trash2 } from "lucide-react";
import { DsSheetActions, DsSheetHeader } from "@/components/ds";

function defaultRow(
  defaultSource: ExpenseSource = "manual",
  dateValue: string = new Date().toISOString().slice(0, 10)
): TransactionRow {
  return {
    id: crypto.randomUUID(),
    entryType: "expense",
    date: dateValue,
    amount: "",
    description: "",
    category: "", // default: Uncategorized (empty string; UI shows "_" in Select)
    source: defaultSource,
    owner: "",
    paidByOwner: "",
    allocationMode: "single",
    allocationOwners: [],
    allocationPercents: {},
    transferFromOwner: "",
    transferToOwner: "",
    transferNote: "",
  };
}

function parsePercentValue(raw: string): number | null {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function uniqueOwners(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function buildAllocationForRow(
  row: TransactionRow,
  paidByOwner: string,
  ownerOptions: string[],
): ExpenseAllocation[] | undefined {
  if (row.allocationMode === "single") {
    const owner = (row.allocationOwners[0] || paidByOwner || "").trim();
    return owner ? [{ owner, percent: 100 }] : undefined;
  }

  if (row.allocationMode === "equal") {
    const selectedOwners = uniqueOwners(row.allocationOwners);
    const fallbackOwners = uniqueOwners(ownerOptions);
    const effectiveOwners =
      selectedOwners.length >= 2
        ? selectedOwners
        : fallbackOwners.length >= 2
          ? fallbackOwners
          : selectedOwners;
    if (effectiveOwners.length === 0) return undefined;
    const percent = 100 / effectiveOwners.length;
    return effectiveOwners.map((owner) => ({ owner, percent }));
  }

  const owners = uniqueOwners(row.allocationOwners);
  const customAllocation: ExpenseAllocation[] = [];
  for (const owner of owners) {
    const percent = parsePercentValue(row.allocationPercents[owner] ?? "");
    if (percent == null) continue;
    customAllocation.push({ owner, percent });
  }

  return customAllocation.length > 0 ? customAllocation : undefined;
}

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
    defaultRow(
      defaultSource,
      isoToDateInput(new Date().toISOString().slice(0, 10), uiFormatSettings.dateFormat)
    ),
  ]);
  const [activeRowIndex, setActiveRowIndex] = useState(0);

  useEffect(() => {
    if (open) {
      const fallback = (cardSources[0] as ExpenseSource) ?? "manual";
      setRows([
        defaultRow(
          fallback,
          isoToDateInput(new Date().toISOString().slice(0, 10), uiFormatSettings.dateFormat)
        ),
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
          .filter((m): m is string => !!m)
      ),
    ].sort();
    return fromExpenses;
  }, [owners, expenses]);

  const sortedPresetTransactions = useMemo(() => {
    return [...presetTransactions].sort((a, b) => {
      const categoryA = (a.category || "").trim().toLowerCase();
      const categoryB = (b.category || "").trim().toLowerCase();
      const categoryCompare = categoryA.localeCompare(categoryB);
      if (categoryCompare !== 0) return categoryCompare;

      const descriptionA = (a.description || "").trim().toLowerCase();
      const descriptionB = (b.description || "").trim().toLowerCase();
      const descriptionCompare = descriptionA.localeCompare(descriptionB);
      if (descriptionCompare !== 0) return descriptionCompare;

      return a.id.localeCompare(b.id);
    });
  }, [presetTransactions]);

  const updateRow = (index: number, updates: Partial<TransactionRow>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...updates } : r))
    );
  };

  const addRow = () => {
    setRows((prev) => {
      const next = [
        ...prev,
        defaultRow(
          defaultSource,
          isoToDateInput(new Date().toISOString().slice(0, 10), uiFormatSettings.dateFormat)
        ),
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
      const allocation = buildAllocationForRow(row, paidByOwner, ownerOptions);
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
        defaultRow(
          defaultSource,
          isoToDateInput(new Date().toISOString().slice(0, 10), uiFormatSettings.dateFormat)
        ),
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
  const sheetSide = "right";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={sheetSide}
       
        className="flex flex-col h-full w-[90vw] max-w-md border-l p-0 gap-0 overflow-hidden rounded-l-2xl md:w-[720px] md:max-w-[720px]"
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
                  index % 2 === 1 ? "bg-muted/20" : "bg-background"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/60">
                  <div className="space-y-0.5 md:col-span-2">
                    <div className="text-xs text-muted-foreground">
                      {t("transactions.type")}
                    </div>
                    <Select
                      value={row.entryType}
                      onValueChange={(value) =>
                        updateRow(index, {
                          entryType: value as "expense" | "owner-transfer",
                        })
                      }
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">
                          {t("transactions.typeExpense")}
                        </SelectItem>
                        <SelectItem value="owner-transfer">
                          {t("transactions.typeTransfer")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {row.entryType === "owner-transfer" ? (
                    <>
                      <div className="space-y-0.5">
                        <div className="text-xs text-muted-foreground">
                          {t("addTransaction.date")}
                        </div>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder={getDateInputPlaceholder(uiFormatSettings.dateFormat)}
                          maxLength={10}
                          className={fieldClass}
                          value={row.date}
                          onChange={(e) =>
                            updateRow(index, {
                              date: formatDateInput(
                                e.target.value,
                                uiFormatSettings.dateFormat
                              ),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs text-muted-foreground">
                          {t("addTransaction.amount")}
                        </div>
                        <Input
                          type="text"
                          placeholder={t("addTransaction.placeholderAmount")}
                          className={fieldClass}
                          value={row.amount}
                          onChange={(e) =>
                            updateRow(index, {
                              amount: formatCurrencyInput(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs text-muted-foreground">
                          {t("transactions.transferFrom")}
                        </div>
                        <Select
                          value={row.transferFromOwner || "_none"}
                          onValueChange={(value) =>
                            updateRow(index, {
                              transferFromOwner: value === "_none" ? "" : value,
                            })
                          }
                        >
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue placeholder={t("common.noOwner")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">{t("common.noOwner")}</SelectItem>
                            {ownerOptions.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs text-muted-foreground">
                          {t("transactions.transferTo")}
                        </div>
                        <Select
                          value={row.transferToOwner || "_none"}
                          onValueChange={(value) =>
                            updateRow(index, {
                              transferToOwner: value === "_none" ? "" : value,
                            })
                          }
                        >
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue placeholder={t("common.noOwner")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">{t("common.noOwner")}</SelectItem>
                            {ownerOptions.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-0.5 md:col-span-2">
                        <div className="text-xs text-muted-foreground">
                          {t("transactions.transferNote")}
                        </div>
                        <Input
                          placeholder={t("common.note")}
                          className={fieldClass}
                          value={row.transferNote}
                          onChange={(e) =>
                            updateRow(index, { transferNote: e.target.value })
                          }
                        />
                      </div>
                      {row.transferFromOwner &&
                      row.transferToOwner &&
                      row.transferFromOwner === row.transferToOwner ? (
                        <p className="md:col-span-2 text-xs text-destructive">
                          {t("transactions.transferValidationOwnersDifferent")}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <>
                  {presetTransactions.length > 0 &&
                    expenseCategories.length > 0 && (
                      <div className="space-y-0.5 md:col-span-2">
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
                            {sortedPresetTransactions.map((preset) => {
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

                  <div className="space-y-0.5">
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

                  <div className="space-y-0.5">
                    <div className="text-xs text-muted-foreground">
                      {t("addTransaction.date")}
                    </div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder={getDateInputPlaceholder(uiFormatSettings.dateFormat)}
                      maxLength={10}
                      className={fieldClass}
                      value={row.date}
                      onChange={(e) =>
                        updateRow(index, {
                          date: formatDateInput(
                            e.target.value,
                            uiFormatSettings.dateFormat
                          ),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs text-muted-foreground">
                      {t("addTransaction.amount")}
                    </div>
                    <Input
                      type="text"
                      placeholder={t("addTransaction.placeholderAmount")}
                      className={fieldClass}
                      value={row.amount}
                      onChange={(e) =>
                        updateRow(index, {
                          amount: formatCurrencyInput(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-0.5">
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

                  <div className="space-y-0.5 md:col-span-2">
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

                  <div className="space-y-0.5">
                    <div className="text-xs text-muted-foreground">
                      {t("addTransaction.paidBy")}
                    </div>
                    <Select
                      value={row.paidByOwner || "_none"}
                      onValueChange={(v) => {
                        const nextOwner = v === "_none" ? "" : v;
                        const nextAllocationOwners =
                          row.allocationMode === "single" && nextOwner
                            ? [nextOwner]
                            : row.allocationOwners;
                        updateRow(index, {
                          owner: nextOwner,
                          paidByOwner: nextOwner,
                          allocationOwners: nextAllocationOwners,
                        });
                      }}
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder={t("common.noOwner")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">{t("common.noOwner")}</SelectItem>
                        {ownerOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs text-muted-foreground">
                      {t("addTransaction.splitMode")}
                    </div>
                    <Select
                      value={row.allocationMode}
                      onValueChange={(value) => {
                        const nextMode = value as "single" | "equal" | "custom";
                        const paidByOwner = row.paidByOwner || row.owner;
                        const defaultOwners =
                          nextMode === "single"
                            ? [paidByOwner || row.allocationOwners[0] || ownerOptions[0] || ""].filter(Boolean)
                            : nextMode === "equal"
                              ? ownerOptions.length > 0
                                ? ownerOptions
                                : row.allocationOwners
                              : row.allocationOwners.length > 0
                                ? row.allocationOwners
                                : paidByOwner
                                  ? [paidByOwner]
                                  : ownerOptions.slice(0, 2);
                        updateRow(index, {
                          allocationMode: nextMode,
                          allocationOwners: uniqueOwners(defaultOwners),
                        });
                      }}
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">{t("addTransaction.splitSingle")}</SelectItem>
                        <SelectItem value="equal">{t("addTransaction.splitEqual")}</SelectItem>
                        <SelectItem value="custom">{t("addTransaction.splitCustom")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {row.allocationMode === "single" ? (
                    <div className="space-y-0.5 md:col-span-2">
                      <div className="text-xs text-muted-foreground">
                        {t("addTransaction.splitOwner")}
                      </div>
                      <Select
                        value={row.allocationOwners[0] || "_none"}
                        onValueChange={(value) =>
                          updateRow(index, {
                            allocationOwners: value === "_none" ? [] : [value],
                          })
                        }
                      >
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue placeholder={t("common.noOwner")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">{t("common.noOwner")}</SelectItem>
                          {ownerOptions.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-1 md:col-span-2">
                      <div className="text-xs text-muted-foreground">
                        {t("addTransaction.splitOwners")}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ownerOptions.map((name) => {
                          const isSelected = row.allocationOwners.includes(name);
                          return (
                            <Button
                              key={name}
                              type="button"
                              variant={isSelected ? "secondary" : "outline"}
                              className="h-8 rounded-full px-3 text-xs"
                              onClick={() => {
                                const next = isSelected
                                  ? row.allocationOwners.filter((value) => value !== name)
                                  : [...row.allocationOwners, name];
                                updateRow(index, {
                                  allocationOwners: uniqueOwners(next),
                                });
                              }}
                            >
                              {name}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {row.allocationMode === "custom" ? (
                    <div className="space-y-2 md:col-span-2">
                      <div className="text-xs text-muted-foreground">
                        {t("addTransaction.customSplitHint")}
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {row.allocationOwners.map((name) => (
                          <div key={name} className="space-y-0.5">
                            <div className="text-xs text-muted-foreground">{name}</div>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              className={fieldClass}
                              value={row.allocationPercents[name] ?? ""}
                              onChange={(event) =>
                                updateRow(index, {
                                  allocationPercents: {
                                    ...row.allocationPercents,
                                    [name]: event.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                    </>
                  )}
                </div>
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
