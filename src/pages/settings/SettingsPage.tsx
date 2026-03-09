import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Settings2, CloudCog, CreditCard, Tags, Wallet, Users, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBudget } from "@/context";
import { useGoogleAuth } from "@/context";
import { usePresetTransactions } from "@/context";
import { extractSpreadsheetId } from "genjutsu-db";
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
import { DsSectionHeader } from "@/components/ds";
import { GoogleSheetsCard } from "./GoogleSheetsCard";
import { CardSourcesCard } from "./CardSourcesCard";
import { ExpenseCategoriesCard } from "./ExpenseCategoriesCard";
import { IncomeCategoriesCard } from "./IncomeCategoriesCard";
import { OwnersCard } from "./OwnersCard";
import { storage, STORAGE_KEYS } from "@/lib/platform/storage";
import { cn } from "@/lib/utils";
import type { UiFormatSettings } from "@/lib/format";
import type { TFunction } from "i18next";

const DATE_FORMAT_OPTIONS = [
  { value: "YYYY/MM/DD", label: "YYYY/MM/DD" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
] as const;
const CURRENCY_OPTIONS = DISPLAY_CURRENCIES.map((code) => CURRENCY_META[code]);

type SettingsSection = "general" | "sync" | "card-sources" | "expense-categories" | "income-categories" | "owners" | "danger";

const SECTIONS: { id: SettingsSection; icon: typeof Settings2 }[] = [
  { id: "general", icon: Settings2 },
  { id: "sync", icon: CloudCog },
  { id: "card-sources", icon: CreditCard },
  { id: "expense-categories", icon: Tags },
  { id: "income-categories", icon: Wallet },
  { id: "owners", icon: Users },
  { id: "danger", icon: AlertTriangle },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {children}
    </h3>
  );
}

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
    renameOwner,
    renameExpenseCategory,
    renameIncomeCategory,
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
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  const handleRepairDates = () => {
    const { fixedExpenses, fixedIncome } = repairCorruptedDates();
    setRepairResult(
      fixedExpenses > 0 || fixedIncome > 0
        ? t("settings.repairResultFixed", { fixedExpenses, fixedIncome })
        : t("settings.repairResultNone"),
    );
    setTimeout(() => setRepairResult(null), 5000);
  };

  const handleRenameOwner = (oldName: string, newName: string) => {
    renameOwner(oldName, newName);
    // Also rename in preset transactions
    const changed = presetTransactions.some((p) => p.owner === oldName);
    if (changed) {
      setPresets(
        presetTransactions.map((p) =>
          p.owner === oldName ? { ...p, owner: newName } : p,
        ),
      );
    }
  };

  const handleRenameExpenseCategory = (oldName: string, newName: string) => {
    renameExpenseCategory(oldName, newName);
    // Also rename in preset transactions
    const changed = presetTransactions.some((p) => p.category === oldName);
    if (changed) {
      setPresets(
        presetTransactions.map((p) =>
          p.category === oldName ? { ...p, category: newName } : p,
        ),
      );
    }
  };

  const handleRenameIncomeCategory = (oldName: string, newName: string) => {
    renameIncomeCategory(oldName, newName);
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
    storage.removeItem(STORAGE_KEYS.BUDGET_DATA);
    storage.removeItem(STORAGE_KEYS.PRESET_TRANSACTIONS);
    setDeleteAllConfirmOpen(false);
    window.location.reload();
  };

  const handleReplayTour = () => {
    navigate("/tour?replay=1");
  };

  const sectionLabels: Record<SettingsSection, string> = {
    general: t("settings.preferencesTitle"),
    sync: t("settings.googleSheets"),
    "card-sources": t("settings.cardSources"),
    "expense-categories": t("settings.expenseCategories"),
    "income-categories": t("settings.incomeCategories"),
    owners: t("settings.owners"),
    danger: t("settings.deleteAllData"),
  };

  const selectTriggerClass = "h-10 w-full data-[size=default]:h-10 bg-background/60";

  return (
    <div data-tour-page="settings" className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="mb-2 md:mb-3 px-4 md:px-0 pt-3 md:pt-0 shrink-0 bg-background/95 md:bg-transparent backdrop-blur md:backdrop-blur-none">
        <DsSectionHeader
          title={t("settings.title")}
          subtitle={t("settings.subtitle")}
        />
      </div>

      <div className="flex flex-col md:flex-row flex-1 min-h-0 gap-0 px-4 md:px-0" data-tour="settings-page">
        {/* Sidebar nav — horizontal on mobile, vertical on desktop */}
        <nav className="shrink-0 md:w-56 md:pr-6">
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 md:sticky md:top-0">
            {SECTIONS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  activeSection === id
                    ? "bg-[var(--interactive-primary)] text-[var(--interactive-primary-foreground)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  id === "danger" && activeSection !== id && "text-destructive/70 hover:text-destructive",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {sectionLabels[id]}
              </button>
            ))}
          </div>
        </nav>

        {/* Divider */}
        <div className="hidden md:block w-px bg-[var(--border-subtle)] shrink-0" />

        {/* Content panel */}
        <div className="flex-1 min-h-0 overflow-y-auto md:pl-8 pb-24 md:pb-8">
          {activeSection === "general" && (
            <GeneralSection
              theme={theme}
              setTheme={setTheme}
              uiFormatSettings={uiFormatSettings}
              setUiFormatSettings={setUiFormatSettings}
              useDummyData={useDummyData}
              setUseDummyData={setUseDummyData}
              onReplayTour={handleReplayTour}
              selectTriggerClass={selectTriggerClass}
              t={t}
            />
          )}

          {activeSection === "sync" && (
            <div className="space-y-6">
              <GoogleSheetsCard
                bare
                useDummyData={useDummyData}
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
          )}

          {activeSection === "card-sources" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("settings.cardSourcesDesc")}</p>
              <CardSourcesCard bare />
            </div>
          )}

          {activeSection === "expense-categories" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("settings.expenseCategoriesDesc")}</p>
              <ExpenseCategoriesCard
                bare
                categories={expenseCategories}
                onRemove={handleRemoveExpenseCategory}
                onAdd={handleAddExpenseCategory}
                onRename={handleRenameExpenseCategory}
              />
            </div>
          )}

          {activeSection === "income-categories" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("settings.incomeCategoriesDesc")}</p>
              <IncomeCategoriesCard
                bare
                categories={incomeCategories}
                onRemove={handleRemoveIncomeCategory}
                onAdd={handleAddIncomeCategory}
                onRename={handleRenameIncomeCategory}
              />
            </div>
          )}

          {activeSection === "owners" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("settings.ownersDesc")}</p>
              <OwnersCard
                bare
                owners={owners}
                onRemove={handleRemoveOwner}
                onAdd={handleAddOwner}
                onRename={handleRenameOwner}
              />
            </div>
          )}

          {activeSection === "danger" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("settings.deleteAllDataConfirmDesc", "This action is permanent and cannot be undone.")}
              </p>
              <Button
                variant="outline"
                className="w-full sm:w-auto text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                onClick={() => setDeleteAllConfirmOpen(true)}
              >
                <Trash2 className="size-4 shrink-0" />
                {t("settings.deleteAllData")}
              </Button>
            </div>
          )}
        </div>
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

function GeneralSection({
  theme,
  setTheme,
  uiFormatSettings,
  setUiFormatSettings,
  useDummyData,
  setUseDummyData,
  onReplayTour,
  selectTriggerClass,
  t,
}: {
  theme: string;
  setTheme: (theme: "light" | "dark" | "system") => void;
  uiFormatSettings: UiFormatSettings;
  setUiFormatSettings: (settings: UiFormatSettings) => void;
  useDummyData: boolean;
  setUseDummyData: (value: boolean) => void;
  onReplayTour: () => void;
  selectTriggerClass: string;
  t: TFunction;
}) {
  return (
    <div className="space-y-8">
      {/* Appearance */}
      <section className="space-y-4">
        <SectionHeading>{t("settings.themeTitle", "Appearance")}</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("settings.themeLabel")}</Label>
            <Select
              value={theme}
              onValueChange={(value: "light" | "dark" | "system") =>
                setTheme(value)
              }
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">{t("settings.themeDark")}</SelectItem>
                <SelectItem value="light">{t("settings.themeLight")}</SelectItem>
                <SelectItem value="system">{t("settings.themeSystem")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("settings.currencyDisplayLabel")}</Label>
            <Select
              value={uiFormatSettings.currency}
              onValueChange={(currency: DisplayCurrency) =>
                setUiFormatSettings({ ...uiFormatSettings, currency })
              }
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue>
                  {`${CURRENCY_META[uiFormatSettings.currency].flag} ${uiFormatSettings.currency}`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((meta) => (
                  <SelectItem key={meta.code} value={meta.code}>
                    <span className="flex items-center gap-2">
                      <span>{meta.flag}</span>
                      <span className="flex flex-col">
                        <span className="text-sm leading-tight">{meta.name}</span>
                        <span className="text-[11px] text-muted-foreground leading-tight">{meta.symbol} · {meta.code}</span>
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {uiFormatSettings.currency !== "USD" && (
              <p className="text-[11px] text-muted-foreground">
                {t("settings.fxAsOf", { value: uiFormatSettings.fxAsOf || "\u2014" })}
                {uiFormatSettings.fxFallback ? ` ${t("settings.fxFallback")}` : ""}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="h-px bg-[var(--border-subtle)]" />

      {/* Date format */}
      <section className="space-y-4">
        <SectionHeading>{t("settings.dateFormatTitle", "Date format")}</SectionHeading>
        <div className="max-w-xs space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("settings.dateFormatLabel")}</Label>
          <Select
            value={uiFormatSettings.dateFormat}
            onValueChange={(dateFormat: "YYYY/MM/DD" | "MM/DD/YYYY") =>
              setUiFormatSettings({ ...uiFormatSettings, dateFormat })
            }
          >
            <SelectTrigger className={selectTriggerClass}>
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
          <p className="text-[11px] text-muted-foreground">
            {t("settings.dateFormatPreview", {
              date: formatDate("2026-02-06"),
            })}
          </p>
        </div>
      </section>

      {import.meta.env.DEV && (
        <>
          <div className="h-px bg-[var(--border-subtle)]" />
          <section className="space-y-4">
            <SectionHeading>Developer</SectionHeading>
            <div className="flex items-start gap-3">
              <Checkbox
                id="dummy-data"
                checked={useDummyData}
                onCheckedChange={(checked) => setUseDummyData(checked === true)}
              />
              <div className="space-y-0.5">
                <Label htmlFor="dummy-data" className="text-sm font-medium">
                  {t("settings.useDummyData")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settings.useDummyDataDesc")}
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="h-px bg-[var(--border-subtle)]" />

      {/* Tour */}
      <section className="space-y-3">
        <SectionHeading>{t("settings.replayTour", "Tour")}</SectionHeading>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReplayTour}
          >
            {t("settings.replayTour")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("settings.replayTourDesc")}
          </p>
        </div>
      </section>
    </div>
  );
}
