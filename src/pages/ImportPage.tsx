import { useRef, useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { useRules } from "@/context/RulesContext";
import { parseCsv, detectCsvSource } from "@/lib/parsers";
import { applyRulesToExpenses } from "@/lib/categoryRules";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewExpenses, setPreviewExpenses] = useState<Expense[]>([]);
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const { addExpenses, expenseCategories } = useBudget();
  const { rules } = useRules();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      const detected = detectCsvSource(text);
      const result = parseCsv(text, detected);
      const withRules = applyRulesToExpenses(
        result.expenses,
        rules.filter((r) => r.type === "expense"),
      );
      setPreviewExpenses(withRules);
      setSourceLabel(
        detected === "amex"
          ? "American Express"
          : detected === "chase"
            ? "Chase"
            : detected === "apple"
              ? "Apple"
              : "Unknown",
      );
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const applyRules = () => {
    setPreviewExpenses((prev) =>
      applyRulesToExpenses(
        prev,
        rules.filter((r) => r.type === "expense"),
      ),
    );
  };

  const updatePreviewCategory = (id: string, category: string) => {
    setPreviewExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, category } : e)),
    );
  };

  const addToTransactions = () => {
    addExpenses(previewExpenses);
    setPreviewExpenses([]);
    setSourceLabel("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Import CSV</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upload statement</CardTitle>
          <CardDescription>
            Select a CSV from American Express (Chase and Apple coming soon).
            We&apos;ll detect the source and apply your category rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" />
            Choose CSV file
          </Button>
          {previewExpenses.length > 0 && (
            <>
              <Button variant="outline" onClick={applyRules}>
                Apply rules
              </Button>
              <Button onClick={addToTransactions}>Add to transactions</Button>
              <span className="text-sm text-muted-foreground self-center">
                {sourceLabel} · {previewExpenses.length} rows
              </span>
            </>
          )}
        </CardContent>
      </Card>
      {previewExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Edit category per row if needed, then click &quot;Add to
              transactions&quot;.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Card Member</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewExpenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap">
                        {e.date}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {e.description}
                      </TableCell>
                      <TableCell>{formatCurrency(e.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.cardMember ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={e.category || "_"}
                          onValueChange={(v) =>
                            updatePreviewCategory(e.id, v === "_" ? "" : v)
                          }
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_">Uncategorized</SelectItem>
                            {expenseCategories.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
