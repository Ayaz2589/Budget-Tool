import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Debt } from "@/lib/types";

type RecurringFrequency = "monthly" | "biweekly";

export type EditRecurringPayload = {
  recurringAmount: number;
  recurringFrequency: RecurringFrequency;
  recurringDayOfMonth?: number;
  recurringStartDate?: string;
};

export type EditRecurringDialogProps = {
  open: boolean;
  debt: Debt | null;
  onClose: () => void;
  onSave: (payload: EditRecurringPayload) => void;
  onClear: () => void;
};

export function EditRecurringDialog({
  open,
  debt,
  onClose,
  onSave,
  onClear,
}: EditRecurringDialogProps) {
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("biweekly");
  const [day, setDay] = useState("1");
  const [startDate, setStartDate] = useState("");

  useEffect(() => {
    if (debt) {
      setAmount(
        debt.recurringAmount != null ? String(debt.recurringAmount) : "",
      );
      setFrequency(
        debt.recurringFrequency === "biweekly" ? "biweekly" : "monthly",
      );
      setDay(
        debt.recurringDayOfMonth != null
          ? String(debt.recurringDayOfMonth)
          : "1",
      );
      setStartDate(debt.recurringStartDate ?? "");
    }
  }, [debt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debt) return;
    const amountNum = parseFloat(amount.replace(/[$,]/g, ""));
    const dayNum = parseInt(day, 10);
    const startDateTrimmed = startDate.trim() || undefined;
    if (!Number.isNaN(amountNum) && amountNum > 0) {
      if (frequency === "biweekly" && startDateTrimmed) {
        onSave({
          recurringAmount: amountNum,
          recurringFrequency: "biweekly",
          recurringStartDate: startDateTrimmed,
        });
      } else if (frequency === "monthly" && dayNum >= 1 && dayNum <= 31) {
        onSave({
          recurringAmount: amountNum,
          recurringFrequency: "monthly",
          recurringDayOfMonth: dayNum,
        });
      }
    }
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recurring payment</DialogTitle>
          <DialogDescription>
            This amount is subtracted from the debt balance (for display) on a
            schedule. Bi-weekly = every 14 days from first payment date. Monthly
            = on the chosen day each month.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="text"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(v) => setFrequency(v as RecurringFrequency)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="biweekly">
                  Bi-weekly (every 2 weeks)
                </SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {frequency === "biweekly" ? (
            <div className="space-y-2">
              <Label>First payment date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Day of month (1–31)</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              onClick={handleClear}
            >
              Clear recurring
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
