import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import { parseCsv, parseChasePdfFromText, type CsvSource } from "@/lib/parsers";
import { extractTextFromPdf } from "@/lib/pdfText";
import { parseExportedPdfData } from "@/lib/pdfExport";
import { filterOutExistingExpenses } from "@/lib/importDedup";
import {
  applyRulesToExpenses,
  computeTotalsByCategoryForMonth,
} from "@/lib/rules";
import { usePresetTransactions } from "@/context/PresetTransactionsContext";
import { useRules } from "@/context/RulesContext";
import type { Debt, DebtPayment, Expense, Income } from "@/lib/types";
import { PageTourTrigger } from "@/components/PageTourTrigger";
import { importTourSteps } from "@/lib/pageTourSteps";
import { ImportSourceCard, type SourceChoice } from "./ImportSourceCard";
import { ImportPreviewCard } from "./ImportPreviewCard";

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
    cardSources,
    setCardSources,
  } = useBudget();
  const { rules, setRules } = useRules();
  const { setPresets } = usePresetTransactions();
  const { t } = useTranslation();
  const currentMonthKey = new Date().toISOString().slice(0, 7);

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

  const applyRulesForPreview = (incoming: Expense[]) => {
    if (rules.length === 0) return incoming;
    const totals = computeTotalsByCategoryForMonth(
      [...expenses, ...incoming],
      currentMonthKey,
    );
    return applyRulesToExpenses(incoming, rules, {
      totalsByCategory: totals,
      currentMonthKey,
    });
  };

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
            parsed.rules.length === 0 &&
            parsed.presetTransactions.length === 0 &&
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
          if (parsed.rules.length > 0) {
            setRules(parsed.rules);
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
          setPreviewExpenses(applyRulesForPreview(toAddExpenses));
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
          setPreviewExpenses(applyRulesForPreview(toAdd));
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
          setPreviewExpenses(applyRulesForPreview(toAdd));
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
      prev.map((e) => (e.id === id ? { ...e, category } : e)),
    );
  };

  const addToTransactions = () => {
    addExpenses(previewExpenses);
    if (previewIncome.length > 0) addIncomes(previewIncome);
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
          <p className="text-sm text-muted-foreground">{t("import.subtitle")}</p>
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
    </div>
  );
}
