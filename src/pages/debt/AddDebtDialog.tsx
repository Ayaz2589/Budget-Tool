import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import type { DebtOwner, RecurringFrequency } from "@/types/core";
import type { AddDebtPayload, AddDebtDialogProps } from "@/types/debt";

export type { AddDebtPayload, AddDebtDialogProps };

export function AddDebtDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddDebtDialogProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [owner, setOwner] = useState<DebtOwner>("Ayaz");
  const [recurringChecked, setRecurringChecked] = useState(false);
  const [recurringAmount, setRecurringAmount] = useState("");
  const [recurringFrequency, setRecurringFrequency] =
    useState<RecurringFrequency>("biweekly");
  const [recurringDay, setRecurringDay] = useState("1");
  const [recurringStartDate, setRecurringStartDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(/[$,]/g, ""));
    if (Number.isNaN(num) || num < 0) return;
    const recurringAmountNum =
      recurringChecked &&
      (() => {
        const n = parseFloat(recurringAmount.replace(/[$,]/g, ""));
        return !Number.isNaN(n) && n > 0 ? n : undefined;
      })();
    const freq = recurringFrequency;
    const recurringDayNum =
      recurringChecked &&
      freq === "monthly" &&
      (() => {
        const n = parseInt(recurringDay, 10);
        return n >= 1 && n <= 31 ? n : undefined;
      })();
    const recurringStart =
      recurringChecked && freq === "biweekly" && recurringStartDate.trim()
        ? recurringStartDate.trim()
        : undefined;
    onSubmit({
      name: name.trim() || "Debt",
      initialAmount: num,
      startDate: startDate.trim() || undefined,
      owner,
      recurringAmount:
        typeof recurringAmountNum === "number" ? recurringAmountNum : undefined,
      recurringFrequency: recurringAmountNum != null ? freq : undefined,
      recurringDayOfMonth:
        typeof recurringDayNum === "number" ? recurringDayNum : undefined,
      recurringStartDate: recurringStart,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New debt</DialogTitle>
          <DialogDescription>
            Enter the debt name and initial amount owed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="e.g. Car loan, Credit card"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Initial amount owed</Label>
            <Input
              type="text"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Start date (optional)</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Owner</Label>
            <Select
              value={owner}
              onValueChange={(v) => setOwner(v as DebtOwner)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ayaz">Ayaz</SelectItem>
                <SelectItem value="Tasnuva">Tasnuva</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="add-recurring"
              checked={recurringChecked}
              onCheckedChange={(c) => setRecurringChecked(c === true)}
            />
            <Label htmlFor="add-recurring" className="cursor-pointer">
              Recurring payment (taken off balance)
            </Label>
          </div>
          {recurringChecked && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Recurring amount</Label>
                <Input
                  type="text"
                  placeholder="0.00"
                  value={recurringAmount}
                  onChange={(e) => setRecurringAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={recurringFrequency}
                  onValueChange={(v) =>
                    setRecurringFrequency(v as RecurringFrequency)
                  }
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
              {recurringFrequency === "biweekly" ? (
                <div className="space-y-2">
                  <Label>First payment date</Label>
                  <Input
                    type="date"
                    value={recurringStartDate}
                    onChange={(e) => setRecurringStartDate(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Day of month (1–31)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={recurringDay}
                    onChange={(e) => setRecurringDay(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add debt</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
