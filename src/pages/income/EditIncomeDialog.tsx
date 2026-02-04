import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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
  const fieldClass = "h-11 w-full min-w-0";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";
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
    <Sheet open={!!income} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex flex-col h-full w-[85vw] max-w-sm border-l p-4 gap-3 overflow-hidden rounded-l-2xl"
      >
        <SheetHeader className="gap-2">
          <SheetTitle>Edit income</SheetTitle>
          <SheetDescription>
            Update the date, amount, description, and category.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 gap-4 overflow-hidden"
        >
          <div className="flex-1 min-h-0 overflow-auto space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={fieldClass}
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
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g. Paycheck, Basement Rent"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category || "_"}
                onValueChange={(v) => setCategory(v === "_" ? "" : v)}
              >
                <SelectTrigger className={selectTriggerClass}>
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
                <SelectTrigger className={selectTriggerClass}>
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
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="h-11 flex-1">
              Save
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
