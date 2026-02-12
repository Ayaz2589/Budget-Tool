import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { parseCurrencyInput, formatCurrencyInput, formatCurrencyFromNumber } from "@/lib/currencyInput";
import { dateInputToIso, isoToDateInput } from "@/lib/dateInput";
import { useBudget } from "@/context/BudgetContext";
import type { EditTransferDialogProps } from "@/types/transactions";
import { DsSheetActions, DsSheetHeader } from "@/components/ds";

export function EditTransferDialog({
  transfer,
  onClose,
  onSubmit,
  ownerOptions,
  t,
}: EditTransferDialogProps) {
  const { uiFormatSettings } = useBudget();
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [fromOwner, setFromOwner] = useState("");
  const [toOwner, setToOwner] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!transfer) return;
    setDate(isoToDateInput(transfer.date, uiFormatSettings.dateFormat));
    setAmount(formatCurrencyFromNumber(transfer.amount));
    setFromOwner(transfer.fromOwner);
    setToOwner(transfer.toOwner);
    setNote(transfer.note || "");
  }, [transfer, uiFormatSettings.dateFormat]);

  const handleSave = () => {
    if (!transfer) return;
    const parsed = parseCurrencyInput(amount);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    const isoDate = dateInputToIso(date, uiFormatSettings.dateFormat);
    if (!isoDate) return;
    const from = fromOwner.trim();
    const to = toOwner.trim();
    if (!from || !to || from === to) return;
    onSubmit(transfer.id, {
      date: isoDate,
      amount: parsed,
      fromOwner: from,
      toOwner: to,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <Sheet open={transfer !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={true}
        className="h-full w-[85vw] max-w-sm border-l p-0 gap-0 rounded-l-2xl overflow-y-auto"
      >
        <DsSheetHeader title={t("common.edit")} />
        <div className="grid gap-4 px-4 pt-4 pb-6 overflow-y-auto">
          <div className="space-y-2">
            <Label>{t("common.date")}</Label>
            <DatePicker
              valueIso={dateInputToIso(date, uiFormatSettings.dateFormat)}
              onChangeIso={(isoDate) =>
                setDate(isoToDateInput(isoDate, uiFormatSettings.dateFormat))
              }
              triggerLabel={date}
              placeholder={t("common.date")}
              triggerClassName="h-11 w-full"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("common.amount")}</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("transactions.transferFrom")}</Label>
            <Select value={fromOwner || "_none"} onValueChange={(v) => setFromOwner(v === "_none" ? "" : v)}>
              <SelectTrigger className="h-11 w-full data-[size=default]:h-11">
                <SelectValue placeholder={t("common.noOwner")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t("common.noOwner")}</SelectItem>
                {ownerOptions.map((owner) => (
                  <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("transactions.transferTo")}</Label>
            <Select value={toOwner || "_none"} onValueChange={(v) => setToOwner(v === "_none" ? "" : v)}>
              <SelectTrigger className="h-11 w-full data-[size=default]:h-11">
                <SelectValue placeholder={t("common.noOwner")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t("common.noOwner")}</SelectItem>
                {ownerOptions.map((owner) => (
                  <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("transactions.transferNote")}</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} className="h-11" />
          </div>
          {fromOwner && toOwner && fromOwner === toOwner ? (
            <p className="text-xs text-destructive">{t("transactions.transferValidationOwnersDifferent")}</p>
          ) : null}
        </div>
        <DsSheetActions>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" density="compact" className="h-11 w-full" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="button" density="compact" className="h-11 w-full" onClick={handleSave}>
              {t("common.save")}
            </Button>
          </div>
        </DsSheetActions>
      </SheetContent>
    </Sheet>
  );
}
