import { useState } from "react";
import { useRules } from "@/context/RulesContext";
import { useBudget } from "@/context/BudgetContext";
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
import { Lock, Plus, Trash2 } from "lucide-react";
import type { CategoryRule } from "@/lib/categoryRules";
import { BASELINE_RULES_READONLY } from "@/lib/categoryRules";
import {
  AUTO_INCOME_RULES_READONLY,
  AUTO_EXPENSE_RULES_READONLY,
} from "@/lib/paycheck";
import { CategoryOption } from "@/lib/categoryColors";

export function CategoryRulesPage() {
  const { rules, addRule, removeRule } = useRules();
  const { expenseCategories } = useBudget();
  const [open, setOpen] = useState(false);
  const [pattern, setPattern] = useState("");
  const [category, setCategory] = useState<string>(
    expenseCategories[0] ?? "My Purchase",
  );

  const expenseRules = rules.filter((r) => r.type === "expense");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pattern.trim()) return;
    addRule({
      pattern: pattern.trim(),
      category: category || (expenseCategories[0] ?? "My Purchase"),
      type: "expense",
    });
    setPattern("");
    setCategory(expenseCategories[0] ?? "My Purchase");
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Category rules</h1>

      <Card>
        <CardHeader>
          <CardTitle>Auto income</CardTitle>
          <CardDescription>
            Recurring income added automatically each month (cannot be removed).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {AUTO_INCOME_RULES_READONLY.map((r, i) => (
                  <TableRow key={`auto-income-${i}`}>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {r.schedule}
                    </TableCell>
                    <TableCell>{r.amount}</TableCell>
                    <TableCell>
                      <CategoryOption name={r.category} type="income" />
                    </TableCell>
                    <TableCell className="w-[80px]">
                      <span title="Auto-added (cannot be removed)">
                        <Lock className="size-4 text-muted-foreground" />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto expense</CardTitle>
          <CardDescription>
            Recurring expenses added automatically each month (cannot be
            removed).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {AUTO_EXPENSE_RULES_READONLY.map((r, i) => (
                  <TableRow key={`auto-expense-${i}`}>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {r.schedule}
                    </TableCell>
                    <TableCell>{r.amount}</TableCell>
                    <TableCell>
                      <CategoryOption name={r.category} type="expense" />
                    </TableCell>
                    <TableCell className="w-[80px]">
                      <span title="Auto-added (cannot be removed)">
                        <Lock className="size-4 text-muted-foreground" />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense rules</CardTitle>
          <CardDescription>
            Built-in rules run first (cannot be removed). Your rules are matched
            next; first match sets the category. Pattern is matched
            case-insensitively against the transaction description.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Add rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New category rule</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label>Pattern (substring in description)</Label>
                  <Input
                    placeholder="e.g. UBER EATS"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-[220px] min-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((c) => (
                        <SelectItem key={c} value={c}>
                          <CategoryOption name={c} type="expense" />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit">Add rule</Button>
              </form>
            </DialogContent>
          </Dialog>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {BASELINE_RULES_READONLY.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {r.pattern}
                    </TableCell>
                    <TableCell>
                      <CategoryOption name={r.category} type="expense" />
                    </TableCell>
                    <TableCell className="w-[80px]">
                      <span title="Built-in rule (cannot be removed)">
                        <Lock className="size-4 text-muted-foreground" />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {expenseRules.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      No custom rules. Add one to auto-categorize imports.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenseRules.map((r: CategoryRule) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">
                        {r.pattern}
                      </TableCell>
                      <TableCell>
                        <CategoryOption name={r.category} type="expense" />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRule(r.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
