import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrencyInput } from "@/lib/currencyInput";
import { formatDateInput, getDateInputPlaceholder } from "@/lib/dateInput";
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
        className="flex flex-col h-full w-[85vw] max-w-sm border-l p-0 gap-0 overflow-hidden rounded-l-2xl"
      >
        <DsSheetHeader
          title={t("mortgage.addMortgagePayment")}
          description={t("mortgage.addMortgagePaymentDesc")}
        />
        <form
          onSubmit={onSubmit}
          className="flex flex-col flex-1 min-h-0 gap-4 overflow-hidden px-4 py-3"
        >
          <div className="flex-1 min-h-0 overflow-auto space-y-4">
            <div className="space-y-2">
              <Label>{t("common.date")}</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder={getDateInputPlaceholder(dateFormat)}
                maxLength={10}
                value={date}
                onChange={(e) =>
                  onDateChange(formatDateInput(e.target.value, dateFormat))
                }
                required
                className={fieldClass}
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
              className="h-11 w-full"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="h-11 w-full">
              {t("common.add")}
            </Button>
          </DsSheetActions>
        </form>
      </SheetContent>
    </Sheet>
  );
}
