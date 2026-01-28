import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useBudget } from "@/context/BudgetContext";
import { computeAllTotals, computeGrandTotals } from "@/lib/totals";
import {
  ensureSheetsExist,
  clearAndWriteExpenses,
  clearAndWriteIncome,
  writeTotalsSheet,
  extractSpreadsheetId,
} from "@/lib/googleSheets";

const SPREADSHEET_ID_KEY = "budget-tool-spreadsheet-id";

type SyncStatus = "idle" | "syncing" | "success" | "error";

interface GoogleAuthContextValue {
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
  spreadsheetId: string | null;
  setSpreadsheetId: (id: string | null) => void;
  syncToSheets: () => Promise<void>;
  syncStatus: SyncStatus;
}

const GoogleAuthContext = createContext<GoogleAuthContextValue | null>(null);

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
      signIn: () => {},
      signOut: () => {},
      spreadsheetId,
      setSpreadsheetId,
      syncToSheets: async () => setSyncStatus("error"),
      syncStatus,
    }),
    [spreadsheetId, setSpreadsheetId, syncStatus],
  );

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SPREADSHEET_ID_KEY);
    } catch {
      return null;
    }
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
    },
    onError: () => {
      setAccessToken(null);
    },
    scope: "https://www.googleapis.com/auth/spreadsheets",
    flow: "implicit",
  });

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
    setAccessToken(null);
  }, []);

  const setSpreadsheetId = useCallback((id: string | null) => {
    if (id) {
      const extracted = id.includes("/") ? extractSpreadsheetId(id) : id;
      setSpreadsheetIdState(extracted || id);
    } else {
      setSpreadsheetIdState(null);
    }
  }, []);

  const budget = useBudget();

  const syncToSheets = useCallback(async () => {
    if (!accessToken || !spreadsheetId) {
      setSyncStatus("error");
      return;
    }
    setSyncStatus("syncing");
    try {
      await ensureSheetsExist(accessToken, spreadsheetId);
      await clearAndWriteExpenses(accessToken, spreadsheetId, budget.expenses);
      await clearAndWriteIncome(accessToken, spreadsheetId, budget.income);
      const months = computeAllTotals({
        expenses: budget.expenses,
        income: budget.income,
        iOweNovaByMonth: budget.iOweNova,
      });
      const grand = computeGrandTotals(months);
      await writeTotalsSheet(accessToken, spreadsheetId, months, grand);
      setSyncStatus("success");
    } catch (err) {
      console.error("Sync failed:", err);
      setSyncStatus("error");
    }
  }, [
    accessToken,
    spreadsheetId,
    budget.expenses,
    budget.income,
    budget.iOweNova,
  ]);

  const value = useMemo<GoogleAuthContextValue>(
    () => ({
      isSignedIn: !!accessToken,
      signIn,
      signOut,
      spreadsheetId,
      setSpreadsheetId,
      syncToSheets,
      syncStatus,
    }),
    [
      accessToken,
      signIn,
      signOut,
      spreadsheetId,
      setSpreadsheetId,
      syncToSheets,
      syncStatus,
    ],
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
