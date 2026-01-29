import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import type { Income, DebtOwner } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, FileDown, Trash2, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryOption } from "@/lib/categoryColors";
import { formatCurrency } from "@/lib/format";
import { downloadTransactionsAndIncomePdf } from "@/lib/pdfExport";

type RecurringFrequency = "monthly" | "biweekly";

function formatRecurring(i: Income): string {
  if (i.recurringAmount == null || i.recurringAmount <= 0) return "—";
  if (i.recurringFrequency === "biweekly" && i.recurringStartDate) {
    return `Biweekly from ${i.recurringStartDate}`;
  }
  if (
    i.recurringFrequency === "monthly" &&
    i.recurringDayOfMonth != null &&
    i.recurringDayOfMonth >= 1 &&
    i.recurringDayOfMonth <= 31
  ) {
    return `Monthly on ${i.recurringDayOfMonth}`;
  }
  return "—";
}

export function IncomePage() {
  const {
    expenses,
    income,
    debts,
    debtPayments,
    addIncome,
    updateIncome,
    removeIncome,
    incomeCategories,
  } = useBudget();
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [addAmount, setAddAmount] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addCategory, setAddCategory] = useState(
    incomeCategories[0] ?? "Paycheck",
  );
  const [addOwner, setAddOwner] = useState<DebtOwner>("Ayaz");
  const [addRecurringChecked, setAddRecurringChecked] = useState(false);
  const [addRecurringAmount, setAddRecurringAmount] = useState("");
  const [addRecurringFrequency, setAddRecurringFrequency] =
    useState<RecurringFrequency>("monthly");
  const [addRecurringDay, setAddRecurringDay] = useState("15");
  const [addRecurringStartDate, setAddRecurringStartDate] = useState("");
  const [editIncome, setEditIncome] = useState<Income | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editOwner, setEditOwner] = useState<DebtOwner>("Ayaz");
  const [editRecurringChecked, setEditRecurringChecked] = useState(false);
  const [editRecurringAmount, setEditRecurringAmount] = useState("");
  const [editRecurringFrequency, setEditRecurringFrequency] =
    useState<RecurringFrequency>("monthly");
  const [editRecurringDay, setEditRecurringDay] = useState("15");
  const [editRecurringStartDate, setEditRecurringStartDate] = useState("");

  const { t } = useTranslation();
  const sortedIncome = [...income].sort((a, b) => b.date.localeCompare(a.date));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(addAmount.replace(/[$,]/g, ""));
    if (Number.isNaN(num) || num <= 0) return;
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
    addIncome({
      date: addDate.trim(),
      amount: num,
      description: addDescription.trim() || "Income",
      category: addCategory || (incomeCategories[0] ?? "Paycheck"),
      owner: addOwner,
      recurringAmount:
        typeof recurringAmount === "number" ? recurringAmount : undefined,
      recurringFrequency: recurringAmount != null ? freq : undefined,
      recurringDayOfMonth:
        typeof recurringDay === "number" ? recurringDay : undefined,
      recurringStartDate: recurringStart,
    });
    setAddDate(new Date().toISOString().slice(0, 10));
    setAddAmount("");
    setAddDescription("");
    setAddCategory(incomeCategories[0] ?? "Paycheck");
    setAddOwner("Ayaz");
    setAddRecurringChecked(false);
    setAddRecurringAmount("");
    setAddRecurringFrequency("monthly");
    setAddRecurringDay("15");
    setAddRecurringStartDate("");
    setAddOpen(false);
  };

  const openEdit = (i: Income) => {
    setEditIncome(i);
    setEditDate(i.date);
    setEditAmount(String(i.amount));
    setEditDescription(i.description ?? "");
    setEditCategory(i.category ?? incomeCategories[0] ?? "Paycheck");
    setEditOwner(i.owner ?? "Ayaz");
    const hasRecurring =
      i.recurringAmount != null &&
      i.recurringAmount > 0 &&
      (i.recurringFrequency === "monthly"
        ? i.recurringDayOfMonth != null
        : !!i.recurringStartDate);
    setEditRecurringChecked(!!hasRecurring);
    setEditRecurringAmount(
      i.recurringAmount != null ? String(i.recurringAmount) : "",
    );
    setEditRecurringFrequency(
      i.recurringFrequency === "biweekly" ? "biweekly" : "monthly",
    );
    setEditRecurringDay(
      i.recurringDayOfMonth != null ? String(i.recurringDayOfMonth) : "15",
    );
    setEditRecurringStartDate(i.recurringStartDate ?? "");
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editIncome) return;
    const num = parseFloat(editAmount.replace(/[$,]/g, ""));
    if (Number.isNaN(num) || num <= 0) return;
    const recurringAmount =
      editRecurringChecked &&
      (() => {
        const n = parseFloat(editRecurringAmount.replace(/[$,]/g, ""));
        return !Number.isNaN(n) && n > 0 ? n : undefined;
      })();
    const freq = editRecurringFrequency;
    const recurringDay =
      editRecurringChecked &&
      freq === "monthly" &&
      (() => {
        const n = parseInt(editRecurringDay, 10);
        return n >= 1 && n <= 31 ? n : undefined;
      })();
    const recurringStart =
      editRecurringChecked &&
      freq === "biweekly" &&
      editRecurringStartDate.trim()
        ? editRecurringStartDate.trim()
        : undefined;
    updateIncome(editIncome.id, {
      date: editDate.trim(),
      amount: num,
      description: editDescription.trim() || "Income",
      category: editCategory || (incomeCategories[0] ?? "Paycheck"),
      owner: editOwner,
      recurringAmount:
        typeof recurringAmount === "number" ? recurringAmount : undefined,
      recurringFrequency: recurringAmount != null ? freq : undefined,
      recurringDayOfMonth:
        typeof recurringDay === "number" ? recurringDay : undefined,
      recurringStartDate: recurringStart,
    });
    setEditIncome(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("income.title")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("income.addIncome")}</CardTitle>
          <CardDescription>{t("income.addIncomeDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Add income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New income</DialogTitle>
                <DialogDescription>
                  Enter the date, amount, description, and category.
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
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g. Paycheck, Basement Rent"
                    value={addDescription}
                    onChange={(e) => setAddDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={addCategory} onValueChange={setAddCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                    value={addOwner}
                    onValueChange={(v) => setAddOwner(v as DebtOwner)}
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
                    Recurring income
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
                    onClick={() => setAddOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income entries</CardTitle>
          <CardDescription>Edit or delete entries below.</CardDescription>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadTransactionsAndIncomePdf(
                  expenses,
                  income,
                  debts,
                  debtPayments,
                )
              }
            >
              <FileDown className="size-4" />
              Download PDF (transactions & income)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="min-w-[140px]">Recurring</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedIncome.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      No income entries. Add one above.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedIncome.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="whitespace-nowrap">
                        {i.date}
                      </TableCell>
                      <TableCell>{i.description}</TableCell>
                      <TableCell>{formatCurrency(i.amount)}</TableCell>
                      <TableCell>
                        <Select
                          value={i.category}
                          onValueChange={(v) =>
                            updateIncome(i.id, { category: v })
                          }
                        >
                          <SelectTrigger className="w-[220px] min-w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {incomeCategories.map((c) => (
                              <SelectItem key={c} value={c}>
                                <CategoryOption name={c} type="income" />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={i.owner ?? "Ayaz"}
                          onValueChange={(v) =>
                            updateIncome(i.id, {
                              owner: v as DebtOwner,
                            })
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ayaz">Ayaz</SelectItem>
                            <SelectItem value="Tasnuva">Tasnuva</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatRecurring(i)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEdit(i)}
                            aria-label="Edit"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => removeIncome(i.id)}
                            aria-label="Delete"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!editIncome}
        onOpenChange={(open) => !open && setEditIncome(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit income</DialogTitle>
            <DialogDescription>
              Update the date, amount, description, and category.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="text"
                placeholder="0.00"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g. Paycheck, Basement Rent"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
                value={editOwner}
                onValueChange={(v) => setEditOwner(v as DebtOwner)}
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
                id="edit-recurring"
                checked={editRecurringChecked}
                onCheckedChange={(c) => setEditRecurringChecked(c === true)}
              />
              <Label htmlFor="edit-recurring" className="cursor-pointer">
                Recurring income
              </Label>
            </div>
            {editRecurringChecked && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Recurring amount</Label>
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
                      onChange={(e) =>
                        setEditRecurringStartDate(e.target.value)
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
                      value={editRecurringDay}
                      onChange={(e) => setEditRecurringDay(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditIncome(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
