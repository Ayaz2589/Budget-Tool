import { useReducer, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context";
import { usePresetTransactions } from "@/context";
import { parseCsv, type CsvSource } from "@/lib/parsers";
import { extractTextFromPdf } from "@/lib/export/pdfText";
import { parseExportedPdfData } from "@/lib/export/pdfExport";
import { filterOutExistingExpenses } from "@/lib/import/importDedup";
import { amountsWithinTolerance } from "@/lib/math";
import { collectMissingImportMeta } from "@/lib/import/importNormalize";
import { parseFromBlob } from "@/lib/export/minifiedPayload";
import { parseBudgetJson } from "@/lib/export/jsonExport";
import { isDisplayCurrency } from "@/types/currency";
import { getCategoryColor } from "@/lib/format/categoryColors";
import { downloadTransactionsAndIncomePdf } from "@/lib/export/pdfExport";
import { buildExpandedPayload, downloadBudgetJson } from "@/lib/export/jsonExport";
import { buildExportString, downloadExportString } from "@/lib/export/exportString";
import type { Debt, DebtPayment, Expense, Income } from "@/lib/types";
import type { OwnerTransfer, PresetTransaction } from "@/types/core";
import type { SourceChoice } from "@/types/import";
import type { ExpandedPayload } from "@/types/payload";
import type { ParsedExportedPdf } from "@/types/pdf";

interface ImportState {
  selectedSource: SourceChoice;
  previewExpenses: Expense[];
  previewIncome: Income[];
  previewDebts: Debt[];
  previewDebtPayments: DebtPayment[];
  previewOwnerTransfers: OwnerTransfer[];
  sourceLabel: string;
  lastDetected: string;
  skippedDuplicates: number;
  importError: string;
  exportString: string;
  exportStringError: string;
  jsonImportError: string;
  missingMetaOpen: boolean;
  missingExpenseCategories: string[];
  missingIncomeCategories: string[];
  missingOwners: string[];
  pendingParsed: {
    expenses: Expense[];
    income: Income[];
    debts: Debt[];
    debtPayments: DebtPayment[];
    ownerTransfers: OwnerTransfer[];
    presetTransactions: PresetTransaction[];
    cardSources: string[];
    sourceLabel: string;
  } | null;
}

type ImportAction =
  | { type: "SET_SELECTED_SOURCE"; payload: SourceChoice }
  | { type: "SET_EXPORT_STRING"; payload: string }
  | { type: "SET_IMPORT_ERROR"; payload: string }
  | { type: "SET_EXPORT_STRING_ERROR"; payload: string }
  | { type: "SET_JSON_IMPORT_ERROR"; payload: string }
  | { type: "SET_MISSING_META_OPEN"; payload: boolean }
  | {
      type: "SET_PREVIEW";
      payload: {
        previewExpenses: Expense[];
        previewIncome: Income[];
        previewDebts: Debt[];
        previewDebtPayments: DebtPayment[];
        previewOwnerTransfers: OwnerTransfer[];
        sourceLabel: string;
        lastDetected: string;
        skippedDuplicates: number;
      };
    }
  | { type: "CLEAR_PREVIEW" }
  | { type: "UPDATE_PREVIEW_CATEGORY"; payload: { id: string; category: string } }
  | {
      type: "SET_MISSING_META";
      payload: {
        missingExpenseCategories: string[];
        missingIncomeCategories: string[];
        missingOwners: string[];
        pendingParsed: ImportState["pendingParsed"];
      };
    }
  | { type: "CLEAR_PENDING_PARSED" };

const initialState: ImportState = {
  selectedSource: "amex",
  previewExpenses: [],
  previewIncome: [],
  previewDebts: [],
  previewDebtPayments: [],
  previewOwnerTransfers: [],
  sourceLabel: "",
  lastDetected: "",
  skippedDuplicates: 0,
  importError: "",
  exportString: "",
  exportStringError: "",
  jsonImportError: "",
  missingMetaOpen: false,
  missingExpenseCategories: [],
  missingIncomeCategories: [],
  missingOwners: [],
  pendingParsed: null,
};

function importReducer(state: ImportState, action: ImportAction): ImportState {
  switch (action.type) {
    case "SET_SELECTED_SOURCE":
      return { ...state, selectedSource: action.payload };
    case "SET_EXPORT_STRING":
      return { ...state, exportString: action.payload };
    case "SET_IMPORT_ERROR":
      return { ...state, importError: action.payload };
    case "SET_EXPORT_STRING_ERROR":
      return { ...state, exportStringError: action.payload };
    case "SET_JSON_IMPORT_ERROR":
      return { ...state, jsonImportError: action.payload };
    case "SET_MISSING_META_OPEN":
      return { ...state, missingMetaOpen: action.payload };
    case "SET_PREVIEW":
      return {
        ...state,
        previewExpenses: action.payload.previewExpenses,
        previewIncome: action.payload.previewIncome,
        previewDebts: action.payload.previewDebts,
        previewDebtPayments: action.payload.previewDebtPayments,
        previewOwnerTransfers: action.payload.previewOwnerTransfers,
        sourceLabel: action.payload.sourceLabel,
        lastDetected: action.payload.lastDetected,
        skippedDuplicates: action.payload.skippedDuplicates,
        importError: "",
      };
    case "CLEAR_PREVIEW":
      return {
        ...state,
        previewExpenses: [],
        previewIncome: [],
        previewDebts: [],
        previewDebtPayments: [],
        previewOwnerTransfers: [],
        sourceLabel: "",
        lastDetected: "",
        skippedDuplicates: 0,
        importError: "",
      };
    case "UPDATE_PREVIEW_CATEGORY":
      return {
        ...state,
        previewExpenses: state.previewExpenses.map((e) =>
          e.id === action.payload.id ? { ...e, category: action.payload.category } : e,
        ),
      };
    case "SET_MISSING_META":
      return {
        ...state,
        missingExpenseCategories: action.payload.missingExpenseCategories,
        missingIncomeCategories: action.payload.missingIncomeCategories,
        missingOwners: action.payload.missingOwners,
        pendingParsed: action.payload.pendingParsed,
        missingMetaOpen: true,
      };
    case "CLEAR_PENDING_PARSED":
      return {
        ...state,
        pendingParsed: null,
        missingMetaOpen: false,
      };
    default:
      return state;
  }
}

export function useImportState() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [state, dispatch] = useReducer(importReducer, initialState);
  const {
    expenses,
    income,
    debts,
    debtPayments,
    addExpenses,
    addIncomes,
    addDebts,
    addDebtPayments,
    addOwnerTransfer,
    expenseCategories,
    incomeCategories,
    cardSources,
    setCardSources,
    setOwners,
    owners,
    ownerTransfers,
    uiFormatSettings,
    setUiFormatSettings,
  } = useBudget();
  const { setPresets, presetTransactions } = usePresetTransactions();
  const { t } = useTranslation();

  useEffect(() => {
    if (
      state.selectedSource !== "pdf-export" &&
      !cardSources.includes(state.selectedSource)
    ) {
      const firstValid =
        cardSources.includes("amex") || cardSources.includes("amex-gold")
          ? "amex"
          : cardSources.includes("chase")
          ? "chase"
          : cardSources.includes("apple")
          ? "apple"
          : "pdf-export";
      dispatch({ type: "SET_SELECTED_SOURCE", payload: firstValid as SourceChoice });
    }
  }, [cardSources, state.selectedSource]);

  const expandedToParsed = (expanded: ExpandedPayload): ParsedExportedPdf => ({
    expenses: Array.isArray(expanded.expenses) ? expanded.expenses : [],
    income: Array.isArray(expanded.income) ? expanded.income : [],
    debts: Array.isArray(expanded.debts) ? expanded.debts : [],
    debtPayments: Array.isArray(expanded.debtPayments) ? expanded.debtPayments : [],
    ownerTransfers: Array.isArray(expanded.ownerTransfers)
      ? expanded.ownerTransfers
      : [],
    presetTransactions: Array.isArray(expanded.presetTransactions)
      ? expanded.presetTransactions
      : [],
    expenseCategoriesWithColors: expanded.expenseCategoriesWithColors,
    incomeCategoriesWithColors: expanded.incomeCategoriesWithColors,
    owners: expanded.owners,
    cardSources: expanded.cardSources,
    displayCurrency: expanded.displayCurrency,
    baseCurrency: expanded.baseCurrency,
    fxAsOf: expanded.fxAsOf,
  });

  const hasParsedRows = (parsed: ParsedExportedPdf): boolean =>
    parsed.expenses.length > 0 ||
    parsed.income.length > 0 ||
    parsed.debts.length > 0 ||
    parsed.debtPayments.length > 0 ||
    (parsed.ownerTransfers?.length ?? 0) > 0 ||
    parsed.presetTransactions.length > 0;

  const handleParsedExport = (
    parsed: ParsedExportedPdf,
    label: string,
  ) => {
    const existingExpenseIds = new Set(expenses.map((ex) => ex.id));
    const toAddExpenses = parsed.expenses.filter(
      (ex) => !existingExpenseIds.has(ex.id),
    );
    const toAddIncome = parsed.income.filter((i) => {
      if (income.some((existing) => existing.id === i.id)) return false;
      const sameEntry = income.some(
        (existing) =>
          existing.date === i.date &&
          amountsWithinTolerance(existing.amount, i.amount, 0.01) &&
          (existing.category || "").toLowerCase() ===
            (i.category || "").toLowerCase(),
      );
      return !sameEntry;
    });
    const existingDebtIds = new Set(debts.map((d) => d.id));
    const existingPaymentIds = new Set(debtPayments.map((p) => p.id));
    const existingTransferIds = new Set(ownerTransfers.map((row) => row.id));
    const toAddDebts = parsed.debts.filter((d) => !existingDebtIds.has(d.id));
    const toAddDebtPayments = parsed.debtPayments.filter(
      (p) => !existingPaymentIds.has(p.id),
    );
    const toAddOwnerTransfers = (parsed.ownerTransfers ?? []).filter(
      (row) => !existingTransferIds.has(row.id),
    );
    const missingMeta = collectMissingImportMeta(
      parsed,
      expenseCategories,
      incomeCategories,
      owners,
    );
    if (
      missingMeta.missingExpenseCategories.length > 0 ||
      missingMeta.missingIncomeCategories.length > 0 ||
      missingMeta.missingOwners.length > 0
    ) {
      dispatch({
        type: "SET_MISSING_META",
        payload: {
          missingExpenseCategories: missingMeta.missingExpenseCategories,
          missingIncomeCategories: missingMeta.missingIncomeCategories,
          missingOwners: missingMeta.missingOwners,
          pendingParsed: {
            expenses: toAddExpenses,
            income: toAddIncome,
            debts: toAddDebts,
            debtPayments: toAddDebtPayments,
            ownerTransfers: toAddOwnerTransfers,
            presetTransactions: parsed.presetTransactions,
            cardSources: parsed.cardSources ?? [],
            sourceLabel: label,
          },
        },
      });
      return;
    }

    if (parsed.presetTransactions.length > 0) {
      setPresets(parsed.presetTransactions);
    }
    if (Array.isArray(parsed.cardSources) && parsed.cardSources.length > 0) {
      setCardSources(parsed.cardSources);
    }
    // Categories are now preset from the registry — no need to import them
    if (Array.isArray(parsed.owners) && parsed.owners.length > 0) {
      setOwners(parsed.owners);
    }
    if (isDisplayCurrency(parsed.displayCurrency)) {
      setUiFormatSettings({
        ...uiFormatSettings,
        currency: parsed.displayCurrency,
        baseCurrency: "USD",
        fxRate: uiFormatSettings.fxRate,
        fxAsOf: parsed.fxAsOf ?? uiFormatSettings.fxAsOf,
      });
    }
    dispatch({
      type: "SET_PREVIEW",
      payload: {
        previewExpenses: toAddExpenses,
        previewIncome: toAddIncome,
        previewDebts: toAddDebts,
        previewDebtPayments: toAddDebtPayments,
        previewOwnerTransfers: toAddOwnerTransfers,
        sourceLabel: label,
        lastDetected: "pdf-export",
        skippedDuplicates: 0,
      },
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    dispatch({ type: "SET_IMPORT_ERROR", payload: "" });
    if (state.selectedSource === "pdf-export") {
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
            (parsed.ownerTransfers?.length ?? 0) === 0 &&
            parsed.presetTransactions.length === 0 &&
            text.trim().length > 0
          ) {
            dispatch({ type: "SET_IMPORT_ERROR", payload: t("import.exportedPdfInvalid") });
            dispatch({ type: "CLEAR_PREVIEW" });
            return;
          }
          handleParsedExport(parsed, t("import.exportedPdf"));
        } catch (err) {
          dispatch({
            type: "SET_IMPORT_ERROR",
            payload: err instanceof Error ? err.message : t("import.pdfImportFailed"),
          });
          dispatch({ type: "CLEAR_PREVIEW" });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result);
          const csvSource: CsvSource =
            state.selectedSource === "amex" ? "amex" : (state.selectedSource as CsvSource);
          const result = parseCsv(text, csvSource);
          if (result.error) {
            dispatch({
              type: "SET_IMPORT_ERROR",
              payload: t("import.unknownCsvFormat"),
            });
            dispatch({ type: "CLEAR_PREVIEW" });
            return;
          }
          let toAdd = filterOutExistingExpenses(result.expenses, expenses);
          if (state.selectedSource === "amex") {
            const source =
              cardSources.includes("amex") ? "amex" : "amex-gold";
            toAdd = toAdd.map((e) => ({ ...e, source }));
          }
          const label =
            state.selectedSource === "amex"
              ? t("import.amexCard")
              : state.selectedSource === "chase"
              ? t("import.chaseCard")
              : state.selectedSource === "apple"
              ? t("import.appleCard")
              : t("import.chooseCsvFile");
          dispatch({
            type: "SET_PREVIEW",
            payload: {
              previewExpenses: toAdd,
              previewIncome: [],
              previewDebts: [],
              previewDebtPayments: [],
              previewOwnerTransfers: [],
              sourceLabel: label,
              lastDetected: state.selectedSource,
              skippedDuplicates: result.expenses.length - toAdd.length,
            },
          });
        } catch (err) {
          dispatch({
            type: "SET_IMPORT_ERROR",
            payload: err instanceof Error ? err.message : t("import.importFailed"),
          });
          dispatch({ type: "CLEAR_PREVIEW" });
        }
      };
      reader.readAsText(file, "UTF-8");
    }
    e.target.value = "";
  };

  const handleExportStringImport = () => {
    dispatch({ type: "SET_EXPORT_STRING_ERROR", payload: "" });
    dispatch({ type: "SET_IMPORT_ERROR", payload: "" });
    const raw = state.exportString.trim();
    if (!raw) {
      dispatch({ type: "SET_EXPORT_STRING_ERROR", payload: t("import.exportStringPasteFirst") });
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
      if (!parsed || !hasParsedRows(parsed)) {
        dispatch({ type: "SET_EXPORT_STRING_ERROR", payload: t("import.exportStringNotRecognized") });
        return;
      }
      handleParsedExport(parsed, t("import.importExportString"));
    } catch (err) {
      dispatch({
        type: "SET_EXPORT_STRING_ERROR",
        payload: err instanceof Error ? err.message : t("import.exportStringImportFailed"),
      });
    }
  };

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    dispatch({ type: "SET_JSON_IMPORT_ERROR", payload: "" });
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        const expanded = parseBudgetJson(text);
        const parsed = expandedToParsed(expanded);
        if (!hasParsedRows(parsed)) {
          dispatch({ type: "SET_JSON_IMPORT_ERROR", payload: t("import.jsonNoData") });
          return;
        }
        handleParsedExport(parsed, t("import.importJson"));
      } catch (err) {
        dispatch({
          type: "SET_JSON_IMPORT_ERROR",
          payload: err instanceof Error ? err.message : t("import.jsonImportFailed"),
        });
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const updatePreviewCategory = (id: string, category: string) => {
    dispatch({ type: "UPDATE_PREVIEW_CATEGORY", payload: { id, category } });
  };

  const addToTransactions = () => {
    const expenseCatSet = new Set(expenseCategories);
    const incomeCatSet = new Set(incomeCategories);
    const normalizedExpenses = state.previewExpenses.map((e) => ({
      ...e,
      category: expenseCatSet.has(e.category) ? e.category : "",
    }));
    const normalizedIncome = state.previewIncome.map((i) => ({
      ...i,
      category: incomeCatSet.has(i.category) ? i.category : "",
    }));
    addExpenses(normalizedExpenses);
    if (normalizedIncome.length > 0) addIncomes(normalizedIncome);
    if (state.previewDebts.length > 0) addDebts(state.previewDebts);
    if (state.previewDebtPayments.length > 0) addDebtPayments(state.previewDebtPayments);
    if (state.previewOwnerTransfers.length > 0) {
      state.previewOwnerTransfers.forEach((row) =>
        addOwnerTransfer({
          id: row.id,
          date: row.date,
          fromOwner: row.fromOwner,
          toOwner: row.toOwner,
          amount: row.amount,
          note: row.note,
        }),
      );
    }
    dispatch({ type: "CLEAR_PREVIEW" });
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
      ownerTransfers,
      uiFormatSettings.currency,
      "USD",
      uiFormatSettings.fxAsOf,
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
    const result = buildExportString(
      expenses,
      income,
      debts,
      debtPayments,
      presetTransactions,
      expenseCategoriesWithColors,
      incomeCategoriesWithColors,
      owners,
      cardSources,
      ownerTransfers,
      uiFormatSettings.currency,
      "USD",
      uiFormatSettings.fxAsOf,
    );
    downloadExportString(result);
  };

  const applyPendingImport = (
    selected?: {
      expenseCategories: string[];
      incomeCategories: string[];
      owners: string[];
    },
  ) => {
    if (!state.pendingParsed) return;

    const addExpCats = selected?.expenseCategories ?? state.missingExpenseCategories;
    const addIncCats = selected?.incomeCategories ?? state.missingIncomeCategories;
    const addOwnersList = selected?.owners ?? state.missingOwners;

    // Categories are now preset from the registry — skip category imports
    if (addOwnersList.length > 0) {
      setOwners([...owners, ...addOwnersList]);
    }

    const skipExpCats = new Set(
      state.missingExpenseCategories.filter((c) => !addExpCats.includes(c)),
    );
    const skipIncCats = new Set(
      state.missingIncomeCategories.filter((c) => !addIncCats.includes(c)),
    );

    const resultExpenses = state.pendingParsed.expenses.map((e) =>
      skipExpCats.has(e.category) ? { ...e, category: "" } : e,
    );
    const resultIncome = state.pendingParsed.income.map((i) =>
      skipIncCats.has(i.category) ? { ...i, category: "" } : i,
    );

    if (state.pendingParsed.presetTransactions.length > 0) {
      setPresets(state.pendingParsed.presetTransactions);
    }
    if (state.pendingParsed.cardSources.length > 0) {
      setCardSources(state.pendingParsed.cardSources);
    }

    dispatch({
      type: "SET_PREVIEW",
      payload: {
        previewExpenses: resultExpenses,
        previewIncome: resultIncome,
        previewDebts: state.pendingParsed.debts,
        previewDebtPayments: state.pendingParsed.debtPayments,
        previewOwnerTransfers: state.pendingParsed.ownerTransfers,
        sourceLabel: state.pendingParsed.sourceLabel,
        lastDetected: "pdf-export",
        skippedDuplicates: 0,
      },
    });
    dispatch({ type: "CLEAR_PENDING_PARSED" });
  };

  const setSelectedSource = (source: SourceChoice) => {
    dispatch({ type: "SET_SELECTED_SOURCE", payload: source });
  };

  const setExportString = (value: string) => {
    dispatch({ type: "SET_EXPORT_STRING", payload: value });
  };

  const setMissingMetaOpen = (open: boolean) => {
    dispatch({ type: "SET_MISSING_META_OPEN", payload: open });
  };

  const hasPreview =
    state.previewExpenses.length > 0 ||
    state.previewIncome.length > 0 ||
    state.previewDebts.length > 0 ||
    state.previewDebtPayments.length > 0 ||
    state.previewOwnerTransfers.length > 0;

  const primaryAddLabel = t(
    state.lastDetected === "pdf-export" ? "import.addAll" : "import.addToTransactions",
  );

  const importStatusText = state.lastDetected
    ? `${state.sourceLabel} \u00B7 ${t("import.rowsToAddSummary", {
        count:
          state.lastDetected === "pdf-export"
            ? state.previewExpenses.length +
              state.previewIncome.length +
              state.previewDebts.length +
              state.previewDebtPayments.length +
              state.previewOwnerTransfers.length
            : state.previewExpenses.length,
      })}${
        state.lastDetected === "pdf-export"
          ? ` (${t("import.existingIdsOmitted")})`
          : state.skippedDuplicates > 0
            ? ` (${t("import.duplicatesSkipped", { count: state.skippedDuplicates })})`
            : ""
      }`
    : "";

  return {
    // refs
    fileInputRef,
    jsonInputRef,
    // state
    ...state,
    // derived
    hasPreview,
    primaryAddLabel,
    importStatusText,
    expenseCategories,
    cardSources,
    // actions
    setSelectedSource,
    setExportString,
    setMissingMetaOpen,
    handleFileChange,
    handleExportStringImport,
    handleJsonFileChange,
    updatePreviewCategory,
    addToTransactions,
    handleDownloadPdf,
    handleDownloadJson,
    handleDownloadExportString,
    applyPendingImport,
    t,
  };
}
