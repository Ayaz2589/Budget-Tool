import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/context/BudgetContext";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import { extractSpreadsheetId } from "@/lib/googleSheets";
import { GoogleSheetsCard } from "@/pages/settings/GoogleSheetsCard";
import { ExpenseCategoriesCard } from "@/pages/settings/ExpenseCategoriesCard";
import { IncomeCategoriesCard } from "@/pages/settings/IncomeCategoriesCard";

export function SettingsPage() {
  const {
    expenseCategories,
    incomeCategories,
    setExpenseCategories,
    setIncomeCategories,
    repairCorruptedDates,
  } = useBudget();
  const {
    isSignedIn,
    signIn,
    signOut,
    spreadsheetId,
    setSpreadsheetId,
    syncToSheets,
    pullFromSheet,
    syncStatus,
    syncErrorMessage,
  } = useGoogleAuth();
  const { t } = useTranslation();

  const [expenseList, setExpenseList] = useState(expenseCategories.join(", "));
  const [incomeList, setIncomeList] = useState(incomeCategories.join(", "));
  const [sheetIdInput, setSheetIdInput] = useState(spreadsheetId ?? "");
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [repairResult, setRepairResult] = useState<string | null>(null);

  const handleRepairDates = () => {
    const { fixedExpenses, fixedIncome } = repairCorruptedDates();
    setRepairResult(
      fixedExpenses > 0 || fixedIncome > 0
        ? `Repaired ${fixedExpenses} expense(s) and ${fixedIncome} income entry(ies).`
        : "No corrupted dates found.",
    );
    setTimeout(() => setRepairResult(null), 5000);
  };

  const saveExpenseCategories = () => {
    const list = expenseList
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length > 0) setExpenseCategories(list);
  };

  const saveIncomeCategories = () => {
    const list = incomeList
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length > 0) setIncomeCategories(list);
  };

  const handleSetSpreadsheetId = () => {
    const trimmed = sheetIdInput.trim();
    if (trimmed) {
      const id = trimmed.includes("/")
        ? extractSpreadsheetId(trimmed)
        : trimmed;
      if (id) setSpreadsheetId(id);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>

      <GoogleSheetsCard
        isSignedIn={isSignedIn}
        signIn={signIn}
        signOut={signOut}
        spreadsheetId={spreadsheetId ?? undefined}
        sheetIdInput={sheetIdInput}
        onSheetIdChange={setSheetIdInput}
        onSetSheetId={handleSetSpreadsheetId}
        syncToSheets={syncToSheets}
        pullFromSheet={pullFromSheet}
        syncStatus={syncStatus}
        syncErrorMessage={syncErrorMessage ?? undefined}
        onRepairDates={handleRepairDates}
        repairResult={repairResult}
        syncConfirmOpen={syncConfirmOpen}
        setSyncConfirmOpen={setSyncConfirmOpen}
        restoreConfirmOpen={restoreConfirmOpen}
        setRestoreConfirmOpen={setRestoreConfirmOpen}
        t={t}
      />

      <ExpenseCategoriesCard
        value={expenseList}
        onChange={setExpenseList}
        onSave={saveExpenseCategories}
      />

      <IncomeCategoriesCard
        value={incomeList}
        onChange={setIncomeList}
        onSave={saveIncomeCategories}
      />
    </div>
  );
}
