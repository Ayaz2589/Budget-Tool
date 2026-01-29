import { useState, useMemo } from "react";
import { useBudget } from "@/context/BudgetContext";
import type { ExpenseSource } from "@/lib/types";
import { CategoryOption } from "@/lib/categoryColors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SOURCE_LABELS: Record<ExpenseSource, string> = {
  amex: "American Express",
  chase: "Chase",
  apple: "Apple Card",
  manual: "Manual",
  td: "Debit (TD Bank)",
};

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTransactionDialog({
  open,
  onOpenChange,
}: AddTransactionDialogProps) {
  const { expenses, addExpense, expenseCategories } = useBudget();
  const [addDate, setAddDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [addAmount, setAddAmount] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addCategory, setAddCategory] = useState<string>("");
  const [addSource, setAddSource] = useState<ExpenseSource>("manual");
  const [addCardMember, setAddCardMember] = useState("");

  const cardMemberOptions = useMemo(() => {
    const fromExpenses = [
      ...new Set(
        expenses.map((e) => e.cardMember).filter((m): m is string => !!m),
      ),
    ].sort();
    if (fromExpenses.length > 0) return fromExpenses;
    return ["AYAZ UDDIN", "TASNUVA AHMED"];
  }, [expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(addAmount.replace(/[$,]/g, ""));
    if (Number.isNaN(num) || num <= 0) return;
    addExpense({
      date: addDate,
      amount: num,
      description: addDescription.trim() || "Manual transaction",
      category: addCategory || "",
      source: addSource,
      cardMember: addCardMember.trim() || undefined,
    });
    setAddAmount("");
    setAddDescription("");
    setAddCategory("");
    setAddSource("manual");
    setAddCardMember("");
    setAddDate(new Date().toISOString().slice(0, 10));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New transaction</DialogTitle>
          <DialogDescription>
            Add an expense manually. Choose the source (e.g. Manual or Debit (TD
            Bank)).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Source</Label>
            <Select
              value={addSource}
              onValueChange={(v) => setAddSource(v as ExpenseSource)}
            >
              <SelectTrigger className="w-full min-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">{SOURCE_LABELS.manual}</SelectItem>
                <SelectItem value="td">{SOURCE_LABELS.td}</SelectItem>
                <SelectItem value="amex">{SOURCE_LABELS.amex}</SelectItem>
                <SelectItem value="apple">{SOURCE_LABELS.apple}</SelectItem>
                <SelectItem value="chase">{SOURCE_LABELS.chase}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={addDate}
              onChange={(e) => setAddDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="text"
              placeholder="0.00"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="e.g. Groceries, Gas"
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={addCategory || "_"}
              onValueChange={(v) => setAddCategory(v === "_" ? "" : v)}
            >
              <SelectTrigger className="w-full min-w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_">
                  <CategoryOption name="Uncategorized" type="expense" />
                </SelectItem>
                {expenseCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    <CategoryOption name={c} type="expense" />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Card member (optional)</Label>
            <Select
              value={addCardMember || "_none"}
              onValueChange={(v) => setAddCardMember(v === "_none" ? "" : v)}
            >
              <SelectTrigger className="w-full min-w-[200px]">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">—</SelectItem>
                {cardMemberOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
