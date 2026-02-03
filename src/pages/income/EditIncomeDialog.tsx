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
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryOption } from "@/lib/categoryColors";
import type { Owner, RecurringFrequency } from "@/types/core";
import type {
  EditIncomeFormPayload,
  EditIncomeDialogProps,
} from "@/types/income";

export type { EditIncomeFormPayload, EditIncomeDialogProps };

export function EditIncomeDialog({
  income,
  onClose,
  incomeCategories,
  owners = [],
  onSubmit,
}: EditIncomeDialogProps) {
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [owner, setOwner] = useState<Owner>("");
  const [recurringChecked, setRecurringChecked] = useState(false);
  const [recurringAmount, setRecurringAmount] = useState("");
  const [recurringFrequency, setRecurringFrequency] =
    useState<RecurringFrequency>("monthly");
  const [recurringDay, setRecurringDay] = useState("15");
  const [recurringStartDate, setRecurringStartDate] = useState("");

  useEffect(() => {
    if (income) {
      setDate(income.date);
      setAmount(String(income.amount));
      setDescription(income.description ?? "");
      setCategory(income.category ?? ""); // default: Uncategorized
      setOwner(income.owner ?? "");
      const hasRecurring =
        income.recurringAmount != null &&
        income.recurringAmount > 0 &&
        (income.recurringFrequency === "monthly"
          ? income.recurringDayOfMonth != null
          : !!income.recurringStartDate);
      setRecurringChecked(!!hasRecurring);
      setRecurringAmount(
        income.recurringAmount != null ? String(income.recurringAmount) : ""
      );
      setRecurringFrequency(
        income.recurringFrequency === "biweekly" ? "biweekly" : "monthly"
      );
      setRecurringDay(
        income.recurringDayOfMonth != null
          ? String(income.recurringDayOfMonth)
          : "15"
      );
      setRecurringStartDate(income.recurringStartDate ?? "");
    }
  }, [income, incomeCategories, owners]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!income) return;
    const num = parseFloat(amount.replace(/[$,]/g, ""));
    if (Number.isNaN(num) || num <= 0) return;
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
    onSubmit(income.id, {
      date: date.trim(),
      amount: num,
      description: description.trim() || "Income",
      category: category || "",
      owner: owner || "",
      recurringAmount:
        typeof recurringAmountNum === "number" ? recurringAmountNum : undefined,
      recurringFrequency: recurringAmountNum != null ? freq : undefined,
      recurringDayOfMonth:
        typeof recurringDayNum === "number" ? recurringDayNum : undefined,
      recurringStartDate: recurringStart,
    });
  };

  return (
    <Dialog open={!!income} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit income</DialogTitle>
          <DialogDescription>
            Update the date, amount, description, and category.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="text"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="e.g. Paycheck, Basement Rent"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category || "_"}
              onValueChange={(v) => setCategory(v === "_" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_">
                  <CategoryOption name="Uncategorized" type="income" />
                </SelectItem>
                {incomeCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    <CategoryOption name={c} type="income" />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Owner</Label>
            <Select
              value={owner || "_none"}
              onValueChange={(v) => setOwner(v === "_none" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No Owner</SelectItem>
                {owners.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-recurring"
              checked={recurringChecked}
              onCheckedChange={(c) => setRecurringChecked(c === true)}
            />
            <Label htmlFor="edit-recurring" className="cursor-pointer">
              Recurring income
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
