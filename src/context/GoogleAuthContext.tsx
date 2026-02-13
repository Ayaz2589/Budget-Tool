import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGoogleLogin } from "@react-oauth/google";
import i18n from "@/i18n";
import { useBudget } from "@/context";
import { usePresetTransactions } from "@/context";
import { computeAllTotals, computeGrandTotals } from "@/lib/totals";
import {
  ensureSheetsExist,
  syncAllSheetsBatch,
  readDataBlob,
  getSheetIds,
  applySheetsFormatting,
  extractSpreadsheetId,
  readExpensesFromSheet,
  readMortgageFromSheet,
  readIncomeFromSheet,
  readDebtsFromSheet,
  readPresetsFromSheet,
  readDebtPaymentsFromSheet,
  readOwnerTransfersFromSheet,
} from "@/lib/googleSheets";
import { serializeToBlob, parseFromBlob } from "@/lib/minifiedPayload";
import { getCategoryColor } from "@/lib/categoryColors";
import { isMortgageCategory } from "@/lib/mortgageCategory";
import type { SyncHealth, SyncStatus } from "@/types/auth";
import { isDisplayCurrency } from "@/types/currency";
import {
  createOrthoFolder,
  createSheetInFolder,
  findOrthoFolder,
  isSpreadsheetActive,
  listSheetsInFolder,
  ORTHO_SHEET_NAME,
} from "@/lib/googleDrive";

const SPREADSHEET_ID_KEY = "budget-tool-spreadsheet-id";
const ACCESS_TOKEN_STORAGE_KEY = "budget-tool-google-access-token";
const AUTO_SYNC_ENABLED_KEY = "budget-tool-auto-sync-enabled";
const AUTO_SYNC_DEBOUNCE_MS = 2_000;
const AUTO_SYNC_INTERVAL_MS = 5 * 60_000;
const SYNC_RATE_LIMIT_BASE_DELAY_MS = 3_000;
const SYNC_RATE_LIMIT_MAX_DELAY_MS = 30_000;

/** Set when user signs out or visits /auth; used to skip landing and go to /auth on next visit. */
export const RETURNING_USER_KEY = "budget-tool-returning-user";
/** Set after a user completes onboarding tour once. */
export const TOUR_COMPLETED_KEY = "budget-tool-tour-completed";

function getStoredAccessToken(): string | null {
  try {
    const raw = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      access_token: string;
      expires_at?: number;
    };
    if (parsed.expires_at != null && Date.now() >= parsed.expires_at) {
      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      return null;
    }
    return parsed.access_token ?? null;
  } catch {
    return null;
  }
}

function getStoredExpiresAt(): number | null {
  try {
    const raw = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { expires_at?: number };
    return parsed.expires_at ?? null;
  } catch {
    return null;
  }
}

function setStoredAccessToken(
  accessToken: string,
  expiresInSeconds?: number
): void {
  try {
    const payload: { access_token: string; expires_at?: number } = {
      access_token: accessToken,
    };
    if (expiresInSeconds != null && expiresInSeconds > 0) {
      payload.expires_at = Date.now() + expiresInSeconds * 1000;
    }
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function clearStoredAccessToken(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

import type { GoogleUserProfile, GoogleAuthContextValue } from "@/types/auth";

/** Exported for tests that need to inject auth state (e.g. AuthGate, LoginPage). */
export type { GoogleUserProfile, GoogleAuthContextValue };

/** Exported for tests that need to inject isSignedIn (e.g. AuthGate, LoginPage). */
export const GoogleAuthContext = createContext<GoogleAuthContextValue | null>(
  null
);

/**
 * Use when VITE_GOOGLE_CLIENT_ID is not set. Provides the same context interface
 * but never initializes the Google GSI client (avoids "Missing required parameter client_id").
 */
export function GoogleAuthProviderFallback({
  children,
}: {
  children: ReactNode;
}) {
  const [spreadsheetId, setSpreadsheetIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SPREADSHEET_ID_KEY);
    } catch {
      return null;
    }
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);
  const [lastSyncAt] = useState<number | null>(null);
  const [hasUnsyncedChanges] = useState(false);
  const [syncHealth] = useState<SyncHealth>("healthy");
  const [sheetSetupState] = useState<GoogleAuthContextValue["sheetSetupState"]>("idle");
  const [availableDriveSheets] = useState<GoogleAuthContextValue["availableDriveSheets"]>([]);

  useEffect(() => {
    if (spreadsheetId) {
      try {
        localStorage.setItem(SPREADSHEET_ID_KEY, spreadsheetId);
      } catch {
        // ignore
      }
    } else {
      try {
        localStorage.removeItem(SPREADSHEET_ID_KEY);
      } catch {
        // ignore
      }
    }
  }, [spreadsheetId]);

  const setSpreadsheetId = useCallback((id: string | null) => {
    if (id) {
      const extracted = id.includes("/") ? extractSpreadsheetId(id) : id;
      setSpreadsheetIdState(extracted || id);
    } else {
      setSpreadsheetIdState(null);
    }
  }, []);

  const value = useMemo<GoogleAuthContextValue>(
    () => ({
      isSignedIn: false,
      userProfile: null,
      signIn: () => {},
      signOut: () => {},
      spreadsheetId,
      setSpreadsheetId,
      syncToSheets: async () => {
        setSyncStatus("error");
        setSyncErrorMessage(i18n.t("auth.googleNotConfigured"));
      },
      pullFromSheet: async () => {
        setSyncStatus("error");
        setSyncErrorMessage(i18n.t("auth.googleNotConfigured"));
      },
      syncStatus,
      syncErrorMessage,
      isAutoSyncEnabled,
      setAutoSyncEnabled: setIsAutoSyncEnabled,
      lastSyncAt,
      hasUnsyncedChanges,
      syncHealth,
      sheetSetupState,
      availableDriveSheets,
      runSheetAutoSetup: async () => {},
      linkDriveSheet: () => {},
      createOrthoDriveSheet: async () => {},
      dismissSheetSetupPrompt: () => {},
    }),
    [
      spreadsheetId,
      setSpreadsheetId,
      syncStatus,
      syncErrorMessage,
      isAutoSyncEnabled,
      lastSyncAt,
      hasUnsyncedChanges,
      syncHealth,
      sheetSetupState,
      availableDriveSheets,
    ]
  );

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function isUnauthorizedError(err: unknown): boolean {
  if (err instanceof Error) {
    return err.message.includes("401") || err.message.includes(" 401 ");
  }
  return false;
}

function isRateLimitError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.message.includes("429") ||
    err.message.includes("RATE_LIMIT_EXCEEDED") ||
    err.message.includes("RESOURCE_EXHAUSTED")
  );
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(
    getStoredAccessToken
  );
  const [expiresAt, setExpiresAt] = useState<number | null>(getStoredExpiresAt);
  const [userProfile, setUserProfile] = useState<GoogleUserProfile | null>(
    null
  );
  const [spreadsheetId, setSpreadsheetIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SPREADSHEET_ID_KEY);
    } catch {
      return null;
    }
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isAutoSyncEnabled, setIsAutoSyncEnabledState] = useState(() => {
    try {
      return localStorage.getItem(AUTO_SYNC_ENABLED_KEY) !== "false";
    } catch {
      return true;
    }
  });
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const [syncHealth, setSyncHealth] = useState<SyncHealth>("healthy");
  const [sheetSetupState, setSheetSetupState] =
    useState<GoogleAuthContextValue["sheetSetupState"]>("idle");
  const [availableDriveSheets, setAvailableDriveSheets] = useState<
    GoogleAuthContextValue["availableDriveSheets"]
  >([]);
  const [sheetSetupDismissed, setSheetSetupDismissed] = useState(false);
  const sheetSetupRanForSessionRef = useRef(false);
  const orthoFolderIdRef = useRef<string | null>(null);
  const initialSyncAfterCreateRef = useRef(false);
  const latestSyncSignatureRef = useRef<string>("");
  const lastSyncedSignatureRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const syncQueuedRef = useRef(false);
  const nextSyncAllowedAtRef = useRef(0);
  const retryBackoffMsRef = useRef(SYNC_RATE_LIMIT_BASE_DELAY_MS);
  const retryTimerRef = useRef<number | null>(null);

  const clearSession = useCallback(() => {
    clearStoredAccessToken();
    setAccessToken(null);
    setExpiresAt(null);
    setUserProfile(null);
    setHasUnsyncedChanges(false);
    setSyncHealth("healthy");
    latestSyncSignatureRef.current = "";
    lastSyncedSignatureRef.current = null;
    syncQueuedRef.current = false;
    inFlightRef.current = false;
    nextSyncAllowedAtRef.current = 0;
    retryBackoffMsRef.current = SYNC_RATE_LIMIT_BASE_DELAY_MS;
    if (retryTimerRef.current != null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setSheetSetupState("idle");
    setAvailableDriveSheets([]);
    setSheetSetupDismissed(false);
    sheetSetupRanForSessionRef.current = false;
    orthoFolderIdRef.current = null;
    initialSyncAfterCreateRef.current = false;
    try {
      localStorage.setItem(RETURNING_USER_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const expiresIn = tokenResponse.expires_in ?? 3600;
      setStoredAccessToken(tokenResponse.access_token, expiresIn);
      setAccessToken(tokenResponse.access_token);
      setExpiresAt(Date.now() + expiresIn * 1000);
    },
    onError: () => {
      clearSession();
    },
    scope:
      "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    flow: "implicit",
  });

  useEffect(() => {
    if (!accessToken) {
      setUserProfile(null);
      sheetSetupRanForSessionRef.current = false;
      return;
    }
    let cancelled = false;
    fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(new Error("Failed to fetch profile"))
      )
      .then((data: { name?: string; picture?: string; email?: string }) => {
        if (
          !cancelled &&
          data.name != null &&
          data.picture != null &&
          data.email != null
        ) {
          setUserProfile({
            name: data.name,
            picture: data.picture,
            email: data.email,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setUserProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (spreadsheetId) {
      try {
        localStorage.setItem(SPREADSHEET_ID_KEY, spreadsheetId);
      } catch {
        // ignore
      }
    } else {
      try {
        localStorage.removeItem(SPREADSHEET_ID_KEY);
      } catch {
        // ignore
      }
    }
  }, [spreadsheetId]);

  const signIn = useCallback(() => {
    login();
  }, [login]);

  const signOut = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    if (expiresAt == null) return;
    const interval = setInterval(() => {
      if (Date.now() >= expiresAt) {
        clearSession();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [expiresAt, clearSession]);

  const setSpreadsheetId = useCallback((id: string | null) => {
    if (id) {
      const extracted = id.includes("/") ? extractSpreadsheetId(id) : id;
      setSpreadsheetIdState(extracted || id);
      setSheetSetupState("done");
      setAvailableDriveSheets([]);
      setSheetSetupDismissed(false);
      sheetSetupRanForSessionRef.current = true;
      latestSyncSignatureRef.current = "";
      lastSyncedSignatureRef.current = null;
      syncQueuedRef.current = false;
      nextSyncAllowedAtRef.current = 0;
      retryBackoffMsRef.current = SYNC_RATE_LIMIT_BASE_DELAY_MS;
      if (retryTimerRef.current != null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      setHasUnsyncedChanges(false);
    } else {
      setSpreadsheetIdState(null);
      setSheetSetupState("idle");
      setAvailableDriveSheets([]);
      setSheetSetupDismissed(false);
      sheetSetupRanForSessionRef.current = false;
      orthoFolderIdRef.current = null;
      initialSyncAfterCreateRef.current = false;
      latestSyncSignatureRef.current = "";
      lastSyncedSignatureRef.current = null;
      syncQueuedRef.current = false;
      nextSyncAllowedAtRef.current = 0;
      retryBackoffMsRef.current = SYNC_RATE_LIMIT_BASE_DELAY_MS;
      if (retryTimerRef.current != null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      setHasUnsyncedChanges(false);
    }
  }, []);

  const setAutoSyncEnabled = useCallback((enabled: boolean) => {
    setIsAutoSyncEnabledState(enabled);
    try {
      localStorage.setItem(AUTO_SYNC_ENABLED_KEY, enabled ? "true" : "false");
    } catch {
      // ignore
    }
  }, []);

  const dismissSheetSetupPrompt = useCallback(() => {
    setSheetSetupDismissed(true);
    setSheetSetupState("idle");
    setAvailableDriveSheets([]);
  }, []);

  const linkDriveSheet = useCallback(
    (id: string) => {
      setSpreadsheetId(id);
      setSheetSetupState("done");
      setSheetSetupDismissed(false);
    },
    [setSpreadsheetId],
  );

  const runSheetAutoSetup = useCallback(async () => {
    if (!accessToken || spreadsheetId) return;
    setSheetSetupState("loading");
    setAvailableDriveSheets([]);
    try {
      const folder = await findOrthoFolder(accessToken);
      if (!folder) {
        orthoFolderIdRef.current = null;
        setSheetSetupState("needs-create");
        return;
      }
      orthoFolderIdRef.current = folder.id;
      const sheets = await listSheetsInFolder(accessToken, folder.id);
      if (sheets.length > 0) {
        setAvailableDriveSheets(sheets);
        setSheetSetupState("needs-selection");
      } else {
        setSheetSetupState("needs-create");
      }
    } catch {
      setSheetSetupState("error");
    }
  }, [accessToken, spreadsheetId]);

  const createOrthoDriveSheet = useCallback(async () => {
    if (!accessToken || spreadsheetId) return;
    setSheetSetupState("creating");
    try {
      let folderId = orthoFolderIdRef.current;
      if (!folderId) {
        const folder = await createOrthoFolder(accessToken);
        folderId = folder.id;
        orthoFolderIdRef.current = folder.id;
      }
      const created = await createSheetInFolder(
        accessToken,
        folderId,
        ORTHO_SHEET_NAME,
      );
      initialSyncAfterCreateRef.current = true;
      setSpreadsheetId(created.id);
      setSheetSetupState("done");
      setSheetSetupDismissed(false);
    } catch {
      setSheetSetupState("error");
    }
  }, [accessToken, spreadsheetId, setSpreadsheetId]);

  useEffect(() => {
    if (!accessToken) return;
    if (spreadsheetId) return;
    if (sheetSetupDismissed) return;
    if (sheetSetupRanForSessionRef.current) return;
    sheetSetupRanForSessionRef.current = true;
    void runSheetAutoSetup();
  }, [
    accessToken,
    spreadsheetId,
    sheetSetupDismissed,
    runSheetAutoSetup,
  ]);

  const budget = useBudget();
  const { presetTransactions, setPresets } = usePresetTransactions();
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
        iOweNova: budget.iOweNova,
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
      budget.iOweNova,
    ]
  );

  useEffect(() => {
    latestSyncSignatureRef.current = syncSignature;
  }, [syncSignature]);

  const getSyncSnapshot = useCallback(() => {
    const expenseCategoriesWithColors = budget.expenseCategories.map((name) => ({
      name,
      color: getCategoryColor(name, "expense"),
    }));
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
      iOweNova: budget.iOweNova,
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
    budget.iOweNova,
    budget.uiFormatSettings.currency,
    budget.uiFormatSettings.fxAsOf,
  ]);

  const ensureLinkedSheetActive = useCallback(async (): Promise<boolean> => {
    if (!accessToken || !spreadsheetId) return false;
    const active = await isSpreadsheetActive(accessToken, spreadsheetId);
    if (active) return true;

    setSyncStatus("error");
    setSyncErrorMessage(i18n.t("auth.sheetInTrashOrMissing"));
    setSyncHealth("error");
    setSpreadsheetId(null);
    return false;
  }, [accessToken, spreadsheetId, setSpreadsheetId]);

  const runSync = useCallback(async () => {
    if (!accessToken || !spreadsheetId) {
      setSyncStatus("error");
      setSyncErrorMessage(i18n.t("auth.notSignedInOrNoSpreadsheet"));
      setSyncHealth("error");
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
    setSyncStatus("syncing");
    setSyncErrorMessage(null);
    try {
      const snapshot = getSyncSnapshot();
      await ensureSheetsExist(accessToken, spreadsheetId);
      const nonMortgageExpenses = snapshot.expenses.filter(
        (e) => !isMortgageCategory(e.category)
      );
      const mortgageExpenses = snapshot.expenses.filter(
        (e) => isMortgageCategory(e.category)
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
        iOweNovaByMonth: snapshot.iOweNova,
      });
      const grand = computeGrandTotals(months);
      await syncAllSheetsBatch(accessToken, spreadsheetId, {
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
      const sheetIds = await getSheetIds(accessToken, spreadsheetId);
      if (sheetIds) {
        await applySheetsFormatting(accessToken, spreadsheetId, sheetIds);
      }
      lastSyncedSignatureRef.current = snapshot.signature;
      setSyncStatus("success");
      setSyncErrorMessage(null);
      setLastSyncAt(Date.now());
      const changed = latestSyncSignatureRef.current !== lastSyncedSignatureRef.current;
      setHasUnsyncedChanges(changed);
      setSyncHealth("healthy");
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
        nextSyncAllowedAtRef.current = Date.now() + retryBackoffMsRef.current;
        retryBackoffMsRef.current = Math.min(
          retryBackoffMsRef.current * 2,
          SYNC_RATE_LIMIT_MAX_DELAY_MS
        );
        setSyncStatus("idle");
        setSyncErrorMessage("Rate limited by Google Sheets, retrying automatically.");
        setSyncHealth("warning");
      } else {
        setSyncStatus("error");
        setSyncErrorMessage(message);
        setSyncHealth("error");
      }
    } finally {
      inFlightRef.current = false;
      const shouldRunAgain =
        syncQueuedRef.current ||
        latestSyncSignatureRef.current !== lastSyncedSignatureRef.current;
      if (shouldRunAgain) {
        const waitMs = Math.max(0, nextSyncAllowedAtRef.current - Date.now());
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
    clearSession,
    getSyncSnapshot,
    ensureLinkedSheetActive,
  ]);

  const syncToSheets = useCallback(async () => {
    await runSync();
  }, [runSync]);

  useEffect(() => {
    if (!accessToken || !spreadsheetId) {
      setHasUnsyncedChanges(false);
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
    setHasUnsyncedChanges(changed);
    setSyncHealth(changed ? "warning" : "healthy");
  }, [accessToken, spreadsheetId, syncSignature]);

  useEffect(() => {
    if (!isAutoSyncEnabled) return;
    if (!accessToken || !spreadsheetId) return;
    if (!hasUnsyncedChanges) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "hidden") return;
      void runSync();
    }, AUTO_SYNC_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [
    isAutoSyncEnabled,
    accessToken,
    spreadsheetId,
    hasUnsyncedChanges,
    runSync,
  ]);

  useEffect(() => {
    if (!initialSyncAfterCreateRef.current) return;
    if (!accessToken || !spreadsheetId) return;
    initialSyncAfterCreateRef.current = false;
    void runSync();
  }, [accessToken, spreadsheetId, runSync]);

  useEffect(() => {
    if (!isAutoSyncEnabled) return;
    if (!accessToken || !spreadsheetId) return;
    const interval = window.setInterval(() => {
      if (!hasUnsyncedChanges) return;
      if (document.visibilityState === "hidden") return;
      void runSync();
    }, AUTO_SYNC_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [
    isAutoSyncEnabled,
    accessToken,
    spreadsheetId,
    hasUnsyncedChanges,
    runSync,
  ]);

  const pullFromSheet = useCallback(async () => {
    if (!accessToken || !spreadsheetId) {
      setSyncStatus("error");
      setSyncErrorMessage(i18n.t("auth.notSignedInOrNoSpreadsheet"));
      return;
    }
    const active = await ensureLinkedSheetActive();
    if (!active) return;
    setSyncStatus("syncing");
    setSyncErrorMessage(null);
    try {
      await ensureSheetsExist(accessToken, spreadsheetId);

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

      const appExpenseKeys = new Set(budget.expenses.map((e) => expenseKey(e)));
      const appIncomeKeys = new Set(budget.income.map((i) => incomeKey(i)));
      const appDebtIds = new Set(budget.debts.map((d) => d.id));
      const appPaymentIds = new Set(budget.debtPayments.map((p) => p.id));
      const appTransferIds = new Set(budget.ownerTransfers.map((t) => t.id));

      let sheetExpenses: typeof budget.expenses;
      let sheetMortgage: typeof budget.expenses;
      let sheetIncome: typeof budget.income;
      let sheetDebts: typeof budget.debts;
      let sheetPayments: typeof budget.debtPayments;
      let sheetOwnerTransfers: typeof budget.ownerTransfers;
      let sheetPresets: typeof presetTransactions;

      const blob = await readDataBlob(accessToken, spreadsheetId);
      if (blob && blob.startsWith("V2")) {
        try {
          const expanded = parseFromBlob(blob);
          const allExpenses = expanded.expenses ?? [];
          sheetExpenses = allExpenses.filter(
            (e) => !isMortgageCategory(e.category)
          );
          sheetMortgage = allExpenses.filter(
            (e) => isMortgageCategory(e.category)
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
              expanded.expenseCategoriesWithColors.map((x) => x.name)
            );
          }
          if (Array.isArray(expanded.incomeCategoriesWithColors)) {
            budget.setIncomeCategories(
              expanded.incomeCategoriesWithColors.map((x) => x.name)
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
          ] =
            await Promise.all([
              readExpensesFromSheet(accessToken, spreadsheetId),
              readMortgageFromSheet(accessToken, spreadsheetId),
              readIncomeFromSheet(accessToken, spreadsheetId),
              readDebtsFromSheet(accessToken, spreadsheetId),
              readDebtPaymentsFromSheet(accessToken, spreadsheetId),
              readOwnerTransfersFromSheet(accessToken, spreadsheetId),
              readPresetsFromSheet(accessToken, spreadsheetId),
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
                .filter((o): o is string => !!o)
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
          readExpensesFromSheet(accessToken, spreadsheetId),
          readMortgageFromSheet(accessToken, spreadsheetId),
          readIncomeFromSheet(accessToken, spreadsheetId),
          readDebtsFromSheet(accessToken, spreadsheetId),
          readDebtPaymentsFromSheet(accessToken, spreadsheetId),
          readOwnerTransfersFromSheet(accessToken, spreadsheetId),
          readPresetsFromSheet(accessToken, spreadsheetId),
        ]);
        const derivedOwners = [
          ...new Set(
            [...sheetExpenses, ...sheetMortgage]
              .map((e) => e.owner)
              .concat(sheetIncome.map((i) => i.owner))
              .concat(sheetDebts.map((d) => d.owner))
              .concat(sheetOwnerTransfers.map((row) => row.fromOwner))
              .concat(sheetOwnerTransfers.map((row) => row.toOwner))
              .filter((o): o is string => !!o)
          ),
        ];
        if (derivedOwners.length > 0) {
          budget.setOwners(derivedOwners);
        }
      }

      const newExpenses = sheetExpenses.filter(
        (e) => !appExpenseKeys.has(expenseKey(e))
      );
      const mortgageSheetKeys = new Set(sheetMortgage.map((e) => expenseKey(e)));
      const mortgageRepairs = budget.expenses.filter(
        (e) => mortgageSheetKeys.has(expenseKey(e)) && !isMortgageCategory(e.category),
      );
      for (const repair of mortgageRepairs) {
        budget.updateExpense(repair.id, { category: "Mortgage" });
      }
      const newMortgage = sheetMortgage.filter(
        (e) => !appExpenseKeys.has(expenseKey(e))
      );
      const newIncome = sheetIncome.filter(
        (i) => !appIncomeKeys.has(incomeKey(i))
      );

      const additionalExpenseCategories = [
        ...new Set(
          sheetExpenses
            .map((e) => (e.category || "").trim())
            .filter(
              (category) =>
                category.length > 0 &&
                !isMortgageCategory(category) &&
                !budget.expenseCategories.includes(category)
            )
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
                !budget.incomeCategories.includes(category)
            )
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
      const newPayments = sheetPayments.filter((p) => !appPaymentIds.has(p.id));
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

      setSyncStatus("success");
      setSyncErrorMessage(null);
      setHasUnsyncedChanges(false);
      setSyncHealth("healthy");
      lastSyncedSignatureRef.current = latestSyncSignatureRef.current;
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSession();
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error("Restore from sheet failed:", err);
      setSyncStatus("error");
      setSyncErrorMessage(message);
      setSyncHealth("error");
    }
  }, [
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

  const value = useMemo<GoogleAuthContextValue>(
    () => ({
      isSignedIn: !!accessToken,
      userProfile,
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
      sheetSetupState,
      availableDriveSheets,
      runSheetAutoSetup,
      linkDriveSheet,
      createOrthoDriveSheet,
      dismissSheetSetupPrompt,
    }),
    [
      accessToken,
      userProfile,
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
      sheetSetupState,
      availableDriveSheets,
      runSheetAutoSetup,
      linkDriveSheet,
      createOrthoDriveSheet,
      dismissSheetSetupPrompt,
    ]
  );

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  const ctx = useContext(GoogleAuthContext);
  if (!ctx)
    throw new Error("useGoogleAuth must be used within GoogleAuthProvider");
  return ctx;
}
