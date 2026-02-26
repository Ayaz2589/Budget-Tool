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
import { formatCurrencyInput } from "@/lib/format/currencyInput";
import { dateInputToIso, isoToDateInput } from "@/lib/format/dateInput";
import type { AddMortgagePaymentDialogProps } from "@/types/mortgage";
import { useTranslation } from "react-i18next";
import { DsSheetActions, DsSheetHeader } from "@/components/ds";

export type { AddMortgagePaymentDialogProps };

export function AddMortgagePaymentDialog({
  open,
  onOpenChange,
  dateFormat = "YYYY/MM/DD",
  date,
  onDateChange,
  amount,
  onAmountChange,
  owner,
  onOwnerChange,
  ownerOptions = [],
  onSubmit,
}: AddMortgagePaymentDialogProps) {
  const { t } = useTranslation();
  const fieldClass = "h-11 w-full min-w-0";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        desktopVariant="modal"
        desktopModalSize="standard"
        data-tour="mortgage-add-sheet"
        className="flex flex-col p-0 gap-0 overflow-hidden"
      >
        <DsSheetHeader
          title={t("mortgage.addMortgagePayment")}
          description={t("mortgage.addMortgagePaymentDesc")}
          helpContent={t("mortgage.help.addSheet")}
          helpLabel={t("common.help")}
        />
        <form
          onSubmit={onSubmit}
          className="flex flex-col flex-1 min-h-0 gap-4 overflow-hidden px-5 py-3"
        >
          <div className="flex-1 min-h-0 overflow-auto grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
            <div className="space-y-2">
              <Label>{t("common.date")}</Label>
              <DatePicker
                valueIso={dateInputToIso(date, dateFormat)}
                onChangeIso={(isoDate) => onDateChange(isoToDateInput(isoDate, dateFormat))}
                triggerLabel={date}
                placeholder={t("common.date")}
                triggerClassName={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.amount")}</Label>
              <Input
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={(e) => onAmountChange(formatCurrencyInput(e.target.value))}
                required
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.owner")}</Label>
              <Select
                value={owner || "_none"}
                onValueChange={(v) => onOwnerChange(v === "_none" ? "" : v)}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder={t("common.noOwner")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">{t("common.noOwner")}</SelectItem>
                  {ownerOptions.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DsSheetActions className="grid grid-cols-2 gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="w-full">
              {t("common.add")}
            </Button>
          </DsSheetActions>
        </form>
      </SheetContent>
    </Sheet>
  );
}
