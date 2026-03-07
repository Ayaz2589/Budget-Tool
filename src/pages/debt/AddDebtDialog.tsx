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
import type { Owner } from "@/types/core";
import {
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/format/currencyInput";
import {
  dateInputToIso,
  isoToDateInput,
} from "@/lib/format/dateInput";
import type { AddDebtPayload, AddDebtDialogProps } from "@/types/debt";
import { DsSheetActions, DsSheetHeader } from "@/components/ds";

export type { AddDebtPayload, AddDebtDialogProps };

export function AddDebtDialog({
  open,
  onOpenChange,
  owners = [],
  dateFormat = "YYYY/MM/DD",
  onSubmit,
}: AddDebtDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [owner, setOwner] = useState<Owner>(owners[0] ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseCurrencyInput(amount);
    if (Number.isNaN(num) || num < 0) return;
    const isoStartDate = startDate.trim()
      ? dateInputToIso(startDate, dateFormat)
      : undefined;
    if (startDate.trim() && !isoStartDate) return;
    onSubmit({
      name: name.trim() || t("debt.name"),
      initialAmount: num,
      startDate: isoStartDate || undefined,
      owner: owner || "",
    });
  };

  const fieldClass = "h-11 w-full min-w-0";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        desktopVariant="modal"
        desktopModalSize="compact"
        data-tour="debt-add-sheet"
        className="flex flex-col p-0 gap-0 overflow-hidden"
      >
        <DsSheetHeader
          title={t("debt.newDebt")}
          description={t("debt.newDebtDesc")}
          helpContent={t("debt.help.addSheet")}
          helpLabel={t("common.help")}
        />
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div className="flex-1 min-h-0 overflow-auto grid grid-cols-1 gap-4 content-start px-5 pt-3 pb-8">
            <div className="space-y-2">
              <Label>{t("debt.name")}</Label>
              <Input
                placeholder={t("debt.placeholderName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("debt.initialAmountOwed")}</Label>
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
              <Label>{t("debt.startDateOptional")}</Label>
              <DatePicker
                valueIso={dateInputToIso(startDate, dateFormat)}
                onChangeIso={(isoDate) => setStartDate(isoToDateInput(isoDate, dateFormat))}
                triggerLabel={startDate}
                placeholder={t("common.date")}
                triggerClassName={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.owner")}</Label>
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
            </div>
          </div>
          <DsSheetActions className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit">
              {t("debt.addDebt")}
            </Button>
          </DsSheetActions>
        </form>
      </SheetContent>
    </Sheet>
  );
}
