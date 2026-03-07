import { useEffect, useMemo, useState } from "react";
import type { ExpenseSource } from "@/types/core";
import type { EditTransactionDialogProps } from "@/types/transactions";
import {
  EXPENSE_SOURCE_BADGE_LABELS,
  EXPENSE_SOURCE_LOCALE_KEYS,
} from "@/lib/format/sourceLabels";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/format/currencyInput";
import {
  dateInputToIso,
  isoToDateInput,
} from "@/lib/format/dateInput";
import { CategoryOption } from "@/lib/format/categoryColors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context";
import { DsCreatableSelect, DsSheetActions, DsSheetHeader } from "@/components/ds";

function parsePercentValue(raw: string): number | null {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function uniqueOwners(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function EditTransactionDialog({
  expense,
  onClose,
  onSubmit,
  expenseCategories,
  ownerOptions,
  cardSources,
}: EditTransactionDialogProps) {
  const { t } = useTranslation();
  const { uiFormatSettings, setExpenseCategories, owners: allOwners, setOwners } = useBudget();
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState<ExpenseSource>("manual");
  const [owner, setOwner] = useState("");
  const [paidByOwner, setPaidByOwner] = useState("");
  const [allocationMode, setAllocationMode] = useState<
    "single" | "equal" | "custom"
  >("single");
  const [allocationOwners, setAllocationOwners] = useState<string[]>([]);
  const [allocationPercents, setAllocationPercents] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    if (!expense) return;
    setDate(isoToDateInput(expense.date, uiFormatSettings.dateFormat));
    setAmount(formatCurrencyFromNumber(expense.amount));
    setDescription(expense.description ?? "");
    setCategory(expense.category ?? "");
    setSource(expense.source);
    setOwner(expense.owner ?? "");
    const nextPaidByOwner = expense.paidByOwner ?? expense.owner ?? "";
    setPaidByOwner(nextPaidByOwner);
    const nextAllocationMode = expense.allocationMode ?? "single";
    setAllocationMode(nextAllocationMode);
    const nextAllocationOwners =
      expense.allocation && expense.allocation.length > 0
        ? uniqueOwners(expense.allocation.map((row) => row.owner))
        : nextPaidByOwner
          ? [nextPaidByOwner]
          : [];
    setAllocationOwners(nextAllocationOwners);
    const nextPercents = (expense.allocation ?? []).reduce<Record<string, string>>(
      (acc, row) => {
        if (row.percent != null && Number.isFinite(row.percent)) {
          acc[row.owner] = String(row.percent);
        }
        return acc;
      },
      {},
    );
    setAllocationPercents(nextPercents);
  }, [expense, uiFormatSettings.dateFormat]);

  const effectiveSource = useMemo<ExpenseSource>(() => {
    if (cardSources.includes(source)) return source;
    return (cardSources[0] as ExpenseSource) ?? "manual";
  }, [cardSources, source]);

  const handleSave = () => {
    if (!expense) return;
    const parsed = parseCurrencyInput(amount);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    const isoDate = dateInputToIso(date, uiFormatSettings.dateFormat);
    if (!isoDate) return;
    const normalizedPaidBy = paidByOwner.trim() || owner.trim();
    const normalizedAllocationOwners = uniqueOwners(allocationOwners);
    const effectiveEqualOwners =
      normalizedAllocationOwners.length >= 2
        ? normalizedAllocationOwners
        : ownerOptions.length >= 2
          ? uniqueOwners(ownerOptions)
          : normalizedAllocationOwners;
    const allocation =
      allocationMode === "single"
        ? (() => {
            const targetOwner = normalizedAllocationOwners[0] || normalizedPaidBy;
            return targetOwner ? [{ owner: targetOwner, percent: 100 }] : undefined;
          })()
        : allocationMode === "equal"
          ? effectiveEqualOwners.length > 0
            ? effectiveEqualOwners.map((entryOwner) => ({
                owner: entryOwner,
                percent: 100 / effectiveEqualOwners.length,
              }))
            : undefined
          : (() => {
              const rows = normalizedAllocationOwners
                .map((entryOwner) => {
                  const percent = parsePercentValue(
                    allocationPercents[entryOwner] ?? "",
                  );
                  if (percent == null) return null;
                  return { owner: entryOwner, percent };
                })
                .filter(
                  (entry): entry is { owner: string; percent: number } =>
                    entry !== null,
                );
              return rows.length > 0 ? rows : undefined;
            })();
    onSubmit(expense.id, {
      date: isoDate,
      amount: parsed,
      description: description.trim(),
      category,
      source: effectiveSource,
      owner: normalizedPaidBy || undefined,
      paidByOwner: normalizedPaidBy || undefined,
      allocationMode,
      allocation,
    });
    onClose();
  };

  const fieldClass = "h-11 w-full min-w-0";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";

  return (
    <Sheet open={expense !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        desktopVariant="modal"
        desktopModalSize="standard"
        showCloseButton={true}
        className="flex flex-col p-0 gap-0 overflow-hidden"
      >
        <DsSheetHeader title={t("common.edit")} />
        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 px-5 pt-4 pb-8 content-start">
          <div className="space-y-2">
            <Label>{t("common.date")}</Label>
            <DatePicker
              valueIso={dateInputToIso(date, uiFormatSettings.dateFormat)}
              onChangeIso={(isoDate) =>
                setDate(isoToDateInput(isoDate, uiFormatSettings.dateFormat))
              }
              triggerLabel={date}
              placeholder={t("common.date")}
              triggerClassName={fieldClass}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("common.amount")}</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
              className={fieldClass}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>{t("common.description")}</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("common.source")}</Label>
            <Select
              value={effectiveSource}
              onValueChange={(v) => setSource(v as ExpenseSource)}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cardSources.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center rounded-md bg-muted text-[10px] px-2 py-0.5 text-muted-foreground">
                        {EXPENSE_SOURCE_BADGE_LABELS[s as ExpenseSource]}
                      </span>
                      {t(
                        `addTransaction.${
                          EXPENSE_SOURCE_LOCALE_KEYS[s as ExpenseSource]
                        }`,
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("common.category")}</Label>
            <DsCreatableSelect
              value={category || "_"}
              onValueChange={(v) => setCategory(v === "_" ? "" : v)}
              options={expenseCategories}
              onCreateNew={(name) => {
                if (!expenseCategories.includes(name)) {
                  setExpenseCategories([...expenseCategories, name]);
                }
              }}
              noneLabel={t("common.uncategorized")}
              noneValue="_"
              renderOption={(name) => <CategoryOption name={name} type="expense" />}
              className={selectTriggerClass}
            />
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>{t("addTransaction.paidBy")}</Label>
            <DsCreatableSelect
              value={paidByOwner || "_none"}
              onValueChange={(v) => {
                const nextOwner = v === "_none" ? "" : v;
                setOwner(nextOwner);
                setPaidByOwner(nextOwner);
                if (allocationMode === "single" && nextOwner) {
                  setAllocationOwners([nextOwner]);
                }
              }}
              options={ownerOptions}
              onCreateNew={(name) => {
                if (!allOwners.includes(name)) {
                  setOwners([...allOwners, name]);
                }
              }}
              noneLabel={t("common.noOwner")}
              noneValue="_none"
              className={selectTriggerClass}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("addTransaction.splitMode")}</Label>
            <Select
              value={allocationMode}
              onValueChange={(value) => {
                const nextMode = value as "single" | "equal" | "custom";
                setAllocationMode(nextMode);
                if (nextMode === "single" && allocationOwners.length === 0) {
                  const defaultOwner = paidByOwner || ownerOptions[0] || "";
                  setAllocationOwners(defaultOwner ? [defaultOwner] : []);
                  return;
                }
                if (nextMode === "equal") {
                  if (ownerOptions.length > 0) {
                    setAllocationOwners(uniqueOwners(ownerOptions));
                  }
                }
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

          {allocationMode === "single" ? (
            <div className="space-y-2">
              <Label>{t("addTransaction.splitOwner")}</Label>
              <Select
                value={allocationOwners[0] || "_none"}
                onValueChange={(value) =>
                  setAllocationOwners(value === "_none" ? [] : [value])
                }
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">{t("common.noOwner")}</SelectItem>
                  {ownerOptions.map((entryOwner) => (
                    <SelectItem key={entryOwner} value={entryOwner}>
                      {entryOwner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2 md:col-span-2">
              <Label>{t("addTransaction.splitOwners")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {ownerOptions.map((entryOwner) => {
                  const isSelected = allocationOwners.includes(entryOwner);
                  return (
                    <Button
                      key={entryOwner}
                      type="button"
                      variant={isSelected ? "secondary" : "outline"}
                      className="h-8 rounded-full px-3 text-xs"
                      onClick={() =>
                        setAllocationOwners((prev) =>
                          isSelected
                            ? prev.filter((value) => value !== entryOwner)
                            : uniqueOwners([...prev, entryOwner]),
                        )
                      }
                    >
                      {entryOwner}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {allocationMode === "custom" && allocationOwners.length > 0 ? (
            <div className="space-y-2 md:col-span-3">
              <Label>{t("addTransaction.customSplitHint")}</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {allocationOwners.map((entryOwner) => (
                  <div key={entryOwner} className="space-y-1">
                    <span className="text-xs text-muted-foreground">{entryOwner}</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      className={fieldClass}
                      value={allocationPercents[entryOwner] ?? ""}
                      onChange={(event) =>
                        setAllocationPercents((prev) => ({
                          ...prev,
                          [entryOwner]: event.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          </div>
        </div>
        <DsSheetActions className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleSave}>
            {t("common.save")}
          </Button>
        </DsSheetActions>
      </SheetContent>
    </Sheet>
  );
}
