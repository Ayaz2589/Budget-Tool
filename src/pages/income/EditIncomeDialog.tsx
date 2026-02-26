import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { CategoryOption } from "@/lib/format/categoryColors";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/format/currencyInput";
import {
  dateInputToIso,
  isoToDateInput,
} from "@/lib/format/dateInput";
import { useBudget } from "@/context";
import type { Owner } from "@/types/core";
import type {
  EditIncomeFormPayload,
  EditIncomeDialogProps,
} from "@/types/income";
import { DsCreatableSelect, DsSheetActions, DsSheetHeader } from "@/components/ds";

export type { EditIncomeFormPayload, EditIncomeDialogProps };

export function EditIncomeDialog({
  income,
  onClose,
  incomeCategories,
  owners = [],
  onSubmit,
}: EditIncomeDialogProps) {
  const { t } = useTranslation();
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [owner, setOwner] = useState<Owner>("");
  const { uiFormatSettings, setIncomeCategories, setOwners: setAllOwners } = useBudget();
  const fieldClass = "h-11 w-full min-w-0";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";
  useEffect(() => {
    if (income) {
      setDate(isoToDateInput(income.date, uiFormatSettings.dateFormat));
      setAmount(formatCurrencyFromNumber(income.amount));
      setDescription(income.description ?? "");
      setCategory(income.category ?? ""); // default: Uncategorized
      setOwner(income.owner ?? "");
    }
  }, [income, incomeCategories, owners, uiFormatSettings.dateFormat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!income) return;
    const num = parseCurrencyInput(amount);
    if (Number.isNaN(num) || num <= 0) return;
    const isoDate = dateInputToIso(date, uiFormatSettings.dateFormat);
    if (!isoDate) return;
    onSubmit(income.id, {
      date: isoDate,
      amount: num,
      description: description.trim() || t("income.defaultDescription"),
      category: category || "",
      owner: owner || "",
    });
  };

  return (
    <Sheet open={!!income} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        desktopVariant="modal"
        className="flex flex-col h-full w-[85vw] max-w-sm border-l p-0 gap-0 overflow-hidden rounded-l-2xl"
      >
        <DsSheetHeader
          title={t("income.editIncome")}
          description={t("income.editIncomeDesc")}
        />
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 gap-4 overflow-hidden px-4 py-3"
        >
          <div className="flex-1 min-h-0 overflow-auto space-y-4">
            <div className="space-y-2">
              <Label>{t("income.date")}</Label>
              <DatePicker
                valueIso={dateInputToIso(date, uiFormatSettings.dateFormat)}
                onChangeIso={(isoDate) =>
                  setDate(isoToDateInput(isoDate, uiFormatSettings.dateFormat))
                }
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
              <Label>{t("income.description")}</Label>
              <Input
                placeholder={t("income.placeholderDescription")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("income.category")}</Label>
              <DsCreatableSelect
                value={category || "_"}
                onValueChange={(v) => setCategory(v === "_" ? "" : v)}
                options={incomeCategories}
                onCreateNew={(name) => {
                  if (!incomeCategories.includes(name)) {
                    setIncomeCategories([...incomeCategories, name]);
                  }
                }}
                noneLabel={t("common.uncategorized")}
                noneValue="_"
                renderOption={(name) => <CategoryOption name={name} type="income" />}
                className={selectTriggerClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("income.owner")}</Label>
              <DsCreatableSelect
                value={owner || "_none"}
                onValueChange={(v) => setOwner(v === "_none" ? "" : v)}
                options={owners}
                onCreateNew={(name) => {
                  if (!owners.includes(name)) {
                    setAllOwners([...owners, name]);
                  }
                }}
                noneLabel={t("common.noOwner")}
                noneValue="_none"
                className={selectTriggerClass}
              />
            </div>
          </div>
          <DsSheetActions className="grid grid-cols-2 gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="w-full">
              {t("common.save")}
            </Button>
          </DsSheetActions>
        </form>
      </SheetContent>
    </Sheet>
  );
}
