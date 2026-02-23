import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/format/currencyInput";
import {
  dateInputToIso,
  isoToDateInput,
} from "@/lib/format/dateInput";
import { useBudget } from "@/context";
import type { AddPaymentPayload, AddPaymentDialogProps } from "@/types/debt";

export type { AddPaymentPayload, AddPaymentDialogProps };

export function AddPaymentDialog({
  open,
  debtId,
  onClose,
  onSubmit,
}: AddPaymentDialogProps) {
  const { t } = useTranslation();
  const { uiFormatSettings } = useBudget();
  const [date, setDate] = useState(() =>
    isoToDateInput(new Date().toISOString().slice(0, 10), uiFormatSettings.dateFormat)
  );
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setDate(
        isoToDateInput(new Date().toISOString().slice(0, 10), uiFormatSettings.dateFormat)
      );
      setAmount("");
      setNote("");
    }
  }, [open, uiFormatSettings.dateFormat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtId) return;
    const num = parseCurrencyInput(amount);
    if (Number.isNaN(num) || num <= 0) return;
    const isoDate = dateInputToIso(date, uiFormatSettings.dateFormat);
    if (!isoDate) return;
    onSubmit({
      debtId,
      date: isoDate,
      amount: num,
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("debt.makePaymentTitle")}</DialogTitle>
          <DialogDescription>{t("debt.makePaymentDesc")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t("debt.noteOptional")}</Label>
            <Input
              placeholder={t("debt.placeholderNote")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">{t("debt.addPayment")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
