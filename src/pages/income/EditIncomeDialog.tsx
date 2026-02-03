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
import { CategoryOption } from "@/lib/categoryColors";
import type { Owner } from "@/types/core";
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

  useEffect(() => {
    if (income) {
      setDate(income.date);
      setAmount(String(income.amount));
      setDescription(income.description ?? "");
      setCategory(income.category ?? ""); // default: Uncategorized
      setOwner(income.owner ?? "");
    }
  }, [income, incomeCategories, owners]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!income) return;
    const num = parseFloat(amount.replace(/[$,]/g, ""));
    if (Number.isNaN(num) || num <= 0) return;
    onSubmit(income.id, {
      date: date.trim(),
      amount: num,
      description: description.trim() || "Income",
      category: category || "",
      owner: owner || "",
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
