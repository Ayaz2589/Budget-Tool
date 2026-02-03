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
import { CategoryOption } from "@/lib/categoryColors";
import type { Owner } from "@/types/core";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(/[$,]/g, ""));
    if (Number.isNaN(num) || num <= 0) return;
    onSubmit({
      date: date.trim(),
      amount: num,
      description: description.trim() || "Income",
      category: category || "",
      owner: owner || "",
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
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add</Button>
      </DialogFooter>
    </form>
  );
}
