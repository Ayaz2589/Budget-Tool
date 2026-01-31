import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import { extractSpreadsheetId } from "@/lib/googleSheets";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoogleSheetsCard } from "./GoogleSheetsCard";
import { ExpenseCategoriesCard } from "./ExpenseCategoriesCard";
import { IncomeCategoriesCard } from "./IncomeCategoriesCard";

const BUDGET_STORAGE_KEY = "budget-tool-data";
const RULES_STORAGE_KEY = "budget-tool-rules";
const PRESET_STORAGE_KEY = "budget-tool-preset-transactions";

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

  const [sheetIdInput, setSheetIdInput] = useState(spreadsheetId ?? "");
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
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

  const handleRemoveExpenseCategory = (category: string) => {
    setExpenseCategories(expenseCategories.filter((c) => c !== category));
  };

  const handleAddExpenseCategory = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !expenseCategories.includes(trimmed)) {
      setExpenseCategories([...expenseCategories, trimmed]);
    }
  };

  const handleRemoveIncomeCategory = (category: string) => {
    setIncomeCategories(incomeCategories.filter((c) => c !== category));
  };

  const handleAddIncomeCategory = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !incomeCategories.includes(trimmed)) {
      setIncomeCategories([...incomeCategories, trimmed]);
    }
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

  const handleDeleteAllData = () => {
    localStorage.removeItem(BUDGET_STORAGE_KEY);
    localStorage.removeItem(RULES_STORAGE_KEY);
    localStorage.removeItem(PRESET_STORAGE_KEY);
    setDeleteAllConfirmOpen(false);
    window.location.reload();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold sm:text-2xl">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

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
        categories={expenseCategories}
        onRemove={handleRemoveExpenseCategory}
        onAdd={handleAddExpenseCategory}
      />

      <IncomeCategoriesCard
        categories={incomeCategories}
        onRemove={handleRemoveIncomeCategory}
        onAdd={handleAddIncomeCategory}
      />

      <div className="pt-4 border-t sm:pt-6">
        <Button
          variant="outline"
          className="w-full sm:w-auto text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
          onClick={() => setDeleteAllConfirmOpen(true)}
        >
          <Trash2 className="size-4 shrink-0" />
          {t("settings.deleteAllData")}
        </Button>
      </div>

      <Dialog
        open={deleteAllConfirmOpen}
        onOpenChange={setDeleteAllConfirmOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.deleteAllDataConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("settings.deleteAllDataConfirmDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteAllConfirmOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAllData}
            >
              <Trash2 className="size-4" />
              {t("settings.deleteAllData")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
