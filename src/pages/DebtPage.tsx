import { useState, useMemo } from "react";
import { useBudget } from "@/context/BudgetContext";
import type { Debt, DebtPayment } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, DollarSign, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getDebtBalance } from "@/lib/debtUtils";
import { formatCurrency } from "@/lib/format";
import type { DebtOwner } from "@/lib/types";

type RecurringFrequency = "monthly" | "biweekly";

export function DebtPage() {
  const {
    debts,
    debtPayments,
    addDebt,
    updateDebt,
    removeDebt,
    addDebtPayment,
    removeDebtPayment,
  } = useBudget();
  const [addDebtOpen, setAddDebtOpen] = useState(false);
  const [addDebtName, setAddDebtName] = useState("");
  const [addDebtAmount, setAddDebtAmount] = useState("");
  const [addDebtStartDate, setAddDebtStartDate] = useState("");
  const [addDebtOwner, setAddDebtOwner] = useState<DebtOwner>("Ayaz");
  const [addRecurringChecked, setAddRecurringChecked] = useState(false);
  const [addRecurringAmount, setAddRecurringAmount] = useState("");
  const [addRecurringFrequency, setAddRecurringFrequency] =
    useState<RecurringFrequency>("biweekly");
  const [addRecurringDay, setAddRecurringDay] = useState("1");
  const [addRecurringStartDate, setAddRecurringStartDate] = useState("");
  const [recurringDebtId, setRecurringDebtId] = useState<string | null>(null);
  const [editRecurringAmount, setEditRecurringAmount] = useState("");
  const [editRecurringFrequency, setEditRecurringFrequency] =
    useState<RecurringFrequency>("biweekly");
  const [editRecurringDay, setEditRecurringDay] = useState("1");
  const [editRecurringStartDate, setEditRecurringStartDate] = useState("");
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [deleteConfirmDebtId, setDeleteConfirmDebtId] = useState<string | null>(
    null,
  );

  const paymentsByDebt = useMemo(() => {
    const map = new Map<string, DebtPayment[]>();
    for (const p of debtPayments) {
      const list = map.get(p.debtId) ?? [];
      list.push(p);
      map.set(p.debtId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => b.date.localeCompare(a.date));
    }
    return map;
  }, [debtPayments]);

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(addDebtAmount.replace(/[$,]/g, ""));
    if (Number.isNaN(num) || num < 0) return;
    const recurringAmount =
      addRecurringChecked &&
      (() => {
        const n = parseFloat(addRecurringAmount.replace(/[$,]/g, ""));
        return !Number.isNaN(n) && n > 0 ? n : undefined;
      })();
    const freq = addRecurringFrequency;
    const recurringDay =
      addRecurringChecked &&
      freq === "monthly" &&
      (() => {
        const n = parseInt(addRecurringDay, 10);
        return n >= 1 && n <= 31 ? n : undefined;
      })();
    const recurringStart =
      addRecurringChecked && freq === "biweekly" && addRecurringStartDate.trim()
        ? addRecurringStartDate.trim()
        : undefined;
    addDebt({
      name: addDebtName.trim() || "Debt",
      initialAmount: num,
      startDate: addDebtStartDate.trim() || undefined,
      owner: addDebtOwner,
      recurringAmount:
        typeof recurringAmount === "number" ? recurringAmount : undefined,
      recurringFrequency: recurringAmount != null ? freq : undefined,
      recurringDayOfMonth:
        typeof recurringDay === "number" ? recurringDay : undefined,
      recurringStartDate: recurringStart,
    });
    setAddDebtName("");
    setAddDebtAmount("");
    setAddDebtStartDate("");
    setAddDebtOwner("Ayaz");
    setAddRecurringChecked(false);
    setAddRecurringAmount("");
    setAddRecurringFrequency("biweekly");
    setAddRecurringDay("1");
    setAddRecurringStartDate("");
    setAddDebtOpen(false);
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDebtId) return;
    const num = parseFloat(paymentAmount.replace(/[$,]/g, ""));
    if (Number.isNaN(num) || num <= 0) return;
    addDebtPayment({
      debtId: paymentDebtId,
      date: paymentDate,
      amount: num,
      note: paymentNote.trim() || undefined,
    });
    setPaymentAmount("");
    setPaymentNote("");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentDebtId(null);
  };

  const openPaymentDialog = (debtId: string) => {
    setPaymentDebtId(debtId);
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentAmount("");
    setPaymentNote("");
  };

  const confirmRemoveDebt = (id: string) => {
    removeDebt(id);
    setDeleteConfirmDebtId(null);
  };

  const openRecurringDialog = (debt: Debt) => {
    setRecurringDebtId(debt.id);
    setEditRecurringAmount(
      debt.recurringAmount != null ? String(debt.recurringAmount) : "",
    );
    setEditRecurringFrequency(
      debt.recurringFrequency === "biweekly" ? "biweekly" : "monthly",
    );
    setEditRecurringDay(
      debt.recurringDayOfMonth != null ? String(debt.recurringDayOfMonth) : "1",
    );
    setEditRecurringStartDate(debt.recurringStartDate ?? "");
  };

  const handleSaveRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recurringDebtId) return;
    const amount = parseFloat(editRecurringAmount.replace(/[$,]/g, ""));
    const freq = editRecurringFrequency;
    const day = parseInt(editRecurringDay, 10);
    const startDate = editRecurringStartDate.trim() || undefined;
    if (!Number.isNaN(amount) && amount > 0) {
      if (freq === "biweekly" && startDate) {
        updateDebt(recurringDebtId, {
          recurringAmount: amount,
          recurringFrequency: "biweekly",
          recurringStartDate: startDate,
          recurringDayOfMonth: undefined,
        });
      } else if (freq === "monthly" && day >= 1 && day <= 31) {
        updateDebt(recurringDebtId, {
          recurringAmount: amount,
          recurringFrequency: "monthly",
          recurringDayOfMonth: day,
          recurringStartDate: undefined,
        });
      }
    }
    setRecurringDebtId(null);
  };

  const handleClearRecurring = () => {
    if (!recurringDebtId) return;
    updateDebt(recurringDebtId, {
      recurringAmount: undefined,
      recurringFrequency: undefined,
      recurringDayOfMonth: undefined,
      recurringStartDate: undefined,
    });
    setRecurringDebtId(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Debt</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add debt</CardTitle>
          <CardDescription>
            Track a loan or debt (e.g. car loan, credit card). Then record
            payments to see the balance go down.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={addDebtOpen} onOpenChange={setAddDebtOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Add debt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New debt</DialogTitle>
                <DialogDescription>
                  Enter the debt name and initial amount owed.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDebt} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g. Car loan, Credit card"
                    value={addDebtName}
                    onChange={(e) => setAddDebtName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Initial amount owed</Label>
                  <Input
                    type="text"
                    placeholder="0.00"
                    value={addDebtAmount}
                    onChange={(e) => setAddDebtAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start date (optional)</Label>
                  <Input
                    type="date"
                    value={addDebtStartDate}
                    onChange={(e) => setAddDebtStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Owner</Label>
                  <Select
                    value={addDebtOwner}
                    onValueChange={(v) => setAddDebtOwner(v as DebtOwner)}
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
                    checked={addRecurringChecked}
                    onCheckedChange={(c) => setAddRecurringChecked(c === true)}
                  />
                  <Label htmlFor="add-recurring" className="cursor-pointer">
                    Recurring payment (taken off balance)
                  </Label>
                </div>
                {addRecurringChecked && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Recurring amount</Label>
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={addRecurringAmount}
                        onChange={(e) => setAddRecurringAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={addRecurringFrequency}
                        onValueChange={(v) =>
                          setAddRecurringFrequency(v as RecurringFrequency)
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
                    {addRecurringFrequency === "biweekly" ? (
                      <div className="space-y-2">
                        <Label>First payment date</Label>
                        <Input
                          type="date"
                          value={addRecurringStartDate}
                          onChange={(e) =>
                            setAddRecurringStartDate(e.target.value)
                          }
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Day of month (1–31)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          value={addRecurringDay}
                          onChange={(e) => setAddRecurringDay(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddDebtOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add debt</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debts</CardTitle>
          <CardDescription>
            Current balance = initial amount minus payments. Make payments to
            track progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {debts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">
              No debts yet. Add one above.
            </p>
          ) : (
            <div className="space-y-6">
              {debts.map((debt) => {
                const balance = getDebtBalance(debt, debtPayments);
                const payments = paymentsByDebt.get(debt.id) ?? [];
                return (
                  <div
                    key={debt.id}
                    className="rounded-lg border bg-card p-5 space-y-4"
                  >
                    {/* Header: name + meta */}
                    <div>
                      <h3 className="font-semibold text-lg">{debt.name}</h3>
                      <p className="text-muted-foreground text-sm mt-0.5">
                        {debt.owner === "Tasnuva" ? "Tasnuva" : "Ayaz"}
                        {debt.startDate ? ` · Started ${debt.startDate}` : ""}
                      </p>
                    </div>

                    {/* Stats: Initial, Balance, Recurring */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                          Initial
                        </p>
                        <p className="text-sm font-medium mt-0.5">
                          {formatCurrency(debt.initialAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                          Balance
                        </p>
                        <p className="text-lg font-semibold mt-0.5">
                          {formatCurrency(balance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                          Recurring
                        </p>
                        <p className="text-sm font-medium mt-0.5">
                          {debt.recurringAmount != null &&
                          debt.recurringAmount > 0 ? (
                            <>
                              {formatCurrency(debt.recurringAmount)}{" "}
                              <span className="text-muted-foreground font-normal">
                                {debt.recurringFrequency === "biweekly"
                                  ? `bi-weekly from ${debt.recurringStartDate ?? debt.startDate ?? "—"}`
                                  : `monthly on day ${debt.recurringDayOfMonth ?? "—"}`}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Debt actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openRecurringDialog(debt)}
                      >
                        <Calendar className="size-4" />
                        {debt.recurringAmount != null &&
                        debt.recurringAmount > 0
                          ? "Edit recurring"
                          : "Set recurring"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openPaymentDialog(debt.id)}
                        disabled={balance <= 0}
                      >
                        <DollarSign className="size-4" />
                        Make payment
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive ml-auto"
                        onClick={() => setDeleteConfirmDebtId(debt.id)}
                      >
                        <Trash2 className="size-4" />
                        Delete debt
                      </Button>
                    </div>

                    {/* Payment history */}
                    <div className="pt-2 border-t">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Payment history
                      </h4>
                      {payments.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-3">
                          No payments yet.
                        </p>
                      ) : (
                        <div className="overflow-x-auto rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="text-xs">Date</TableHead>
                                <TableHead className="text-xs">
                                  Amount
                                </TableHead>
                                <TableHead className="text-xs">Note</TableHead>
                                <TableHead className="w-[72px] text-right text-xs">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {payments.map((p) => (
                                <TableRow key={p.id}>
                                  <TableCell className="text-sm">
                                    {p.date}
                                  </TableCell>
                                  <TableCell className="text-sm font-medium">
                                    {formatCurrency(p.amount)}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {p.note ?? "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => removeDebtPayment(p.id)}
                                    >
                                      Remove
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Make payment dialog */}
      <Dialog
        open={paymentDebtId !== null}
        onOpenChange={(open) => !open && setPaymentDebtId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make payment</DialogTitle>
            <DialogDescription>
              Record a payment toward this debt. Balance will update
              automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="text"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input
                placeholder="e.g. Monthly payment"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentDebtId(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Add payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit recurring payment dialog */}
      <Dialog
        open={recurringDebtId !== null}
        onOpenChange={(open) => !open && setRecurringDebtId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recurring payment</DialogTitle>
            <DialogDescription>
              This amount is subtracted from the debt balance (for display) on a
              schedule. Bi-weekly = every 14 days from first payment date.
              Monthly = on the chosen day each month.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveRecurring} className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="text"
                placeholder="0.00"
                value={editRecurringAmount}
                onChange={(e) => setEditRecurringAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={editRecurringFrequency}
                onValueChange={(v) =>
                  setEditRecurringFrequency(v as RecurringFrequency)
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
            {editRecurringFrequency === "biweekly" ? (
              <div className="space-y-2">
                <Label>First payment date</Label>
                <Input
                  type="date"
                  value={editRecurringStartDate}
                  onChange={(e) => setEditRecurringStartDate(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Day of month (1–31)</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={editRecurringDay}
                  onChange={(e) => setEditRecurringDay(e.target.value)}
                />
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRecurringDebtId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground"
                onClick={handleClearRecurring}
              >
                Clear recurring
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete debt confirmation */}
      <Dialog
        open={deleteConfirmDebtId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmDebtId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete debt?</DialogTitle>
            <DialogDescription>
              This will permanently remove the debt and all its payment history.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmDebtId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                deleteConfirmDebtId && confirmRemoveDebt(deleteConfirmDebtId)
              }
            >
              Delete debt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
