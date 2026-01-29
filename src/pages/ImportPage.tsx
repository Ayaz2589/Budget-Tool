import { useRef, useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { useRules } from "@/context/RulesContext";
import { parseCsv, parseChasePdfFromText, type CsvSource } from "@/lib/parsers";
import { extractTextFromPdf } from "@/lib/pdfText";
import { parseExportedPdfData } from "@/lib/pdfExport";
import {
  applyRulesToExpenses,
  applyBaselineToExpenses,
} from "@/lib/categoryRules";
import { filterOutExistingExpenses } from "@/lib/importDedup";
import type { Debt, DebtPayment, Expense, Income } from "@/lib/types";
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
import { formatCurrency } from "@/lib/format";

type SourceChoice = "amex" | "apple" | "chase" | "pdf-export";

const SOURCE_OPTIONS: { value: SourceChoice; label: string }[] = [
  { value: "amex", label: "American Express" },
  { value: "apple", label: "Apple Card" },
  { value: "chase", label: "Chase (PDF statement)" },
  { value: "pdf-export", label: "Exported PDF (re-import)" },
];

export function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSource, setSelectedSource] = useState<SourceChoice>("amex");
  const [previewExpenses, setPreviewExpenses] = useState<Expense[]>([]);
  const [previewIncome, setPreviewIncome] = useState<Income[]>([]);
  const [previewDebts, setPreviewDebts] = useState<Debt[]>([]);
  const [previewDebtPayments, setPreviewDebtPayments] = useState<DebtPayment[]>(
    [],
  );
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [lastDetected, setLastDetected] = useState<string>("");
  const [skippedDuplicates, setSkippedDuplicates] = useState<number>(0);
  const [importError, setImportError] = useState<string>("");
  const {
    expenses,
    income,
    debts,
    debtPayments,
    addExpenses,
    addIncomes,
    addDebts,
    addDebtPayments,
    expenseCategories,
  } = useBudget();
  const { rules } = useRules();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    if (selectedSource === "pdf-export") {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const buffer = reader.result as ArrayBuffer;
          const text = await extractTextFromPdf(buffer);
          const parsed = parseExportedPdfData(text);
          const existingExpenseIds = new Set(expenses.map((ex) => ex.id));
          const toAddExpenses = parsed.expenses.filter(
            (ex) => !existingExpenseIds.has(ex.id),
          );
          // Omit income that already exists by id OR by (date, amount, category)
          // so auto-generated paychecks/rent (random ids) are not duplicated
          const toAddIncome = parsed.income.filter((i) => {
            if (income.some((existing) => existing.id === i.id)) return false;
            const sameEntry = income.some(
              (existing) =>
                existing.date === i.date &&
                Math.abs(existing.amount - i.amount) < 0.01 &&
                (existing.category || "").toLowerCase() ===
                  (i.category || "").toLowerCase(),
            );
            return !sameEntry;
          });
          const existingDebtIds = new Set(debts.map((d) => d.id));
          const existingPaymentIds = new Set(debtPayments.map((p) => p.id));
          const toAddDebts = parsed.debts.filter(
            (d) => !existingDebtIds.has(d.id),
          );
          const toAddDebtPayments = parsed.debtPayments.filter(
            (p) => !existingPaymentIds.has(p.id),
          );
          if (
            parsed.expenses.length === 0 &&
            parsed.income.length === 0 &&
            parsed.debts.length === 0 &&
            parsed.debtPayments.length === 0 &&
            text.trim().length > 0
          ) {
            setImportError(
              "This doesn't look like an exported transactions PDF.",
            );
            setPreviewExpenses([]);
            setPreviewIncome([]);
            setLastDetected("");
            setSourceLabel("");
            return;
          }
          const withRules = applyRulesToExpenses(
            toAddExpenses,
            rules.filter((r) => r.type === "expense"),
          );
          const withBaseline = applyBaselineToExpenses(withRules);
          setPreviewExpenses(withBaseline);
          setPreviewIncome(toAddIncome);
          setPreviewDebts(toAddDebts);
          setPreviewDebtPayments(toAddDebtPayments);
          setSourceLabel("Exported PDF");
          setLastDetected("pdf-export");
          setSkippedDuplicates(0);
        } catch (err) {
          setImportError(
            err instanceof Error ? err.message : "PDF import failed",
          );
          setPreviewExpenses([]);
          setPreviewIncome([]);
          setPreviewDebts([]);
          setPreviewDebtPayments([]);
          setLastDetected("");
          setSourceLabel("");
          setSkippedDuplicates(0);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (selectedSource === "chase") {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const buffer = reader.result as ArrayBuffer;
          const text = await extractTextFromPdf(buffer);
          const result = parseChasePdfFromText(text);
          const toAdd = filterOutExistingExpenses(result.expenses, expenses);
          setSkippedDuplicates(result.expenses.length - toAdd.length);
          const withRules = applyRulesToExpenses(
            toAdd,
            rules.filter((r) => r.type === "expense"),
          );
          const withBaseline = applyBaselineToExpenses(withRules);
          setPreviewExpenses(withBaseline);
          setPreviewIncome([]);
          setSourceLabel("Chase");
          setLastDetected("chase");
        } catch (err) {
          setImportError(
            err instanceof Error ? err.message : "PDF import failed",
          );
          setPreviewExpenses([]);
          setPreviewIncome([]);
          setLastDetected("");
          setSourceLabel("");
          setSkippedDuplicates(0);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result);
          const result = parseCsv(text, selectedSource as CsvSource);
          const toAdd = filterOutExistingExpenses(result.expenses, expenses);
          setSkippedDuplicates(result.expenses.length - toAdd.length);
          const withRules = applyRulesToExpenses(
            toAdd,
            rules.filter((r) => r.type === "expense"),
          );
          const withBaseline = applyBaselineToExpenses(withRules);
          setPreviewExpenses(withBaseline);
          setPreviewIncome([]);
          const label =
            selectedSource === "amex" ? "American Express" : "Apple Card";
          setSourceLabel(label);
          setLastDetected(selectedSource);
        } catch (err) {
          setImportError(err instanceof Error ? err.message : "Import failed");
          setPreviewExpenses([]);
          setPreviewIncome([]);
          setLastDetected("");
          setSourceLabel("");
          setSkippedDuplicates(0);
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
    if (previewIncome.length > 0) {
      addIncomes(previewIncome);
    }
    if (previewDebts.length > 0) {
      addDebts(previewDebts);
    }
    if (previewDebtPayments.length > 0) {
      addDebtPayments(previewDebtPayments);
    }
    setPreviewExpenses([]);
    setPreviewIncome([]);
    setPreviewDebts([]);
    setPreviewDebtPayments([]);
    setSourceLabel("");
    setLastDetected("");
    setSkippedDuplicates(0);
    setImportError("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Import</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upload statement</CardTitle>
          <CardDescription>
            Select your bank or &quot;Exported PDF (re-import)&quot; from the
            dropdown, then choose a CSV file (Amex, Apple), PDF statement
            (Chase), or a previously downloaded transactions PDF. CSV and Chase
            imports skip transactions that already exist (same date and amount).
            Re-imported PDFs skip by ID. After reviewing the preview, click
            &quot;Add to transactions&quot; or &quot;Add all&quot; to save—they
            persist across refreshes and appear on the Transactions and Income
            pages.
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
            accept={
              selectedSource === "chase" || selectedSource === "pdf-export"
                ? ".pdf"
                : ".csv"
            }
            className="hidden"
            onChange={handleFileChange}
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" />
            {selectedSource === "pdf-export"
              ? "Choose exported PDF"
              : selectedSource === "chase"
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
              {sourceLabel}
              {lastDetected === "pdf-export"
                ? ` · ${previewExpenses.length} expenses, ${previewIncome.length} income${previewDebts.length > 0 ? `, ${previewDebts.length} debts` : ""}${previewDebtPayments.length > 0 ? `, ${previewDebtPayments.length} debt payments` : ""} to add (existing IDs omitted)`
                : ` · ${previewExpenses.length} rows${skippedDuplicates > 0 ? ` (${skippedDuplicates} duplicates skipped)` : ""}`}
            </span>
          )}
          {(previewExpenses.length > 0 ||
            previewIncome.length > 0 ||
            previewDebts.length > 0 ||
            previewDebtPayments.length > 0) && (
            <>
              {lastDetected !== "pdf-export" && (
                <Button variant="outline" onClick={applyRules}>
                  Apply rules
                </Button>
              )}
              <Button onClick={addToTransactions}>
                {lastDetected === "pdf-export"
                  ? "Add all"
                  : "Add to transactions"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      {(previewExpenses.length > 0 ||
        previewIncome.length > 0 ||
        previewDebts.length > 0 ||
        previewDebtPayments.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {lastDetected === "pdf-export"
                ? 'Transactions and income with existing IDs are omitted. Click "Add all" to add the rest.'
                : 'Transactions matching existing entries (same date and amount) are skipped. Edit category per row if needed, then click "Add to transactions".'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {previewExpenses.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Expenses to add</h3>
                <div className="overflow-x-auto max-h-[40vh] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
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
                          <TableCell className="font-mono text-xs">
                            {e.id}
                          </TableCell>
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
                            {lastDetected === "pdf-export" ? (
                              e.category || "—"
                            ) : (
                              <Select
                                value={e.category || "_"}
                                onValueChange={(v) =>
                                  updatePreviewCategory(
                                    e.id,
                                    v === "_" ? "" : v,
                                  )
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
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            {previewIncome.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Income to add</h3>
                <div className="overflow-x-auto max-h-[40vh] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Recurring</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewIncome.map((i) => (
                        <TableRow key={i.id}>
                          <TableCell className="font-mono text-xs">
                            {i.id}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {i.date}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {i.description}
                          </TableCell>
                          <TableCell>{formatCurrency(i.amount)}</TableCell>
                          <TableCell>{i.category || "—"}</TableCell>
                          <TableCell>{i.owner ?? "Ayaz"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {i.recurringAmount != null && i.recurringAmount > 0
                              ? i.recurringFrequency === "biweekly" &&
                                i.recurringStartDate
                                ? `Biweekly from ${i.recurringStartDate}`
                                : i.recurringFrequency === "monthly" &&
                                    i.recurringDayOfMonth != null
                                  ? `Monthly on ${i.recurringDayOfMonth}`
                                  : "—"
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            {lastDetected === "pdf-export" && previewDebts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Debts to add</h3>
                <div className="overflow-x-auto max-h-[30vh] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Initial Amount</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Owner</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewDebts.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell>{d.name}</TableCell>
                          <TableCell>
                            {formatCurrency(d.initialAmount)}
                          </TableCell>
                          <TableCell>{d.startDate ?? "—"}</TableCell>
                          <TableCell>{d.owner ?? "Ayaz"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            {lastDetected === "pdf-export" &&
              previewDebtPayments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Debt payments to add
                  </h3>
                  <div className="overflow-x-auto max-h-[30vh] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Debt Id</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewDebtPayments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono text-xs">
                              {p.debtId}
                            </TableCell>
                            <TableCell>{p.date}</TableCell>
                            <TableCell>{formatCurrency(p.amount)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {p.note ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
