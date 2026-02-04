import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import { usePresetTransactions } from "@/context/PresetTransactionsContext";
import { extractSpreadsheetId } from "@/lib/googleSheets";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageTourTrigger } from "@/components/PageTourTrigger";
import { settingsTourSteps } from "@/lib/pageTourSteps";
import { GoogleSheetsCard } from "./GoogleSheetsCard";
import { CardSourcesCard } from "./CardSourcesCard";
import { ExpenseCategoriesCard } from "./ExpenseCategoriesCard";
import { IncomeCategoriesCard } from "./IncomeCategoriesCard";
import { OwnersCard } from "./OwnersCard";

const BUDGET_STORAGE_KEY = "budget-tool-data";
const PRESET_STORAGE_KEY = "budget-tool-preset-transactions";

export function SettingsPage() {
  const {
    expenseCategories,
    incomeCategories,
    owners,
    setExpenseCategories,
    setIncomeCategories,
    setOwners,
    repairCorruptedDates,
    useDummyData,
    setUseDummyData,
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
  const { presetTransactions, setPresets } = usePresetTransactions();
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
    const presetsWithoutCategory = presetTransactions.filter(
      (p) => p.category !== category,
    );
    if (presetsWithoutCategory.length !== presetTransactions.length) {
      setPresets(presetsWithoutCategory);
    }
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

  const handleRemoveOwner = (owner: string) => {
    setOwners(owners.filter((o) => o !== owner));
    const changed = presetTransactions.some((p) => p.owner === owner);
    if (changed) {
      const presetsWithoutOwner = presetTransactions.map((p) =>
        p.owner === owner ? { ...p, owner: "" } : p
      );
      setPresets(presetsWithoutOwner);
    }
  };

  const handleAddOwner = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !owners.includes(trimmed)) {
      setOwners([...owners, trimmed]);
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
    localStorage.removeItem(PRESET_STORAGE_KEY);
    setDeleteAllConfirmOpen(false);
    window.location.reload();
  };

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="hidden md:flex flex-wrap items-start justify-between gap-2 shrink-0 mb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold sm:text-2xl">{t("settings.title")}</h1>
            <PageTourTrigger pageId="settings" steps={settingsTourSteps} />
          </div>
          <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
        </div>
      </div>
      <div className="md:hidden mb-3 px-4 pt-4 shrink-0 bg-background/95 backdrop-blur">
        <div className="px-0 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{t("settings.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("settings.subtitle")}
            </p>
          </div>
          <PageTourTrigger pageId="settings" steps={settingsTourSteps} />
        </div>
      </div>
      <div className="space-y-4 sm:space-y-6 pb-24 md:pb-0">

      <div data-tour="googleSheets">
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
      </div>

      {import.meta.env.DEV && (
        <div className="rounded-lg border border-border/60 p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="dummy-data"
              checked={useDummyData}
              onCheckedChange={(checked) => setUseDummyData(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="dummy-data" className="text-sm font-medium">
                Use dummy data (dev only)
              </Label>
              <p className="text-xs text-muted-foreground">
                Loads sample data across the entire app without touching your real
                storage.
              </p>
            </div>
          </div>
        </div>
      )}

      <div data-tour="categories" className="space-y-4 sm:space-y-6">
        <CardSourcesCard />

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

        <OwnersCard
          owners={owners}
          onRemove={handleRemoveOwner}
          onAdd={handleAddOwner}
        />
      </div>

      <div className="pt-4 border-t sm:pt-6" data-tour="deleteAll">
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
    </div>
  );
}
