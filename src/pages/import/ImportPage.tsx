import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import { parseCsv, parseChasePdfFromText, type CsvSource } from "@/lib/parsers";
import { extractTextFromPdf } from "@/lib/pdfText";
import { parseExportedPdfData } from "@/lib/pdfExport";
import { filterOutExistingExpenses } from "@/lib/importDedup";
import { usePresetTransactions } from "@/context/PresetTransactionsContext";
import type { Debt, DebtPayment, Expense, Income } from "@/lib/types";
import { PageTourTrigger } from "@/components/PageTourTrigger";
import { importTourSteps } from "@/lib/pageTourSteps";
import { ImportSourceCard } from "./ImportSourceCard";
import type { SourceChoice } from "@/types/import";
import { ImportPreviewCard } from "./ImportPreviewCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PresetTransaction } from "@/types/core";
import { collectMissingImportMeta, normalizeImportedData } from "@/lib/importNormalize";

export function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSource, setSelectedSource] = useState<SourceChoice>("amex");
  const [previewExpenses, setPreviewExpenses] = useState<Expense[]>([]);
  const [previewIncome, setPreviewIncome] = useState<Income[]>([]);
  const [previewDebts, setPreviewDebts] = useState<Debt[]>([]);
  const [previewDebtPayments, setPreviewDebtPayments] = useState<DebtPayment[]>(
    []
  );
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [lastDetected, setLastDetected] = useState<string>("");
  const [skippedDuplicates, setSkippedDuplicates] = useState<number>(0);
  const [importError, setImportError] = useState<string>("");
  const [missingMetaOpen, setMissingMetaOpen] = useState(false);
  const [missingExpenseCategories, setMissingExpenseCategories] = useState<string[]>([]);
  const [missingIncomeCategories, setMissingIncomeCategories] = useState<string[]>([]);
  const [missingOwners, setMissingOwners] = useState<string[]>([]);
  const [pendingParsed, setPendingParsed] = useState<{
    expenses: Expense[];
    income: Income[];
    debts: Debt[];
    debtPayments: DebtPayment[];
    presetTransactions: PresetTransaction[];
    cardSources: string[];
  } | null>(null);
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
    incomeCategories,
    cardSources,
    setCardSources,
    setExpenseCategories,
    setIncomeCategories,
    setOwners,
    owners,
  } = useBudget();
  const { setPresets } = usePresetTransactions();
  const { t } = useTranslation();

  useEffect(() => {
    if (
      selectedSource !== "pdf-export" &&
      !cardSources.includes(selectedSource)
    ) {
      const firstValid = cardSources.includes("amex")
        ? "amex"
        : cardSources.includes("amex-gold")
        ? "amex-gold"
        : cardSources.includes("apple")
        ? "apple"
        : cardSources.includes("chase")
        ? "chase"
        : "pdf-export";
      setSelectedSource(firstValid as SourceChoice);
    }
  }, [cardSources, selectedSource]);

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
            (ex) => !existingExpenseIds.has(ex.id)
          );
          const toAddIncome = parsed.income.filter((i) => {
            if (income.some((existing) => existing.id === i.id)) return false;
            const sameEntry = income.some(
              (existing) =>
                existing.date === i.date &&
                Math.abs(existing.amount - i.amount) < 0.01 &&
                (existing.category || "").toLowerCase() ===
                  (i.category || "").toLowerCase()
            );
            return !sameEntry;
          });
          const existingDebtIds = new Set(debts.map((d) => d.id));
          const existingPaymentIds = new Set(debtPayments.map((p) => p.id));
          const toAddDebts = parsed.debts.filter(
            (d) => !existingDebtIds.has(d.id)
          );
          const toAddDebtPayments = parsed.debtPayments.filter(
            (p) => !existingPaymentIds.has(p.id)
          );
          const missingMeta = collectMissingImportMeta(
            parsed,
            expenseCategories,
            incomeCategories,
            owners
          );
          if (
            parsed.expenses.length === 0 &&
            parsed.income.length === 0 &&
            parsed.debts.length === 0 &&
            parsed.debtPayments.length === 0 &&
            parsed.presetTransactions.length === 0 &&
            text.trim().length > 0
          ) {
            setImportError(
              "This doesn't look like an exported transactions PDF."
            );
            setPreviewExpenses([]);
            setPreviewIncome([]);
            setLastDetected("");
            setSourceLabel("");
            return;
          }
          if (
            missingMeta.missingExpenseCategories.length > 0 ||
            missingMeta.missingIncomeCategories.length > 0 ||
            missingMeta.missingOwners.length > 0
          ) {
            setMissingExpenseCategories(missingMeta.missingExpenseCategories);
            setMissingIncomeCategories(missingMeta.missingIncomeCategories);
            setMissingOwners(missingMeta.missingOwners);
            setPendingParsed({
              expenses: toAddExpenses,
              income: toAddIncome,
              debts: toAddDebts,
              debtPayments: toAddDebtPayments,
              presetTransactions: parsed.presetTransactions,
              cardSources: parsed.cardSources ?? [],
            });
            setMissingMetaOpen(true);
            return;
          }
          if (parsed.presetTransactions.length > 0) {
            setPresets(parsed.presetTransactions);
          }
          if (
            Array.isArray(parsed.cardSources) &&
            parsed.cardSources.length > 0
          ) {
            setCardSources(parsed.cardSources);
          }
          if (
            Array.isArray(parsed.expenseCategoriesWithColors) &&
            parsed.expenseCategoriesWithColors.length > 0
          ) {
            setExpenseCategories(
              parsed.expenseCategoriesWithColors.map((x) => x.name)
            );
          }
          if (
            Array.isArray(parsed.incomeCategoriesWithColors) &&
            parsed.incomeCategoriesWithColors.length > 0
          ) {
            setIncomeCategories(
              parsed.incomeCategoriesWithColors.map((x) => x.name)
            );
          }
          if (Array.isArray(parsed.owners) && parsed.owners.length > 0) {
            setOwners(parsed.owners);
          }
          setPreviewExpenses(toAddExpenses);
          setPreviewIncome(toAddIncome);
          setPreviewDebts(toAddDebts);
          setPreviewDebtPayments(toAddDebtPayments);
          setSourceLabel("Exported PDF");
          setLastDetected("pdf-export");
          setSkippedDuplicates(0);
        } catch (err) {
          setImportError(
            err instanceof Error ? err.message : "PDF import failed"
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
          setPreviewExpenses(toAdd);
          setPreviewIncome([]);
          setSourceLabel("Chase");
          setLastDetected("chase");
        } catch (err) {
          setImportError(
            err instanceof Error ? err.message : "PDF import failed"
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
          const csvSource: CsvSource =
            selectedSource === "amex" || selectedSource === "amex-gold"
              ? "amex"
              : (selectedSource as CsvSource);
          const result = parseCsv(text, csvSource);
          let toAdd = filterOutExistingExpenses(result.expenses, expenses);
          if (selectedSource === "amex-gold") {
            toAdd = toAdd.map((e) => ({
              ...e,
              source: "amex-gold" as const,
              id: e.id.replace(/^amex-/, "amex-gold-"),
            }));
          } else if (selectedSource === "amex") {
            toAdd = toAdd.map((e) => ({ ...e, source: "amex" as const }));
          }
          setSkippedDuplicates(result.expenses.length - toAdd.length);
          setPreviewExpenses(toAdd);
          setPreviewIncome([]);
          const label =
            selectedSource === "amex"
              ? "Amex Platinum Card"
              : selectedSource === "amex-gold"
              ? "Amex Gold Card"
              : selectedSource === "apple"
              ? "Apple Card"
              : "Chase";
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

  const updatePreviewCategory = (id: string, category: string) => {
    setPreviewExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, category } : e))
    );
  };

  const addToTransactions = () => {
    const expenseCatSet = new Set(expenseCategories);
    const incomeCatSet = new Set(incomeCategories);
    const normalizedExpenses = previewExpenses.map((e) => ({
      ...e,
      category: expenseCatSet.has(e.category) ? e.category : "",
    }));
    const normalizedIncome = previewIncome.map((i) => ({
      ...i,
      category: incomeCatSet.has(i.category) ? i.category : "",
    }));
    addExpenses(normalizedExpenses);
    if (normalizedIncome.length > 0) addIncomes(normalizedIncome);
    if (previewDebts.length > 0) addDebts(previewDebts);
    if (previewDebtPayments.length > 0) addDebtPayments(previewDebtPayments);
    setPreviewExpenses([]);
    setPreviewIncome([]);
    setPreviewDebts([]);
    setPreviewDebtPayments([]);
    setSourceLabel("");
    setLastDetected("");
    setSkippedDuplicates(0);
    setImportError("");
  };

  const applyPendingImport = (normalize: boolean) => {
    if (!pendingParsed) return;
    const normalized = normalize
      ? normalizeImportedData(
          pendingParsed,
          expenseCategories,
          incomeCategories,
          owners
        )
      : {
          expenses: pendingParsed.expenses,
          income: pendingParsed.income,
          debts: pendingParsed.debts,
          presetTransactions: pendingParsed.presetTransactions,
        };

    if (!normalize) {
      if (missingExpenseCategories.length > 0) {
        setExpenseCategories([...expenseCategories, ...missingExpenseCategories]);
      }
      if (missingIncomeCategories.length > 0) {
        setIncomeCategories([...incomeCategories, ...missingIncomeCategories]);
      }
      if (missingOwners.length > 0) {
        setOwners([...owners, ...missingOwners]);
      }
    }

    if (pendingParsed.presetTransactions.length > 0) {
      setPresets(normalized.presetTransactions);
    }
    if (pendingParsed.cardSources.length > 0) {
      setCardSources(pendingParsed.cardSources);
    }

    setPreviewExpenses(normalized.expenses);
    setPreviewIncome(normalized.income);
    setPreviewDebts(normalized.debts);
    setPreviewDebtPayments(pendingParsed.debtPayments);
    setSourceLabel("Exported PDF");
    setLastDetected("pdf-export");
    setSkippedDuplicates(0);
    setMissingMetaOpen(false);
    setPendingParsed(null);
  };

  const hasPreview =
    previewExpenses.length > 0 ||
    previewIncome.length > 0 ||
    previewDebts.length > 0 ||
    previewDebtPayments.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{t("import.title")}</h1>
            <PageTourTrigger pageId="import" steps={importTourSteps} />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("import.subtitle")}
          </p>
        </div>
      </div>
      <div data-tour="uploadCard">
        <ImportSourceCard
          selectedSource={selectedSource}
          onSourceChange={setSelectedSource}
          fileInputRef={fileInputRef}
          accept={
            selectedSource === "chase" || selectedSource === "pdf-export"
              ? ".pdf"
              : ".csv"
          }
          onFileChange={handleFileChange}
          importError={importError}
          lastDetected={lastDetected}
          sourceLabel={sourceLabel}
          previewExpensesCount={previewExpenses.length}
          previewIncomeCount={previewIncome.length}
          previewDebtsCount={previewDebts.length}
          previewDebtPaymentsCount={previewDebtPayments.length}
          skippedDuplicates={skippedDuplicates}
          onAddToTransactions={addToTransactions}
          isPdfExport={lastDetected === "pdf-export"}
          cardSources={cardSources}
          t={t}
        />
      </div>
      {hasPreview && (
        <div data-tour="previewCard">
          <ImportPreviewCard
            previewExpenses={previewExpenses}
            previewIncome={previewIncome}
            previewDebts={previewDebts}
            previewDebtPayments={previewDebtPayments}
            expenseCategories={expenseCategories}
            onUpdateCategory={updatePreviewCategory}
            lastDetected={lastDetected}
            t={t}
          />
        </div>
      )}

      <Dialog open={missingMetaOpen} onOpenChange={setMissingMetaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("import.missingMetaTitle")}</DialogTitle>
            <DialogDescription>{t("import.missingMetaDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {missingExpenseCategories.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  {t("import.missingExpenseCategories")}
                </div>
                <div>{missingExpenseCategories.join(", ")}</div>
              </div>
            )}
            {missingIncomeCategories.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  {t("import.missingIncomeCategories")}
                </div>
                <div>{missingIncomeCategories.join(", ")}</div>
              </div>
            )}
            {missingOwners.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  {t("import.missingOwners")}
                </div>
                <div>{missingOwners.join(", ")}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => applyPendingImport(true)}>
              {t("import.skipMissing")}
            </Button>
            <Button onClick={() => applyPendingImport(false)}>
              {t("import.addMissing")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
