import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import i18n from "@/i18n";
import { useBudget } from "./BudgetContext";
import { usePresetTransactions } from "./PresetTransactionsContext";
import { computeAllTotals, computeGrandTotals } from "@/lib/totals";
import { createSheetsClient, isSheetsDbError } from "@/lib/sheets-db";
import { serializeToBlob, parseFromBlob } from "@/lib/minifiedPayload";
import { getCategoryColor } from "@/lib/categoryColors";
import { isMortgageCategory } from "@/lib/mortgageCategory";
import { isDisplayCurrency } from "@/types/currency";
import { isSpreadsheetActive } from "@/lib/googleDrive";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import type { SyncHealth, SyncStatus } from "@/types/auth";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTO_SYNC_DEBOUNCE_MS = 2_000;
const AUTO_SYNC_INTERVAL_MS = 5 * 60_000;
const SYNC_RATE_LIMIT_BASE_DELAY_MS = 3_000;
const SYNC_RATE_LIMIT_MAX_DELAY_MS = 30_000;

// ---------------------------------------------------------------------------
// Sync state machine (replaces 10+ useRef declarations)
// ---------------------------------------------------------------------------

interface SyncMachineState {
  status: SyncStatus;
  errorMessage: string | null;
  health: SyncHealth;
  lastSyncAt: number | null;
  hasUnsyncedChanges: boolean;
  isAutoSyncEnabled: boolean;
}

type SyncMachineAction =
  | { type: "START_SYNC" }
  | { type: "SYNC_SUCCESS"; timestamp: number; hasUnsyncedChanges: boolean }
  | {
      type: "SYNC_ERROR";
      message: string;
      health: SyncHealth;
      status?: SyncStatus;
    }
  | { type: "SET_UNSYNCED"; hasUnsyncedChanges: boolean; health: SyncHealth }
  | { type: "SET_AUTO_SYNC"; enabled: boolean }
  | { type: "RESET_UNSYNCED" }
  | { type: "RESET" };

function syncMachineReducer(
  state: SyncMachineState,
  action: SyncMachineAction,
): SyncMachineState {
  switch (action.type) {
    case "START_SYNC":
      return { ...state, status: "syncing", errorMessage: null };
    case "SYNC_SUCCESS":
      return {
        ...state,
        status: "success",
        errorMessage: null,
        health: "healthy",
        lastSyncAt: action.timestamp,
        hasUnsyncedChanges: action.hasUnsyncedChanges,
      };
    case "SYNC_ERROR":
      return {
        ...state,
        status: action.status ?? "error",
        errorMessage: action.message,
        health: action.health,
      };
    case "SET_UNSYNCED":
      return {
        ...state,
        hasUnsyncedChanges: action.hasUnsyncedChanges,
        health: action.health,
      };
    case "SET_AUTO_SYNC":
      return { ...state, isAutoSyncEnabled: action.enabled };
    case "RESET_UNSYNCED":
      return { ...state, hasUnsyncedChanges: false, health: "healthy" };
    case "RESET":
      return {
        status: "idle",
        errorMessage: null,
        health: "healthy",
        lastSyncAt: null,
        hasUnsyncedChanges: false,
        isAutoSyncEnabled: state.isAutoSyncEnabled,
      };
  }
}

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

function isUnauthorizedError(err: unknown): boolean {
  if (isSheetsDbError(err)) return err.kind === "AUTH_ERROR";
  if (err instanceof Error) {
    return err.message.includes("401") || err.message.includes(" 401 ");
  }
  return false;
}

function isRateLimitError(err: unknown): boolean {
  if (isSheetsDbError(err)) return err.kind === "RATE_LIMIT";
  if (!(err instanceof Error)) return false;
  return (
    err.message.includes("429") ||
    err.message.includes("RATE_LIMIT_EXCEEDED") ||
    err.message.includes("RESOURCE_EXHAUSTED")
  );
}

// ---------------------------------------------------------------------------
// Context value type
// ---------------------------------------------------------------------------

export interface SyncContextValue {
  syncStatus: SyncStatus;
  syncErrorMessage: string | null;
  syncHealth: SyncHealth;
  lastSyncAt: number | null;
  hasUnsyncedChanges: boolean;
  isAutoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
  syncToSheets: () => Promise<void>;
  pullFromSheet: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SyncProvider({
  children,
  accessToken,
  spreadsheetId,
  setSpreadsheetId,
  clearSession,
  consumeInitialSyncFlag,
}: {
  children: ReactNode;
  accessToken: string | null;
  spreadsheetId: string | null;
  setSpreadsheetId: (id: string | null) => void;
  clearSession: () => void;
  consumeInitialSyncFlag: () => boolean;
}) {
  const budget = useBudget();
  const isDummyDataActive = budget.useDummyData;
  const { presetTransactions, setPresets } = usePresetTransactions();

  const [syncState, dispatchSync] = useReducer(syncMachineReducer, {
    status: "idle",
    errorMessage: null,
    health: "healthy",
    lastSyncAt: null,
    hasUnsyncedChanges: false,
    isAutoSyncEnabled:
      storage.getItem(STORAGE_KEYS.AUTO_SYNC_ENABLED) !== "false",
  });

  // Refs for sync orchestration
  const latestSyncSignatureRef = useRef<string>("");
  const lastSyncedSignatureRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const syncQueuedRef = useRef(false);
  const nextSyncAllowedAtRef = useRef(0);
  const retryBackoffMsRef = useRef(SYNC_RATE_LIMIT_BASE_DELAY_MS);
  const retryTimerRef = useRef<number | null>(null);

  // Sync signature (used for change detection)
  const syncSignature = useMemo(
    () =>
      JSON.stringify({
        expenses: budget.expenses,
        income: budget.income,
        debts: budget.debts,
        debtPayments: budget.debtPayments,
        ownerTransfers: budget.ownerTransfers,
        presetTransactions,
        expenseCategories: budget.expenseCategories,
        incomeCategories: budget.incomeCategories,
        owners: budget.owners,
        cardSources: budget.cardSources,
        ownerBalances: budget.ownerBalances,
      }),
    [
      budget.expenses,
      budget.income,
      budget.debts,
      budget.debtPayments,
      budget.ownerTransfers,
      presetTransactions,
      budget.expenseCategories,
      budget.incomeCategories,
      budget.owners,
      budget.cardSources,
      budget.ownerBalances,
    ],
  );

  useEffect(() => {
    latestSyncSignatureRef.current = syncSignature;
  }, [syncSignature]);

  const getSyncSnapshot = useCallback(() => {
    const expenseCategoriesWithColors = budget.expenseCategories.map(
      (name) => ({
        name,
        color: getCategoryColor(name, "expense"),
      }),
    );
    const incomeCategoriesWithColors = budget.incomeCategories.map((name) => ({
      name,
      color: getCategoryColor(name, "income"),
    }));

    return {
      signature: latestSyncSignatureRef.current,
      expenses: budget.expenses,
      income: budget.income,
      debts: budget.debts,
      debtPayments: budget.debtPayments,
      ownerTransfers: budget.ownerTransfers,
      presetTransactions,
      expenseCategoriesWithColors,
      incomeCategoriesWithColors,
      owners: budget.owners,
      cardSources: budget.cardSources,
      ownerBalances: budget.ownerBalances,
      displayCurrency: budget.uiFormatSettings.currency,
      baseCurrency: "USD" as const,
      fxAsOf: budget.uiFormatSettings.fxAsOf,
    };
  }, [
    budget.expenses,
    budget.income,
    budget.debts,
    budget.debtPayments,
    budget.ownerTransfers,
    presetTransactions,
    budget.expenseCategories,
    budget.incomeCategories,
    budget.owners,
    budget.cardSources,
    budget.ownerBalances,
    budget.uiFormatSettings.currency,
    budget.uiFormatSettings.fxAsOf,
  ]);

  const ensureLinkedSheetActive = useCallback(async (): Promise<boolean> => {
    if (!accessToken || !spreadsheetId) return false;
    const active = await isSpreadsheetActive(accessToken, spreadsheetId);
    if (active) return true;

    dispatchSync({
      type: "SYNC_ERROR",
      message: i18n.t("auth.sheetInTrashOrMissing"),
      health: "error",
    });
    setSpreadsheetId(null);
    return false;
  }, [accessToken, spreadsheetId, setSpreadsheetId]);

  // Reset sync refs when spreadsheet changes
  const resetSyncRefs = useCallback(() => {
    latestSyncSignatureRef.current = "";
    lastSyncedSignatureRef.current = null;
    syncQueuedRef.current = false;
    nextSyncAllowedAtRef.current = 0;
    retryBackoffMsRef.current = SYNC_RATE_LIMIT_BASE_DELAY_MS;
    if (retryTimerRef.current != null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  // Reset sync state when spreadsheet or access token changes
  useEffect(() => {
    if (!spreadsheetId) {
      resetSyncRefs();
    }
  }, [spreadsheetId, resetSyncRefs]);

  const runSync = useCallback(async () => {
    if (isDummyDataActive) {
      dispatchSync({
        type: "SYNC_ERROR",
        message: i18n.t("auth.dummyDataSyncBlocked"),
        health: "warning",
      });
      return;
    }
    if (!accessToken || !spreadsheetId) {
      dispatchSync({
        type: "SYNC_ERROR",
        message: i18n.t("auth.notSignedInOrNoSpreadsheet"),
        health: "error",
      });
      return;
    }
    if (inFlightRef.current) {
      syncQueuedRef.current = true;
      return;
    }
    const active = await ensureLinkedSheetActive();
    if (!active) return;
    const now = Date.now();
    if (nextSyncAllowedAtRef.current > now) {
      syncQueuedRef.current = true;
      if (retryTimerRef.current == null) {
        retryTimerRef.current = window.setTimeout(() => {
          retryTimerRef.current = null;
          void runSync();
        }, nextSyncAllowedAtRef.current - now);
      }
      return;
    }
    inFlightRef.current = true;
    dispatchSync({ type: "START_SYNC" });
    try {
      const snapshot = getSyncSnapshot();
      const db = createSheetsClient({ token: accessToken, spreadsheetId });
      await db.ensureSchema();
      const nonMortgageExpenses = snapshot.expenses.filter(
        (e) => !isMortgageCategory(e.category),
      );
      const mortgageExpenses = snapshot.expenses.filter((e) =>
        isMortgageCategory(e.category),
      );
      const dataBlob = serializeToBlob({
        expenses: snapshot.expenses,
        income: snapshot.income,
        debts: snapshot.debts,
        debtPayments: snapshot.debtPayments,
        ownerTransfers: snapshot.ownerTransfers,
        presetTransactions: snapshot.presetTransactions,
        expenseCategoriesWithColors: snapshot.expenseCategoriesWithColors,
        incomeCategoriesWithColors: snapshot.incomeCategoriesWithColors,
        owners: snapshot.owners,
        cardSources: snapshot.cardSources,
        displayCurrency: snapshot.displayCurrency,
        baseCurrency: snapshot.baseCurrency,
        fxAsOf: snapshot.fxAsOf,
      });
      const months = computeAllTotals({
        expenses: snapshot.expenses,
        income: snapshot.income,
        ownerBalancesByMonth: snapshot.ownerBalances,
        owners: snapshot.owners,
      });
      const grand = computeGrandTotals(months);
      await db.batchSync({
        expenses: nonMortgageExpenses,
        mortgageExpenses,
        income: snapshot.income,
        debts: snapshot.debts,
        debtPayments: snapshot.debtPayments,
        ownerTransfers: snapshot.ownerTransfers,
        presetTransactions: snapshot.presetTransactions,
        dataBlob,
        months,
        grandTotal: grand,
      });
      const sheetIds = await db.getSheetIds();
      if (sheetIds) {
        await db.applyFormatting(sheetIds);
      }
      lastSyncedSignatureRef.current = snapshot.signature;
      const changed =
        latestSyncSignatureRef.current !== lastSyncedSignatureRef.current;
      dispatchSync({
        type: "SYNC_SUCCESS",
        timestamp: Date.now(),
        hasUnsyncedChanges: changed,
      });
      retryBackoffMsRef.current = SYNC_RATE_LIMIT_BASE_DELAY_MS;
      nextSyncAllowedAtRef.current = 0;
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSession();
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error("Sync failed:", err);
      if (isRateLimitError(err)) {
        syncQueuedRef.current = true;
        nextSyncAllowedAtRef.current =
          Date.now() + retryBackoffMsRef.current;
        retryBackoffMsRef.current = Math.min(
          retryBackoffMsRef.current * 2,
          SYNC_RATE_LIMIT_MAX_DELAY_MS,
        );
        dispatchSync({
          type: "SYNC_ERROR",
          message:
            "Rate limited by Google Sheets, retrying automatically.",
          health: "warning",
          status: "idle",
        });
      } else {
        dispatchSync({
          type: "SYNC_ERROR",
          message,
          health: "error",
        });
      }
    } finally {
      inFlightRef.current = false;
      const shouldRunAgain =
        syncQueuedRef.current ||
        latestSyncSignatureRef.current !== lastSyncedSignatureRef.current;
      if (shouldRunAgain) {
        const waitMs = Math.max(
          0,
          nextSyncAllowedAtRef.current - Date.now(),
        );
        if (waitMs > 0) {
          if (retryTimerRef.current == null) {
            retryTimerRef.current = window.setTimeout(() => {
              retryTimerRef.current = null;
              syncQueuedRef.current = false;
              void runSync();
            }, waitMs);
          }
        } else {
          syncQueuedRef.current = false;
          void runSync();
        }
      }
    }
  }, [
    accessToken,
    spreadsheetId,
    isDummyDataActive,
    clearSession,
    getSyncSnapshot,
    ensureLinkedSheetActive,
  ]);

  const syncToSheets = useCallback(async () => {
    await runSync();
  }, [runSync]);

  // Change detection
  useEffect(() => {
    if (isDummyDataActive) {
      dispatchSync({ type: "RESET_UNSYNCED" });
      return;
    }
    if (!accessToken || !spreadsheetId) {
      dispatchSync({ type: "RESET_UNSYNCED" });
      lastSyncedSignatureRef.current = null;
      nextSyncAllowedAtRef.current = 0;
      retryBackoffMsRef.current = SYNC_RATE_LIMIT_BASE_DELAY_MS;
      if (retryTimerRef.current != null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      return;
    }
    if (lastSyncedSignatureRef.current == null) {
      lastSyncedSignatureRef.current = latestSyncSignatureRef.current;
      return;
    }
    const changed =
      latestSyncSignatureRef.current !== lastSyncedSignatureRef.current;
    dispatchSync({
      type: "SET_UNSYNCED",
      hasUnsyncedChanges: changed,
      health: changed ? "warning" : "healthy",
    });
  }, [accessToken, spreadsheetId, syncSignature, isDummyDataActive]);

  // Auto-sync debounce
  useEffect(() => {
    if (!syncState.isAutoSyncEnabled) return;
    if (isDummyDataActive) return;
    if (!accessToken || !spreadsheetId) return;
    if (!syncState.hasUnsyncedChanges) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "hidden") return;
      void runSync();
    }, AUTO_SYNC_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [
    syncState.isAutoSyncEnabled,
    isDummyDataActive,
    accessToken,
    spreadsheetId,
    syncState.hasUnsyncedChanges,
    runSync,
  ]);

  // Initial sync after sheet creation
  useEffect(() => {
    if (isDummyDataActive) {
      consumeInitialSyncFlag();
      return;
    }
    if (!accessToken || !spreadsheetId) return;
    if (consumeInitialSyncFlag()) {
      void runSync();
    }
  }, [
    accessToken,
    spreadsheetId,
    runSync,
    isDummyDataActive,
    consumeInitialSyncFlag,
  ]);

  // Auto-sync interval
  useEffect(() => {
    if (!syncState.isAutoSyncEnabled) return;
    if (isDummyDataActive) return;
    if (!accessToken || !spreadsheetId) return;
    const interval = window.setInterval(() => {
      if (!syncState.hasUnsyncedChanges) return;
      if (document.visibilityState === "hidden") return;
      void runSync();
    }, AUTO_SYNC_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [
    syncState.isAutoSyncEnabled,
    isDummyDataActive,
    accessToken,
    spreadsheetId,
    syncState.hasUnsyncedChanges,
    runSync,
  ]);

  // Pull from sheet
  const pullFromSheet = useCallback(async () => {
    if (isDummyDataActive) {
      dispatchSync({
        type: "SYNC_ERROR",
        message: i18n.t("auth.dummyDataSyncBlocked"),
        health: "warning",
      });
      return;
    }
    if (!accessToken || !spreadsheetId) {
      dispatchSync({
        type: "SYNC_ERROR",
        message: i18n.t("auth.notSignedInOrNoSpreadsheet"),
        health: "error",
      });
      return;
    }
    const active = await ensureLinkedSheetActive();
    if (!active) return;
    dispatchSync({ type: "START_SYNC" });
    try {
      const db = createSheetsClient({ token: accessToken, spreadsheetId });
      await db.ensureSchema();

      const expenseKey = (e: {
        date: string;
        description: string;
        amount: number;
      }) => `${e.date}|${e.description}|${e.amount}`;
      const incomeKey = (i: {
        date: string;
        description: string;
        amount: number;
      }) => `${i.date}|${i.description}|${i.amount}`;

      const appExpenseKeys = new Set(
        budget.expenses.map((e) => expenseKey(e)),
      );
      const appIncomeKeys = new Set(budget.income.map((i) => incomeKey(i)));
      const appDebtIds = new Set(budget.debts.map((d) => d.id));
      const appPaymentIds = new Set(budget.debtPayments.map((p) => p.id));
      const appTransferIds = new Set(
        budget.ownerTransfers.map((t) => t.id),
      );

      let sheetExpenses: typeof budget.expenses;
      let sheetMortgage: typeof budget.expenses;
      let sheetIncome: typeof budget.income;
      let sheetDebts: typeof budget.debts;
      let sheetPayments: typeof budget.debtPayments;
      let sheetOwnerTransfers: typeof budget.ownerTransfers;
      let sheetPresets: typeof presetTransactions;

      const blob = await db.dataBlob.read();
      if (blob && blob.startsWith("V2")) {
        try {
          const expanded = parseFromBlob(blob);
          const allExpenses = expanded.expenses ?? [];
          sheetExpenses = allExpenses.filter(
            (e) => !isMortgageCategory(e.category),
          );
          sheetMortgage = allExpenses.filter((e) =>
            isMortgageCategory(e.category),
          );
          sheetIncome = expanded.income ?? [];
          sheetDebts = expanded.debts ?? [];
          sheetPayments = expanded.debtPayments ?? [];
          sheetOwnerTransfers = expanded.ownerTransfers ?? [];
          sheetPresets = expanded.presetTransactions ?? [];
          if (
            Array.isArray(expanded.cardSources) &&
            expanded.cardSources.length > 0
          ) {
            budget.setCardSources(expanded.cardSources);
          }
          if (Array.isArray(expanded.expenseCategoriesWithColors)) {
            budget.setExpenseCategories(
              expanded.expenseCategoriesWithColors.map((x) => x.name),
            );
          }
          if (Array.isArray(expanded.incomeCategoriesWithColors)) {
            budget.setIncomeCategories(
              expanded.incomeCategoriesWithColors.map((x) => x.name),
            );
          }
          if (Array.isArray(expanded.owners)) {
            budget.setOwners(expanded.owners);
          }
          if (isDisplayCurrency(expanded.displayCurrency)) {
            budget.setUiFormatSettings({
              ...budget.uiFormatSettings,
              currency: expanded.displayCurrency,
              baseCurrency: "USD",
              fxRate: budget.uiFormatSettings.fxRate,
              fxAsOf: expanded.fxAsOf ?? budget.uiFormatSettings.fxAsOf,
            });
          }
        } catch {
          const [
            expenses,
            mortgage,
            income,
            debts,
            payments,
            ownerTransfers,
            presets,
          ] = await Promise.all([
            db.expenses.readAll(),
            db.expenses.readMortgage(),
            db.income.readAll(),
            db.debts.readAll(),
            db.debtPayments.readAll(),
            db.ownerTransfers.readAll(),
            db.presets.readAll(),
          ]);
          sheetExpenses = expenses;
          sheetMortgage = mortgage;
          sheetIncome = income;
          sheetDebts = debts;
          sheetPayments = payments;
          sheetOwnerTransfers = ownerTransfers;
          sheetPresets = presets;
          const derivedOwners = [
            ...new Set(
              [...expenses, ...mortgage]
                .map((e) => e.owner)
                .concat(income.map((i) => i.owner))
                .concat(debts.map((d) => d.owner))
                .concat(ownerTransfers.map((row) => row.fromOwner))
                .concat(ownerTransfers.map((row) => row.toOwner))
                .filter((o): o is string => !!o),
            ),
          ];
          if (derivedOwners.length > 0) {
            budget.setOwners(derivedOwners);
          }
        }
      } else {
        [
          sheetExpenses,
          sheetMortgage,
          sheetIncome,
          sheetDebts,
          sheetPayments,
          sheetOwnerTransfers,
          sheetPresets,
        ] = await Promise.all([
          db.expenses.readAll(),
          db.expenses.readMortgage(),
          db.income.readAll(),
          db.debts.readAll(),
          db.debtPayments.readAll(),
          db.ownerTransfers.readAll(),
          db.presets.readAll(),
        ]);
        const derivedOwners = [
          ...new Set(
            [...sheetExpenses, ...sheetMortgage]
              .map((e) => e.owner)
              .concat(sheetIncome.map((i) => i.owner))
              .concat(sheetDebts.map((d) => d.owner))
              .concat(sheetOwnerTransfers.map((row) => row.fromOwner))
              .concat(sheetOwnerTransfers.map((row) => row.toOwner))
              .filter((o): o is string => !!o),
          ),
        ];
        if (derivedOwners.length > 0) {
          budget.setOwners(derivedOwners);
        }
      }

      const newExpenses = sheetExpenses.filter(
        (e) => !appExpenseKeys.has(expenseKey(e)),
      );
      const mortgageSheetKeys = new Set(
        sheetMortgage.map((e) => expenseKey(e)),
      );
      const mortgageRepairs = budget.expenses.filter(
        (e) =>
          mortgageSheetKeys.has(expenseKey(e)) &&
          !isMortgageCategory(e.category),
      );
      for (const repair of mortgageRepairs) {
        budget.updateExpense(repair.id, { category: "Mortgage" });
      }
      const newMortgage = sheetMortgage.filter(
        (e) => !appExpenseKeys.has(expenseKey(e)),
      );
      const newIncome = sheetIncome.filter(
        (i) => !appIncomeKeys.has(incomeKey(i)),
      );

      const additionalExpenseCategories = [
        ...new Set(
          sheetExpenses
            .map((e) => (e.category || "").trim())
            .filter(
              (category) =>
                category.length > 0 &&
                !isMortgageCategory(category) &&
                !budget.expenseCategories.includes(category),
            ),
        ),
      ];
      if (additionalExpenseCategories.length > 0) {
        budget.setExpenseCategories([
          ...budget.expenseCategories,
          ...additionalExpenseCategories,
        ]);
      }

      const additionalIncomeCategories = [
        ...new Set(
          sheetIncome
            .map((i) => (i.category || "").trim())
            .filter(
              (category) =>
                category.length > 0 &&
                !budget.incomeCategories.includes(category),
            ),
        ),
      ];
      if (additionalIncomeCategories.length > 0) {
        budget.setIncomeCategories([
          ...budget.incomeCategories,
          ...additionalIncomeCategories,
        ]);
      }

      const normalizedNewExpenses = newExpenses.map((e) => ({
        ...e,
        category: e.category || "",
      }));
      const normalizedNewMortgage = newMortgage.map((e) => ({
        ...e,
        category: "Mortgage",
      }));

      if (
        normalizedNewExpenses.length > 0 ||
        normalizedNewMortgage.length > 0
      ) {
        budget.addExpenses([
          ...normalizedNewExpenses,
          ...normalizedNewMortgage,
        ]);
      }
      for (const i of newIncome) {
        if (!appIncomeKeys.has(incomeKey(i))) {
          appIncomeKeys.add(incomeKey(i));
          budget.addIncome({
            date: i.date,
            amount: i.amount,
            description: i.description,
            category: i.category || "",
            owner: i.owner,
          });
        }
      }

      const newDebts = sheetDebts.filter((d) => !appDebtIds.has(d.id));
      const newPayments = sheetPayments.filter(
        (p) => !appPaymentIds.has(p.id),
      );
      const newTransfers = sheetOwnerTransfers.filter(
        (row) => !appTransferIds.has(row.id),
      );
      if (newDebts.length > 0) {
        budget.addDebts(newDebts);
      }
      if (newPayments.length > 0) {
        budget.addDebtPayments(newPayments);
      }
      for (const transfer of newTransfers) {
        budget.addOwnerTransfer({
          date: transfer.date,
          fromOwner: transfer.fromOwner,
          toOwner: transfer.toOwner,
          amount: transfer.amount,
          note: transfer.note,
        });
      }

      if (sheetPresets.length > 0) {
        setPresets(sheetPresets);
      }

      dispatchSync({
        type: "SYNC_SUCCESS",
        timestamp: Date.now(),
        hasUnsyncedChanges: false,
      });
      lastSyncedSignatureRef.current = latestSyncSignatureRef.current;
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSession();
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error("Restore from sheet failed:", err);
      dispatchSync({
        type: "SYNC_ERROR",
        message,
        health: "error",
      });
    }
  }, [
    isDummyDataActive,
    accessToken,
    spreadsheetId,
    clearSession,
    budget.expenses,
    budget.income,
    budget.debts,
    budget.debtPayments,
    budget.ownerTransfers,
    setPresets,
    budget.addExpenses,
    budget.addIncome,
    budget.addDebts,
    budget.addDebtPayments,
    budget.addOwnerTransfer,
    budget.updateExpense,
    budget.setCardSources,
    budget.expenseCategories,
    budget.incomeCategories,
    budget.setExpenseCategories,
    budget.setIncomeCategories,
    ensureLinkedSheetActive,
  ]);

  const setAutoSyncEnabled = useCallback((enabled: boolean) => {
    dispatchSync({ type: "SET_AUTO_SYNC", enabled });
    storage.setItem(
      STORAGE_KEYS.AUTO_SYNC_ENABLED,
      enabled ? "true" : "false",
    );
  }, []);

  const value = useMemo<SyncContextValue>(
    () => ({
      syncStatus: syncState.status,
      syncErrorMessage: syncState.errorMessage,
      syncHealth: syncState.health,
      lastSyncAt: syncState.lastSyncAt,
      hasUnsyncedChanges: syncState.hasUnsyncedChanges,
      isAutoSyncEnabled: syncState.isAutoSyncEnabled,
      setAutoSyncEnabled,
      syncToSheets,
      pullFromSheet,
    }),
    [syncState, setAutoSyncEnabled, syncToSheets, pullFromSheet],
  );

  return (
    <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
