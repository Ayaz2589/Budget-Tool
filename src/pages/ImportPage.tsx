import { useRef, useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { useRules } from "@/context/RulesContext";
import { parseCsv, parseChasePdfFromText, type CsvSource } from "@/lib/parsers";
import { extractTextFromPdf } from "@/lib/pdfText";
import {
  applyRulesToExpenses,
  applyBaselineToExpenses,
} from "@/lib/categoryRules";
import type { Expense } from "@/lib/types";
import { CategoryOption } from "@/lib/categoryColors";
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

type SourceChoice = "amex" | "apple" | "chase";

const SOURCE_OPTIONS: { value: SourceChoice; label: string }[] = [
  { value: "amex", label: "American Express" },
  { value: "apple", label: "Apple Card" },
  { value: "chase", label: "Chase (PDF statement)" },
];

export function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSource, setSelectedSource] = useState<SourceChoice>("amex");
  const [previewExpenses, setPreviewExpenses] = useState<Expense[]>([]);
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [lastDetected, setLastDetected] = useState<string>("");
  const [importError, setImportError] = useState<string>("");
  const { addExpenses, expenseCategories } = useBudget();
  const { rules } = useRules();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    if (selectedSource === "chase") {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const buffer = reader.result as ArrayBuffer;
          const text = await extractTextFromPdf(buffer);
          const result = parseChasePdfFromText(text);
          const withRules = applyRulesToExpenses(
            result.expenses,
            rules.filter((r) => r.type === "expense"),
          );
          const withBaseline = applyBaselineToExpenses(withRules);
          setPreviewExpenses(withBaseline);
          setSourceLabel("Chase");
          setLastDetected("chase");
        } catch (err) {
          setImportError(
            err instanceof Error ? err.message : "PDF import failed",
          );
          setPreviewExpenses([]);
          setLastDetected("");
          setSourceLabel("");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result);
          const result = parseCsv(text, selectedSource as CsvSource);
          const withRules = applyRulesToExpenses(
            result.expenses,
            rules.filter((r) => r.type === "expense"),
          );
          const withBaseline = applyBaselineToExpenses(withRules);
          setPreviewExpenses(withBaseline);
          const label =
            selectedSource === "amex" ? "American Express" : "Apple Card";
          setSourceLabel(label);
          setLastDetected(selectedSource);
        } catch (err) {
          setImportError(err instanceof Error ? err.message : "Import failed");
          setPreviewExpenses([]);
          setLastDetected("");
          setSourceLabel("");
        }
      };
      reader.readAsText(file, "UTF-8");
    }
    e.target.value = "";
  };

  const applyRules = () => {
    setPreviewExpenses((prev) => {
      const withRules = applyRulesToExpenses(
        prev,
        rules.filter((r) => r.type === "expense"),
      );
      return applyBaselineToExpenses(withRules);
    });
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
    setLastDetected("");
    setImportError("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Import</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upload statement</CardTitle>
          <CardDescription>
            Select your bank from the dropdown, then choose a CSV file (Amex,
            Apple) or PDF statement (Chase). After reviewing the preview, click
            &quot;Add to transactions&quot; to save them—they persist across
            refreshes and appear on the Transactions page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium whitespace-nowrap">
              CSV source:
            </span>
            <Select
              value={selectedSource}
              onValueChange={(v) => setSelectedSource(v as SourceChoice)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={selectedSource === "chase" ? ".pdf" : ".csv"}
            className="hidden"
            onChange={handleFileChange}
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" />
            {selectedSource === "chase"
              ? "Choose PDF statement"
              : "Choose CSV file"}
          </Button>
          {importError && (
            <span className="text-sm text-destructive self-center">
              {importError}
            </span>
          )}
          {lastDetected && !importError && (
            <span className="text-sm text-muted-foreground self-center">
              {sourceLabel} · {previewExpenses.length} rows
            </span>
          )}
          {previewExpenses.length > 0 && (
            <>
              <Button variant="outline" onClick={applyRules}>
                Apply rules
              </Button>
              <Button onClick={addToTransactions}>Add to transactions</Button>
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
                          <SelectTrigger className="w-[220px] min-w-[200px]">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_">
                              <CategoryOption
                                name="Uncategorized"
                                type="expense"
                              />
                            </SelectItem>
                            {expenseCategories.map((c) => (
                              <SelectItem key={c} value={c}>
                                <CategoryOption name={c} type="expense" />
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
