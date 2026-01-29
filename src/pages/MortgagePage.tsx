import { useState, useMemo } from "react";
import { useBudget } from "@/context/BudgetContext";
import type { Expense } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Home } from "lucide-react";
import { CategoryOption } from "@/lib/categoryColors";
import { formatCurrency } from "@/lib/format";

const MORTGAGE_CATEGORY = "Mortgage";
const DEFAULT_MORTGAGE_AMOUNT = 5400;

export function MortgagePage() {
  const { expenses, addExpense, removeExpense } = useBudget();
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [addAmount, setAddAmount] = useState(String(DEFAULT_MORTGAGE_AMOUNT));
  const [deleteConfirm, setDeleteConfirm] = useState<Expense | null>(null);

  const mortgagePayments = useMemo(() => {
    return [...expenses]
      .filter(
        (e) =>
          (e.category || "").toLowerCase() === MORTGAGE_CATEGORY.toLowerCase(),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses]);

  const totalThisYear = useMemo(() => {
    const y = new Date().getFullYear();
    return mortgagePayments
      .filter((e) => e.date.startsWith(String(y)))
      .reduce((s, e) => s + e.amount, 0);
  }, [mortgagePayments]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(addAmount.replace(/[$,]/g, ""));
    if (Number.isNaN(num) || num <= 0) return;
    const dateStr = addDate.trim();
    if (!dateStr) return;
    addExpense({
      date: dateStr,
      amount: num,
      description: MORTGAGE_CATEGORY,
      category: MORTGAGE_CATEGORY,
      source: "manual",
    });
    setAddDate(new Date().toISOString().slice(0, 10));
    setAddAmount(String(DEFAULT_MORTGAGE_AMOUNT));
    setAddOpen(false);
  };

  const handleRemove = (exp: Expense) => {
    removeExpense(exp.id);
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Home className="size-6" />
        Mortgage
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Mortgage payments</CardTitle>
          <CardDescription>
            Record mortgage payments here. They are excluded from the
            Transactions list and included in spending totals (e.g. Dashboard
            &quot;Spent w/o Mortgage&quot; excludes them).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Add payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add mortgage payment</DialogTitle>
                  <DialogDescription>
                    Enter the payment date and amount.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
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
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <span className="text-sm text-muted-foreground">
              Total this year: {formatCurrency(totalThisYear)}
            </span>
          </div>

          {mortgagePayments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No mortgage payments recorded yet. Add one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {mortgagePayments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.date}</TableCell>
                    <TableCell>
                      <CategoryOption name={e.category ?? ""} type="expense" />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(e.amount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(e)}
                        aria-label="Remove payment"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove mortgage payment?</DialogTitle>
            <DialogDescription>
              {deleteConfirm
                ? `Remove ${deleteConfirm.date} payment of ${formatCurrency(deleteConfirm.amount)}? This cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleRemove(deleteConfirm)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
