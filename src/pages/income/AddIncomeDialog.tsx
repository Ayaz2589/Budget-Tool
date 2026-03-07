import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
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
import { CategoryOption } from "@/lib/format/categoryColors";
import {
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/format/currencyInput";
import {
  dateInputToIso,
  isoToDateInput,
} from "@/lib/format/dateInput";
import type { Owner } from "@/types/core";
import type {
  AddIncomeFormPayload,
  AddIncomeDialogProps,
} from "@/types/income";
import { useBudget } from "@/context";
import { DsCreatableSelect, DsSheetActions, DsSheetHeader } from "@/components/ds";

export type { AddIncomeFormPayload, AddIncomeDialogProps };

export function AddIncomeDialog({
  open,
  onOpenChange,
  incomeCategories,
  owners = [],
  dateFormat = "YYYY/MM/DD",
  onSubmit,
}: AddIncomeDialogProps) {
  const { t } = useTranslation();
  const { setIncomeCategories, setOwners } = useBudget();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        desktopVariant="modal"
        desktopModalSize="compact"
        data-tour="income-add-sheet"
        className="flex flex-col p-0 gap-0 overflow-hidden"
      >
        <DsSheetHeader
          title={t("income.newIncome")}
          description={t("income.newIncomeDesc")}
          helpContent={t("income.help.addSheet")}
          helpLabel={t("common.help")}
        />
        <AddIncomeForm
          incomeCategories={incomeCategories}
          owners={owners}
          dateFormat={dateFormat}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          onCreateCategory={(name) => {
            if (!incomeCategories.includes(name)) {
              setIncomeCategories([...incomeCategories, name]);
            }
          }}
          onCreateOwner={(name) => {
            if (!owners.includes(name)) {
              setOwners([...owners, name]);
            }
          }}
          t={t}
        />
      </SheetContent>
    </Sheet>
  );
}

function AddIncomeForm({
  incomeCategories,
  owners = [],
  dateFormat = "YYYY/MM/DD",
  onSubmit,
  onCancel,
  onCreateCategory,
  onCreateOwner,
  t,
}: {
  incomeCategories: string[];
  owners?: string[];
  dateFormat?: "YYYY/MM/DD" | "MM/DD/YYYY";
  onSubmit: (payload: AddIncomeFormPayload) => void;
  onCancel: () => void;
  onCreateCategory?: (name: string) => void;
  onCreateOwner?: (name: string) => void;
  t: (key: string) => string;
}) {
  const [date, setDate] = useState(() =>
    isoToDateInput(new Date().toISOString().slice(0, 10), dateFormat)
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(""); // default: Uncategorized
  const [owner, setOwner] = useState<Owner>(owners[0] ?? "");
  const fieldClass = "h-11 w-full min-w-0";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseCurrencyInput(amount);
    if (Number.isNaN(num) || num <= 0) return;
    const isoDate = dateInputToIso(date, dateFormat);
    if (!isoDate) return;
    onSubmit({
      date: isoDate,
      amount: num,
      description: description.trim() || t("income.defaultDescription"),
      category: category || "",
      owner: owner || "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
    >
      <div className="flex-1 min-h-0 overflow-auto grid grid-cols-1 gap-4 content-start px-5 pt-3 pb-8">
        <div className="space-y-2">
          <Label>{t("income.date")}</Label>
          <DatePicker
            valueIso={dateInputToIso(date, dateFormat)}
            onChangeIso={(isoDate) => setDate(isoToDateInput(isoDate, dateFormat))}
            triggerLabel={date}
            placeholder={t("income.date")}
            triggerClassName={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("income.amount")}</Label>
          <Input
            type="text"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
            required
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("income.category")}</Label>
          {onCreateCategory ? (
            <DsCreatableSelect
              value={category || "_"}
              onValueChange={(v) => setCategory(v === "_" ? "" : v)}
              options={incomeCategories}
              onCreateNew={onCreateCategory}
              noneLabel={t("common.uncategorized")}
              noneValue="_"
              renderOption={(name) => <CategoryOption name={name} type="income" />}
              className={selectTriggerClass}
            />
          ) : (
            <Select
              value={category || "_"}
              onValueChange={(v) => setCategory(v === "_" ? "" : v)}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_">
                  <CategoryOption name={t("common.uncategorized")} type="income" />
                </SelectItem>
                {incomeCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    <CategoryOption name={c} type="income" />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("income.owner")}</Label>
          {onCreateOwner ? (
            <DsCreatableSelect
              value={owner || "_none"}
              onValueChange={(v) => setOwner(v === "_none" ? "" : v)}
              options={owners}
              onCreateNew={onCreateOwner}
              noneLabel={t("common.noOwner")}
              noneValue="_none"
              className={selectTriggerClass}
            />
          ) : (
            <Select
              value={owner || "_none"}
              onValueChange={(v) => setOwner(v === "_none" ? "" : v)}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t("common.noOwner")}</SelectItem>
                {owners.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("income.description")}</Label>
          <Input
            placeholder={t("income.placeholderDescription")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>
      <DsSheetActions className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit">
          {t("common.add")}
        </Button>
      </DsSheetActions>
    </form>
  );
}
