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
import { computeAllTotals, computeGrandTotals } from "@/lib/domain/totals";
import { readDataBlob, writeDataBlob, readSyncTimestamp, writeSyncTimestamp } from "@/lib/sheets/data";
import { writeTotalsSheet } from "@/lib/sheets/totals";
import { createSheetsClient } from "@/lib/sheets/client";
import { isGenjutsuError, generateId } from "genjutsu-db";
import { validateExpenseSource } from "@/lib/sheets/models";
import { serializeToBlob, parseFromBlob } from "@/lib/export/minifiedPayload";
import { getCategoryColor } from "@/lib/format/categoryColors";
import { isMortgageCategory } from "@/lib/domain/mortgageCategory";
import { isDisplayCurrency } from "@/types/currency";
import { isSpreadsheetActive } from "@/lib/google/googleDrive";
import { storage, STORAGE_KEYS } from "@/lib/platform/storage";
import { withTimeout, TimeoutError } from "@/lib/platform/withTimeout";
import {
  syncMachineReducer,
  AUTO_SYNC_DEBOUNCE_MS,
  AUTO_SYNC_INTERVAL_MS,
  SYNC_RATE_LIMIT_BASE_DELAY_MS,
  SYNC_RATE_LIMIT_MAX_DELAY_MS,
  SYNC_TIMEOUT_MS,
  MAX_SYNC_RETRIES,
  ROW_COUNT_WARNING,
  ROW_COUNT_LIMIT,
} from "@/lib/sync/syncMachine";
import { createDirtyTracker, type SyncModelName } from "@/lib/sync/dirtyTracking";
import type { SyncHealth, SyncStatus } from "@/types/auth";

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
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);
  const lastPushedTimestampRef = useRef<number | null>(null);
  const dirtyTrackerRef = useRef(createDirtyTracker());

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
    retryCountRef.current = 0;
    lastPushedTimestampRef.current = null;
    if (retryTimerRef.current != null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    dirtyTrackerRef.current.reset();
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
      const db = createSheetsClient(spreadsheetId, async () => accessToken);
      await withTimeout(db.ensureSchema(), SYNC_TIMEOUT_MS);

      // Conflict detection: check if another device pushed since our last sync
      const remoteTimestamp = await withTimeout(readSyncTimestamp(db), SYNC_TIMEOUT_MS);
      if (lastPushedTimestampRef.current !== null && remoteTimestamp !== null &&
          remoteTimestamp > lastPushedTimestampRef.current) {
        dispatchSync({
          type: "SYNC_ERROR",
          message: i18n.t("auth.syncConflictDetected", {
            defaultValue: "Data was modified on another device. Pull latest data first.",
          }),
          health: "warning",
        });
        return; // Don't overwrite — let user pull first
      }

      const nonMortgageExpenses = snapshot.expenses.filter(
        (e) => !isMortgageCategory(e.category),
      );
      const mortgageExpenses = snapshot.expenses.filter((e) =>
        isMortgageCategory(e.category),
      );

      // Row count validation (#97)
      const modelCounts: Record<string, number> = {
        expenses: nonMortgageExpenses.length,
        mortgage: mortgageExpenses.length,
        income: snapshot.income.length,
        debts: snapshot.debts.length,
        debtPayments: snapshot.debtPayments.length,
        ownerTransfers: (snapshot.ownerTransfers ?? []).length,
        presetTransactions: snapshot.presetTransactions.length,
      };
      for (const [model, count] of Object.entries(modelCounts)) {
        if (count > ROW_COUNT_LIMIT) {
          dispatchSync({
            type: "SYNC_ERROR",
            message: i18n.t("auth.syncRowLimitExceeded", {
              defaultValue: `${model} has ${count} rows, exceeding the ${ROW_COUNT_LIMIT} row limit. Please archive old data before syncing.`,
            }),
            health: "error",
          });
          return; // abort sync — don't silently truncate
        }
        if (count > ROW_COUNT_WARNING) {
          console.warn(
            `[sync] ${model} has ${count} rows — approaching the ${ROW_COUNT_LIMIT} row limit`,
          );
        }
      }

      // Dirty tracking: skip sync if no model data has changed since last push
      const tracker = dirtyTrackerRef.current;
      const dirtyEntries: Array<[SyncModelName, unknown[]]> = [
        ["expenses", nonMortgageExpenses],
        ["mortgage", mortgageExpenses],
        ["income", snapshot.income],
        ["debts", snapshot.debts],
        ["debtPayments", snapshot.debtPayments],
        ["ownerTransfers", snapshot.ownerTransfers ?? []],
        ["presetTransactions", snapshot.presetTransactions],
      ];
      if (!tracker.isAnyDirty(dirtyEntries)) {
        // Nothing changed — skip the push entirely
        lastSyncedSignatureRef.current = snapshot.signature;
        dispatchSync({
          type: "SYNC_SUCCESS",
          timestamp: Date.now(),
          hasUnsyncedChanges: false,
        });
        return;
      }

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
      await withTimeout(db.batchSync({
        expenses: nonMortgageExpenses.map((e) => ({
          id: e.id,
          date: e.date,
          amount: e.amount,
          description: e.description,
          category: e.category || "Uncategorized",
          source: e.source,
          owner: e.paidByOwner ?? e.owner ?? "",
        })),
        mortgage: mortgageExpenses.map((e) => ({
          id: e.id,
          date: e.date,
          amount: e.amount,
          description: e.description,
          category: e.category || "Uncategorized",
          source: e.source,
          owner: e.paidByOwner ?? e.owner ?? "",
        })),
        income: snapshot.income.map((i) => ({
          date: i.date,
          amount: i.amount,
          description: i.description,
          category: i.category || "Uncategorized",
          owner: i.owner ?? "",
        })),
        debts: snapshot.debts.map((d) => ({
          id: d.id,
          name: d.name,
          initialAmount: d.initialAmount,
          startDate: d.startDate ?? "",
          owner: d.owner ?? "",
        })),
        debtPayments: snapshot.debtPayments.map((p) => ({
          id: p.id,
          debtId: p.debtId,
          date: p.date,
          amount: p.amount,
          note: p.note ?? "",
        })),
        ownerTransfers: (snapshot.ownerTransfers ?? []).map((t) => ({
          id: t.id,
          date: t.date,
          fromOwner: t.fromOwner,
          toOwner: t.toOwner,
          amount: t.amount,
          note: t.note ?? "",
        })),
        presetTransactions: snapshot.presetTransactions.map((p) => ({
          id: p.id,
          source: p.source,
          description: p.description,
          category: p.category || "Uncategorized",
          owner: p.owner,
        })),
      }), SYNC_TIMEOUT_MS);
      // Data blob and Totals are special cases — written separately
      await withTimeout(writeDataBlob(db, dataBlob), SYNC_TIMEOUT_MS);
      await withTimeout(writeTotalsSheet(db, months, grand), SYNC_TIMEOUT_MS);
      await withTimeout(db.applyFormatting(), SYNC_TIMEOUT_MS);
      const pushTimestamp = Date.now();
      await withTimeout(writeSyncTimestamp(db, pushTimestamp), SYNC_TIMEOUT_MS);
      lastPushedTimestampRef.current = pushTimestamp;
      // Mark all models as synced for dirty tracking
      for (const [model, data] of dirtyEntries) {
        tracker.markSynced(model, data);
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
      retryCountRef.current = 0;
      nextSyncAllowedAtRef.current = 0;
    } catch (err) {
      console.error("Sync failed:", err);
      if (err instanceof TimeoutError) {
        dispatchSync({
          type: "SYNC_ERROR",
          message: i18n.t("auth.syncTimedOut"),
          health: "warning",
        });
      } else if (isGenjutsuError(err)) {
        switch (err.kind) {
          case "AUTH_ERROR":
            clearSession();
            dispatchSync({
              type: "SYNC_ERROR",
              message: err.message,
              health: "error",
            });
            break;
          case "RATE_LIMIT": {
            retryCountRef.current += 1;
            if (retryCountRef.current >= MAX_SYNC_RETRIES) {
              retryCountRef.current = 0;
              retryBackoffMsRef.current = SYNC_RATE_LIMIT_BASE_DELAY_MS;
              nextSyncAllowedAtRef.current = 0;
              dispatchSync({
                type: "SYNC_ERROR",
                message: i18n.t("auth.syncMaxRetriesExceeded", {
                  defaultValue:
                    "Sync failed after multiple retries. Please try again manually.",
                }),
                health: "error",
              });
              break;
            }
            syncQueuedRef.current = true;
            const delay =
              err.retryAfterMs ?? retryBackoffMsRef.current;
            nextSyncAllowedAtRef.current = Date.now() + delay;
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
            break;
          }
          default:
            dispatchSync({
              type: "SYNC_ERROR",
              message: err.message,
              health: "error",
            });
        }
      } else {
        const message = err instanceof Error ? err.message : String(err);
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
      retryCountRef.current = 0;
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
      const db = createSheetsClient(spreadsheetId, async () => accessToken);
      await withTimeout(db.ensureSchema(), SYNC_TIMEOUT_MS);

      // Helper: read all 7 domain sheets via genjutsu-db and convert to app types
      const readFromSheetTabs = async () => {
        const [rawExp, rawMort, rawInc, rawDbt, rawPay, rawTrf, rawPre] =
          await Promise.all([
            db.repo("expenses").readAll(),
            db.repo("mortgage").readAll(),
            db.repo("income").readAll(),
            db.repo("debts").readAll(),
            db.repo("debtPayments").readAll(),
            db.repo("ownerTransfers").readAll(),
            db.repo("presetTransactions").readAll(),
          ]);
        const expenses = rawExp
          .filter((e) => e.date && e.amount > 0)
          .map((e) => ({
            id: (e.id as string) || generateId(),
            date: e.date as string,
            amount: e.amount as number,
            description: (e.description as string) || "Expense",
            category:
              e.category === "Uncategorized"
                ? ""
                : ((e.category as string) || ""),
            source: validateExpenseSource(String(e.source || "")),
            owner: ((e.owner as string) || undefined) as string | undefined,
            paidByOwner: ((e.owner as string) || undefined) as
              | string
              | undefined,
          }));
        const mortgage = rawMort
          .filter((e) => e.date && (e.amount as number) > 0)
          .map((e) => ({
            id: (e.id as string) || generateId(),
            date: e.date as string,
            amount: e.amount as number,
            description: (e.description as string) || "Mortgage",
            category: "Mortgage" as string,
            source: validateExpenseSource(String(e.source || "")),
            owner: ((e.owner as string) || undefined) as string | undefined,
            paidByOwner: ((e.owner as string) || undefined) as
              | string
              | undefined,
          }));
        const income = rawInc
          .filter((i) => i.date && (i.amount as number) > 0)
          .map((i) => ({
            id: generateId(),
            date: i.date as string,
            amount: i.amount as number,
            description: (i.description as string) || "Income",
            category:
              i.category === "Uncategorized"
                ? ""
                : ((i.category as string) || ""),
            owner: ((i.owner as string) || undefined) as string | undefined,
          }));
        const debts = rawDbt
          .filter((d) => d.name && (d.initialAmount as number) >= 0)
          .map((d) => ({
            id: (d.id as string) || generateId(),
            name: d.name as string,
            initialAmount: d.initialAmount as number,
            startDate: ((d.startDate as string) || undefined) as
              | string
              | undefined,
            owner: ((d.owner as string) || undefined) as string | undefined,
          }));
        const payments = rawPay
          .filter((p) => p.debtId && p.date && (p.amount as number) > 0)
          .map((p) => ({
            id: (p.id as string) || generateId(),
            debtId: p.debtId as string,
            date: p.date as string,
            amount: p.amount as number,
            note: ((p.note as string) || undefined) as string | undefined,
          }));
        const transfers = rawTrf
          .filter(
            (t) =>
              t.date && t.fromOwner && t.toOwner && (t.amount as number) > 0,
          )
          .map((t) => ({
            id: (t.id as string) || generateId(),
            date: t.date as string,
            fromOwner: t.fromOwner as string,
            toOwner: t.toOwner as string,
            amount: t.amount as number,
            note: ((t.note as string) || undefined) as string | undefined,
          }));
        const presets = rawPre
          .filter((p) => p.id)
          .map((p) => ({
            id: p.id as string,
            source: validateExpenseSource(String(p.source || "")),
            description: p.description as string,
            category:
              p.category === "Uncategorized"
                ? ""
                : ((p.category as string) || ""),
            owner: (p.owner as string) || "",
          }));

        // Derive owners from read data
        const derivedOwners = [
          ...new Set(
            [...expenses, ...mortgage]
              .map((e) => e.owner)
              .concat(income.map((i) => i.owner))
              .concat(debts.map((d) => d.owner))
              .concat(transfers.map((row) => row.fromOwner))
              .concat(transfers.map((row) => row.toOwner))
              .filter((o): o is string => !!o),
          ),
        ];
        if (derivedOwners.length > 0) {
          budget.setOwners(derivedOwners);
        }

        return {
          expenses,
          mortgage,
          income,
          debts,
          payments,
          transfers,
          presets,
        };
      };

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

      const blob = await withTimeout(readDataBlob(db), SYNC_TIMEOUT_MS);
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
        } catch (blobErr) {
          console.warn(
            "V2 blob read failed, falling back to individual sheet tabs:",
            blobErr,
          );
          const result = await readFromSheetTabs();
          sheetExpenses = result.expenses;
          sheetMortgage = result.mortgage;
          sheetIncome = result.income;
          sheetDebts = result.debts;
          sheetPayments = result.payments;
          sheetOwnerTransfers = result.transfers;
          sheetPresets = result.presets;
        }
      } else {
        const result = await readFromSheetTabs();
        sheetExpenses = result.expenses;
        sheetMortgage = result.mortgage;
        sheetIncome = result.income;
        sheetDebts = result.debts;
        sheetPayments = result.payments;
        sheetOwnerTransfers = result.transfers;
        sheetPresets = result.presets;
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
      lastPushedTimestampRef.current = await readSyncTimestamp(db).catch(() => null);
    } catch (err) {
      console.error("Restore from sheet failed:", err);
      if (err instanceof TimeoutError) {
        dispatchSync({
          type: "SYNC_ERROR",
          message: i18n.t("auth.syncTimedOut"),
          health: "warning",
        });
      } else if (isGenjutsuError(err)) {
        switch (err.kind) {
          case "AUTH_ERROR":
            clearSession();
            dispatchSync({
              type: "SYNC_ERROR",
              message: err.message,
              health: "error",
            });
            break;
          case "RATE_LIMIT":
            dispatchSync({
              type: "SYNC_ERROR",
              message:
                "Rate limited by Google Sheets. Please try again later.",
              health: "warning",
            });
            break;
          default:
            dispatchSync({
              type: "SYNC_ERROR",
              message: err.message,
              health: "error",
            });
        }
      } else {
        const message = err instanceof Error ? err.message : String(err);
        dispatchSync({
          type: "SYNC_ERROR",
          message,
          health: "error",
        });
      }
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
