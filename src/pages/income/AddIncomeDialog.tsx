import { useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryOption } from "@/lib/categoryColors";
import { CalendarIcon } from "lucide-react";
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col h-full w-[85vw] max-w-sm border-l p-4 gap-3 overflow-hidden rounded-l-2xl"
      >
        <SheetHeader className="gap-2">
          <SheetTitle>New income</SheetTitle>
          <SheetDescription>
            Enter the date, amount, description, and category.
          </SheetDescription>
        </SheetHeader>
        <AddIncomeForm
          incomeCategories={incomeCategories}
          owners={owners}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
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
  const [owner, setOwner] = useState<Owner>(owners[0] ?? "");
  const fieldClass = "h-11 w-full min-w-0";
  const selectTriggerClass = "h-11 w-full data-[size=default]:h-11";
  const formatDateLabel = (value: string) => {
    if (!value) return "—";
    const dateObj = new Date(value);
    if (Number.isNaN(dateObj.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(dateObj);
  };

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
    <form
      onSubmit={handleSubmit}
      className="flex flex-col flex-1 min-h-0 gap-4 overflow-hidden"
    >
      <div className="flex-1 min-h-0 overflow-auto space-y-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={selectTriggerClass}>
                <span className="truncate">{formatDateLabel(date)}</span>
                <CalendarIcon className="size-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-4 w-64">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={fieldClass}
              />
            </PopoverContent>
          </Popover>
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
          onClick={onCancel}
          className="h-11 flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" className="h-11 flex-1">
          Add
        </Button>
      </div>
    </form>
  );
}
