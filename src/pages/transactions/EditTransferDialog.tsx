import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { parseCurrencyInput, formatCurrencyInput, formatCurrencyFromNumber } from "@/lib/format/currencyInput";
import { dateInputToIso, isoToDateInput } from "@/lib/format/dateInput";
import { useBudget } from "@/context";
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

  const fieldClass = "h-11 w-full min-w-0";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";

  return (
    <Sheet open={transfer !== null} onOpenChange={(open) => !open && onClose()}>
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
          <div className="space-y-2">
            <Label>{t("transactions.transferFrom")}</Label>
            <Select value={fromOwner || "_none"} onValueChange={(v) => setFromOwner(v === "_none" ? "" : v)}>
              <SelectTrigger className={selectTriggerClass}>
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
              <SelectTrigger className={selectTriggerClass}>
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
          <div className="space-y-2 md:col-span-2">
            <Label>{t("transactions.transferNote")}</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} className={fieldClass} />
          </div>
          {fromOwner && toOwner && fromOwner === toOwner ? (
            <p className="text-xs text-destructive md:col-span-2">{t("transactions.transferValidationOwnersDifferent")}</p>
          ) : null}
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
