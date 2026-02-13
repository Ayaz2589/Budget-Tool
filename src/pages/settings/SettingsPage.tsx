import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBudget } from "@/context";
import { useGoogleAuth } from "@/context";
import { usePresetTransactions } from "@/context";
import { extractSpreadsheetId } from "@/lib/googleSheets";
import { formatDate } from "@/lib/format";
import { useTheme } from "@/hooks/useTheme";
import {
  CURRENCY_META,
  DISPLAY_CURRENCIES,
  type DisplayCurrency,
} from "@/types/currency";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { DsSectionHeader } from "@/components/ds";
import { GoogleSheetsCard } from "./GoogleSheetsCard";
import { CardSourcesCard } from "./CardSourcesCard";
import { ExpenseCategoriesCard } from "./ExpenseCategoriesCard";
import { IncomeCategoriesCard } from "./IncomeCategoriesCard";
import { OwnersCard } from "./OwnersCard";

const BUDGET_STORAGE_KEY = "budget-tool-data";
const PRESET_STORAGE_KEY = "budget-tool-preset-transactions";
const DATE_FORMAT_OPTIONS = [
  { value: "YYYY/MM/DD", label: "YYYY/MM/DD" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
] as const;
const CURRENCY_OPTIONS = DISPLAY_CURRENCIES.map((code) => ({
  value: code,
  label: CURRENCY_META[code].label,
})) as ReadonlyArray<{ value: DisplayCurrency; label: string }>;

export function SettingsPage() {
  const {
    expenseCategories,
    incomeCategories,
    owners,
    setExpenseCategories,
    setIncomeCategories,
    setOwners,
    repairCorruptedDates,
    uiFormatSettings,
    setUiFormatSettings,
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
    isAutoSyncEnabled,
    setAutoSyncEnabled,
    lastSyncAt,
    hasUnsyncedChanges,
    syncHealth,
  } = useGoogleAuth();
  const { presetTransactions, setPresets } = usePresetTransactions();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [sheetIdInput, setSheetIdInput] = useState(spreadsheetId ?? "");
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [repairResult, setRepairResult] = useState<string | null>(null);

  const handleRepairDates = () => {
    const { fixedExpenses, fixedIncome } = repairCorruptedDates();
    setRepairResult(
      fixedExpenses > 0 || fixedIncome > 0
        ? t("settings.repairResultFixed", { fixedExpenses, fixedIncome })
        : t("settings.repairResultNone"),
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
      <div className="mb-3 px-4 md:px-0 pt-4 md:pt-0 shrink-0 bg-background/95 md:bg-transparent backdrop-blur md:backdrop-blur-none">
        <DsSectionHeader
          title={t("settings.title")}
          subtitle={t("settings.subtitle")}
        />
      </div>
      <div className="space-y-4 sm:space-y-6 pb-24 md:pb-0 px-4 md:px-0">

      <div>
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
          isAutoSyncEnabled={isAutoSyncEnabled}
          onAutoSyncToggle={setAutoSyncEnabled}
          lastSyncAt={lastSyncAt}
          hasUnsyncedChanges={hasUnsyncedChanges}
          syncHealth={syncHealth}
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
        <Card className="md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
          <CardContent className="rounded-xl border border-border/70 bg-card/40 p-4 md:p-5">
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/60 p-3">
              <Checkbox
                id="dummy-data"
                checked={useDummyData}
                onCheckedChange={(checked) => setUseDummyData(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="dummy-data" className="text-sm font-medium">
                  {t("settings.useDummyData")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settings.useDummyDataDesc")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
        <CardContent className="rounded-xl border border-border/70 bg-card/40 p-4 md:p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">{t("settings.themeTitle")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("settings.themeDesc")}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{t("settings.themeLabel")}</Label>
            <Select
              value={theme}
              onValueChange={(value: "light" | "dark" | "system") =>
                setTheme(value)
              }
            >
              <SelectTrigger className="h-11 w-full data-[size=default]:h-11 bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">{t("settings.themeDark")}</SelectItem>
                <SelectItem value="light">{t("settings.themeLight")}</SelectItem>
                <SelectItem value="system">{t("settings.themeSystem")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold">{t("settings.currencyTitle")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("settings.currencyDesc")}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{t("settings.currencyDisplayLabel")}</Label>
            <Select
              value={uiFormatSettings.currency}
              onValueChange={(currency: DisplayCurrency) =>
                setUiFormatSettings({ ...uiFormatSettings, currency })
              }
            >
              <SelectTrigger className="h-11 w-full data-[size=default]:h-11 bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {uiFormatSettings.currency !== "USD" && (
            <p className="text-xs text-muted-foreground">
              {t("settings.fxAsOf", { value: uiFormatSettings.fxAsOf || "—" })}
              {uiFormatSettings.fxFallback ? ` ${t("settings.fxFallback")}` : ""}
            </p>
          )}

          <div className="space-y-1">
            <h3 className="text-sm font-semibold">{t("settings.dateFormatTitle")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("settings.dateFormatDesc")}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{t("settings.dateFormatLabel")}</Label>
            <Select
              value={uiFormatSettings.dateFormat}
              onValueChange={(dateFormat: "YYYY/MM/DD" | "MM/DD/YYYY") =>
                setUiFormatSettings({ ...uiFormatSettings, dateFormat })
              }
            >
              <SelectTrigger className="h-11 w-full data-[size=default]:h-11 bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("settings.dateFormatPreview", {
              date: formatDate("2026-02-06"),
            })}
          </p>
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:w-auto"
              onClick={() => navigate("/tour?replay=1")}
            >
              {t("settings.replayTour")}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("settings.replayTourDesc")}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 sm:space-y-6">
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

      <div className="pt-4 border-t sm:pt-6">
        <Button
          variant="outline"
          className="h-11 w-full sm:w-auto text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
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
