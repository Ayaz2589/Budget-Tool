import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import { parseCsv, type CsvSource } from "@/lib/parsers";
import { extractTextFromPdf } from "@/lib/pdfText";
import { parseExportedPdfData } from "@/lib/pdfExport";
import { filterOutExistingExpenses } from "@/lib/importDedup";
import { usePresetTransactions } from "@/context/PresetTransactionsContext";
import type { Debt, DebtPayment, Expense, Income } from "@/lib/types";
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
import { parseFromBlob } from "@/lib/minifiedPayload";
import { parseBudgetJson } from "@/lib/jsonExport";
import type { ExpandedPayload } from "@/types/payload";
import type { ParsedExportedPdf } from "@/types/pdf";
import type { InvestmentPortfolio } from "@/types/investments";
import { downloadTransactionsAndIncomePdf } from "@/lib/pdfExport";
import { getCategoryColor } from "@/lib/categoryColors";
import { buildExpandedPayload, downloadBudgetJson } from "@/lib/jsonExport";
import { buildExportString, downloadExportString } from "@/lib/exportString";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { DsActionBar, DsEmptyState, DsSectionHeader } from "@/components/ds";

export function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
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
  const [exportString, setExportString] = useState<string>("");
  const [exportStringError, setExportStringError] = useState<string>("");
  const [jsonImportError, setJsonImportError] = useState<string>("");
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
    investmentPortfolios: InvestmentPortfolio[];
    cardSources: string[];
    sourceLabel: string;
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
    setInvestmentPortfolios,
    owners,
    investmentPortfolios,
  } = useBudget();
  const { setPresets, presetTransactions } = usePresetTransactions();
  const { t } = useTranslation();

  useEffect(() => {
    if (
      selectedSource !== "pdf-export" &&
      !cardSources.includes(selectedSource)
    ) {
      const firstValid =
        cardSources.includes("amex") || cardSources.includes("amex-gold")
          ? "amex"
          : cardSources.includes("chase")
          ? "chase"
          : cardSources.includes("apple")
          ? "apple"
          : "pdf-export";
      setSelectedSource(firstValid as SourceChoice);
    }
  }, [cardSources, selectedSource]);

  const expandedToParsed = (expanded: ExpandedPayload): ParsedExportedPdf => ({
    expenses: Array.isArray(expanded.expenses) ? expanded.expenses : [],
    income: Array.isArray(expanded.income) ? expanded.income : [],
    debts: Array.isArray(expanded.debts) ? expanded.debts : [],
    debtPayments: Array.isArray(expanded.debtPayments) ? expanded.debtPayments : [],
    presetTransactions: Array.isArray(expanded.presetTransactions)
      ? expanded.presetTransactions
      : [],
    expenseCategoriesWithColors: expanded.expenseCategoriesWithColors,
    incomeCategoriesWithColors: expanded.incomeCategoriesWithColors,
    owners: expanded.owners,
    cardSources: expanded.cardSources,
    investmentPortfolios: expanded.investmentPortfolios,
  });

  const handleParsedExport = (
    parsed: ParsedExportedPdf,
    label: string
  ) => {
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
    const toAddDebts = parsed.debts.filter((d) => !existingDebtIds.has(d.id));
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
        investmentPortfolios: parsed.investmentPortfolios ?? [],
        cardSources: parsed.cardSources ?? [],
        sourceLabel: label,
      });
      setMissingMetaOpen(true);
      return;
    }

    if (parsed.presetTransactions.length > 0) {
      setPresets(parsed.presetTransactions);
    }
    if (Array.isArray(parsed.investmentPortfolios)) {
      setInvestmentPortfolios(parsed.investmentPortfolios);
    }
    if (Array.isArray(parsed.cardSources) && parsed.cardSources.length > 0) {
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
    setSourceLabel(label);
    setLastDetected("pdf-export");
    setSkippedDuplicates(0);
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
          if (
            parsed.expenses.length === 0 &&
            parsed.income.length === 0 &&
            parsed.debts.length === 0 &&
            parsed.debtPayments.length === 0 &&
            parsed.presetTransactions.length === 0 &&
            text.trim().length > 0
          ) {
            setImportError(t("import.exportedPdfInvalid"));
            setPreviewExpenses([]);
            setPreviewIncome([]);
            setLastDetected("");
            setSourceLabel("");
            return;
          }
          handleParsedExport(parsed, t("import.exportedPdf"));
        } catch (err) {
          setImportError(
            err instanceof Error ? err.message : t("import.pdfImportFailed")
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
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result);
          const csvSource: CsvSource =
            selectedSource === "amex" ? "amex" : (selectedSource as CsvSource);
          const result = parseCsv(text, csvSource);
          let toAdd = filterOutExistingExpenses(result.expenses, expenses);
          if (selectedSource === "amex") {
            const source =
              cardSources.includes("amex") ? "amex" : "amex-gold";
            toAdd = toAdd.map((e) => ({ ...e, source }));
          }
          setSkippedDuplicates(result.expenses.length - toAdd.length);
          setPreviewExpenses(toAdd);
          setPreviewIncome([]);
          const label =
            selectedSource === "amex"
              ? t("import.amexCard")
              : selectedSource === "chase"
              ? t("import.chaseCard")
              : selectedSource === "apple"
              ? t("import.appleCard")
              : t("import.chooseCsvFile");
          setSourceLabel(label);
          setLastDetected(selectedSource);
        } catch (err) {
          setImportError(err instanceof Error ? err.message : t("import.importFailed"));
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

  const handleExportStringImport = () => {
    setExportStringError("");
    setImportError("");
    const raw = exportString.trim();
    if (!raw) {
      setExportStringError(t("import.exportStringPasteFirst"));
      return;
    }
    try {
      let parsed: ParsedExportedPdf | null = null;
      if (raw.includes("BUDGET_TOOL_DATA_START")) {
        parsed = parseExportedPdfData(raw);
      } else if (raw.replace(/\s/g, "").startsWith("V2")) {
        const expanded = parseFromBlob(raw);
        parsed = expandedToParsed(expanded);
      }
      if (
        !parsed ||
        (parsed.expenses.length === 0 &&
          parsed.income.length === 0 &&
          parsed.debts.length === 0 &&
          parsed.debtPayments.length === 0 &&
          parsed.presetTransactions.length === 0)
      ) {
        setExportStringError(t("import.exportStringNotRecognized"));
        return;
      }
      handleParsedExport(parsed, t("import.importExportString"));
    } catch (err) {
      setExportStringError(
        err instanceof Error ? err.message : t("import.exportStringImportFailed")
      );
    }
  };

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJsonImportError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        const expanded = parseBudgetJson(text);
        const parsed = expandedToParsed(expanded);
        if (
          parsed.expenses.length === 0 &&
          parsed.income.length === 0 &&
          parsed.debts.length === 0 &&
          parsed.debtPayments.length === 0 &&
          parsed.presetTransactions.length === 0
        ) {
          setJsonImportError(t("import.jsonNoData"));
          return;
        }
        handleParsedExport(parsed, t("import.importJson"));
      } catch (err) {
        setJsonImportError(
          err instanceof Error ? err.message : t("import.jsonImportFailed")
        );
      }
    };
    reader.readAsText(file, "UTF-8");
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

  const handleDownloadPdf = () => {
    const expenseCategoriesWithColors = expenseCategories.map((name) => ({
      name,
      color: getCategoryColor(name, "expense"),
    }));
    const incomeCategoriesWithColors = incomeCategories.map((name) => ({
      name,
      color: getCategoryColor(name, "income"),
    }));
    downloadTransactionsAndIncomePdf(
      expenses,
      income,
      debts,
      debtPayments,
      presetTransactions,
      expenseCategoriesWithColors,
      incomeCategoriesWithColors,
      owners,
      cardSources,
    );
  };

  const handleDownloadJson = () => {
    const expenseCategoriesWithColors = expenseCategories.map((name) => ({
      name,
      color: getCategoryColor(name, "expense"),
    }));
    const incomeCategoriesWithColors = incomeCategories.map((name) => ({
      name,
      color: getCategoryColor(name, "income"),
    }));
    const payload = buildExpandedPayload(
      expenses,
      income,
      debts,
      debtPayments,
      presetTransactions,
      expenseCategoriesWithColors,
      incomeCategoriesWithColors,
      owners,
      cardSources,
      investmentPortfolios,
    );
    downloadBudgetJson(payload);
  };

  const handleDownloadExportString = () => {
    const expenseCategoriesWithColors = expenseCategories.map((name) => ({
      name,
      color: getCategoryColor(name, "expense"),
    }));
    const incomeCategoriesWithColors = incomeCategories.map((name) => ({
      name,
      color: getCategoryColor(name, "income"),
    }));
    const exportString = buildExportString(
      expenses,
      income,
      debts,
      debtPayments,
      presetTransactions,
      expenseCategoriesWithColors,
      incomeCategoriesWithColors,
      owners,
      cardSources,
    );
    downloadExportString(exportString);
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
    setInvestmentPortfolios(pendingParsed.investmentPortfolios);
    if (pendingParsed.cardSources.length > 0) {
      setCardSources(pendingParsed.cardSources);
    }

    setPreviewExpenses(normalized.expenses);
    setPreviewIncome(normalized.income);
    setPreviewDebts(normalized.debts);
    setPreviewDebtPayments(pendingParsed.debtPayments);
    setSourceLabel(pendingParsed.sourceLabel);
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
  const primaryAddLabel = t(
    lastDetected === "pdf-export" ? "import.addAll" : "import.addToTransactions",
  );
  const importStatusText = lastDetected
    ? `${sourceLabel} · ${t("import.rowsToAddSummary", {
        count:
          lastDetected === "pdf-export"
            ? previewExpenses.length +
              previewIncome.length +
              previewDebts.length +
              previewDebtPayments.length
            : previewExpenses.length,
      })}${
        lastDetected === "pdf-export"
          ? ` (${t("import.existingIdsOmitted")})`
          : skippedDuplicates > 0
            ? ` (${t("import.duplicatesSkipped", { count: skippedDuplicates })})`
            : ""
      }`
    : "";

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="mb-3 px-4 md:px-0 pt-4 md:pt-0 shrink-0 bg-background/95 md:bg-transparent backdrop-blur md:backdrop-blur-none">
        <DsSectionHeader
          title={t("import.title")}
          subtitle={t("import.subtitle")}
          actions={
            hasPreview ? (
              <Button className="hidden md:inline-flex" onClick={addToTransactions}>
                {primaryAddLabel}
              </Button>
            ) : undefined
          }
        />
      </div>
      <div className="space-y-6 pb-24 md:pb-0 px-4 md:px-0">
      <div>
        <ImportSourceCard
          selectedSource={selectedSource}
          onSourceChange={setSelectedSource}
          fileInputRef={fileInputRef}
          accept={selectedSource === "pdf-export" ? ".pdf" : ".csv"}
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
          statusText={importStatusText}
          showPrimaryAction={false}
          primaryActionLabel={primaryAddLabel}
        />
      </div>
      <Card className="md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
        <div className="px-4 py-4 md:px-0 md:py-0">
          <DsSectionHeader
            title={t("import.exportStringTitle")}
            subtitle={t("import.exportStringDesc")}
            titleClassName="text-lg md:text-xl"
            subtitleClassName="text-xs md:text-sm"
          />
        </div>
        <CardContent className="space-y-3 px-4 md:px-0">
          <textarea
            value={exportString}
            onChange={(e) => setExportString(e.target.value)}
            placeholder={t("import.exportStringPlaceholder")}
            className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {exportStringError && (
            <span className="text-sm text-destructive block">
              {exportStringError}
            </span>
          )}
          <Button onClick={handleExportStringImport} className="w-full md:w-auto">
            {t("import.importExportString")}
          </Button>
        </CardContent>
      </Card>
      <Card className="md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
        <div className="px-4 py-4 md:px-0 md:py-0">
          <DsSectionHeader
            title={t("import.jsonImportTitle")}
            subtitle={t("import.jsonImportDesc")}
            titleClassName="text-lg md:text-xl"
            subtitleClassName="text-xs md:text-sm"
          />
        </div>
        <CardContent className="space-y-3 px-4 md:px-0">
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleJsonFileChange}
          />
          <Button
            onClick={() => jsonInputRef.current?.click()}
            className="w-full md:w-auto"
          >
            {t("import.importJson")}
          </Button>
          {jsonImportError && (
            <span className="text-sm text-destructive block">
              {jsonImportError}
            </span>
          )}
        </CardContent>
      </Card>
      <Card className="md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
        <div className="px-4 py-4 md:px-0 md:py-0">
          <DsSectionHeader
            title={t("import.exportTitle")}
            subtitle={t("import.exportDesc")}
            titleClassName="text-lg md:text-xl"
            subtitleClassName="text-xs md:text-sm"
          />
        </div>
        <CardContent className="flex flex-col md:flex-row gap-2 px-4 md:px-0">
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            className="w-full md:w-auto"
          >
            {t("import.downloadPdf")}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadJson}
            className="w-full md:w-auto"
          >
            {t("import.downloadJson")}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadExportString}
            className="w-full md:w-auto"
          >
            {t("import.downloadExportString")}
          </Button>
        </CardContent>
      </Card>
      {hasPreview && (
        <div>
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
      {!hasPreview && !importError && !jsonImportError && !exportStringError ? (
        <Card className="md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
          <CardContent className="px-0">
            <DsEmptyState
              title={t("import.previewTitle")}
              description={t("import.emptyStateDescription")}
            />
          </CardContent>
        </Card>
      ) : null}

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
      {hasPreview ? (
        <DsActionBar>
          <Button onClick={addToTransactions}>{primaryAddLabel}</Button>
        </DsActionBar>
      ) : null}
    </div>
  );
}
