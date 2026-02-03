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
import { CategoryOption } from "@/lib/categoryColors";
import type { Owner, RecurringFrequency } from "@/types/core";
import type {
  AddIncomeFormPayload,
  AddIncomeDialogProps,
} from "@/types/income";

export type { AddIncomeFormPayload, AddIncomeDialogProps };

export function AddIncomeDialog({
  open,
  onOpenChange,
  incomeCategories,
  owners = [],
  onSubmit,
}: AddIncomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New income</DialogTitle>
          <DialogDescription>
            Enter the date, amount, description, and category.
          </DialogDescription>
        </DialogHeader>
        <AddIncomeForm
          incomeCategories={incomeCategories}
          owners={owners}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddIncomeForm({
  incomeCategories,
  owners = [],
  onSubmit,
  onCancel,
}: {
  incomeCategories: string[];
  owners?: string[];
  onSubmit: (payload: AddIncomeFormPayload) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(""); // default: Uncategorized
  const [owner, setOwner] = useState<Owner>(
    owners[0] ?? ""
  );
  const [recurringChecked, setRecurringChecked] = useState(false);
  const [recurringAmount, setRecurringAmount] = useState("");
  const [recurringFrequency, setRecurringFrequency] =
    useState<RecurringFrequency>("monthly");
  const [recurringDay, setRecurringDay] = useState("15");
  const [recurringStartDate, setRecurringStartDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    onSubmit({
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
        <Select value={owner || "_none"} onValueChange={(v) => setOwner(v === "_none" ? "" : v)}>
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
          id="add-recurring"
          checked={recurringChecked}
          onCheckedChange={(c) => setRecurringChecked(c === true)}
        />
        <Label htmlFor="add-recurring" className="cursor-pointer">
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add</Button>
      </DialogFooter>
    </form>
  );
}
