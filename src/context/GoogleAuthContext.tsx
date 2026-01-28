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
import { useBudget } from "@/context/BudgetContext";
import { computeAllTotals, computeGrandTotals } from "@/lib/totals";
import {
  PAYCHECK_AMOUNT,
  PAYCHECK_DESCRIPTION,
  PAYCHECK_CATEGORY,
  hasPaycheckOnSheet,
  getCurrentMonthPaycheckDatesUTC,
  RENT_AMOUNTS,
  RENT_DESCRIPTION,
  RENT_CATEGORY,
  hasRentOnSheet,
  getCurrentMonthRentDateUTC,
} from "@/lib/paycheck";
import {
  ensureSheetsExist,
  clearAndWriteExpenses,
  clearAndWriteIncome,
  writeTotalsSheet,
  getSheetIds,
  applySheetsFormatting,
  extractSpreadsheetId,
  readExpensesFromSheet,
  readIncomeFromSheet,
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
  pullFromSheet: () => Promise<void>;
  syncStatus: SyncStatus;
  syncErrorMessage: string | null;
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
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

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
      syncToSheets: async () => {
        setSyncStatus("error");
        setSyncErrorMessage("Google sign-in is not configured.");
      },
      pullFromSheet: async () => {
        setSyncStatus("error");
        setSyncErrorMessage("Google sign-in is not configured.");
      },
      syncStatus,
      syncErrorMessage,
    }),
    [spreadsheetId, setSpreadsheetId, syncStatus, syncErrorMessage],
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
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

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
  const hasCheckedSheetForPaychecks = useRef(false);
  const hasAddedPaychecksWhenUnsignedIn = useRef(false);

  const syncToSheets = useCallback(async () => {
    if (!accessToken || !spreadsheetId) {
      setSyncStatus("error");
      setSyncErrorMessage("Not signed in or no spreadsheet set.");
      return;
    }
    setSyncStatus("syncing");
    setSyncErrorMessage(null);
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
      const sheetIds = await getSheetIds(accessToken, spreadsheetId);
      if (sheetIds) {
        await applySheetsFormatting(accessToken, spreadsheetId, sheetIds);
      }
      setSyncStatus("success");
      setSyncErrorMessage(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Sync failed:", err);
      setSyncStatus("error");
      setSyncErrorMessage(message);
    }
  }, [
    accessToken,
    spreadsheetId,
    budget.expenses,
    budget.income,
    budget.iOweNova,
  ]);

  const pullFromSheet = useCallback(async () => {
    if (!accessToken || !spreadsheetId) {
      setSyncStatus("error");
      setSyncErrorMessage("Not signed in or no spreadsheet set.");
      return;
    }
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

      const sheetExpenses = await readExpensesFromSheet(
        accessToken,
        spreadsheetId,
      );
      const sheetIncome = await readIncomeFromSheet(accessToken, spreadsheetId);

      const newExpenses = sheetExpenses.filter(
        (e) => !appExpenseKeys.has(expenseKey(e)),
      );
      const newIncome = sheetIncome.filter(
        (i) => !appIncomeKeys.has(incomeKey(i)),
      );

      if (newExpenses.length > 0) {
        budget.addExpenses(newExpenses);
      }
      for (const i of newIncome) {
        if (!appIncomeKeys.has(incomeKey(i))) {
          appIncomeKeys.add(incomeKey(i));
          budget.addIncome({
            date: i.date,
            amount: i.amount,
            description: i.description,
            category: i.category,
          });
        }
      }

      setSyncStatus("success");
      setSyncErrorMessage(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Restore from sheet failed:", err);
      setSyncStatus("error");
      setSyncErrorMessage(message);
    }
  }, [
    accessToken,
    spreadsheetId,
    budget.expenses,
    budget.income,
    budget.addExpenses,
    budget.addIncome,
  ]);

  useEffect(() => {
    const ensureCurrentMonthPaychecks = () => {
      const dates = getCurrentMonthPaycheckDatesUTC();
      const existingPaycheckDates = new Set(
        budget.income
          .filter(
            (i) =>
              (i.description || "").toLowerCase() ===
                PAYCHECK_DESCRIPTION.toLowerCase() &&
              Math.abs(i.amount - PAYCHECK_AMOUNT) < 0.01,
          )
          .map((i) => i.date),
      );
      for (const date of dates) {
        if (!existingPaycheckDates.has(date)) {
          budget.addIncome({
            date,
            amount: PAYCHECK_AMOUNT,
            description: PAYCHECK_DESCRIPTION,
            category: PAYCHECK_CATEGORY,
          });
        }
      }
    };

    const ensureCurrentMonthRent = () => {
      const rentDate = getCurrentMonthRentDateUTC();
      const existingRentAmounts = new Set(
        budget.income
          .filter(
            (i) =>
              i.date === rentDate &&
              ((i.description || "").toLowerCase() ===
                RENT_DESCRIPTION.toLowerCase() ||
                (i.category || "").toLowerCase() ===
                  RENT_CATEGORY.toLowerCase()) &&
              RENT_AMOUNTS.some((a) => Math.abs(i.amount - a) < 0.01),
          )
          .map((i) => i.amount),
      );
      for (const amount of RENT_AMOUNTS) {
        if (!existingRentAmounts.has(amount)) {
          budget.addIncome({
            date: rentDate,
            amount,
            description: RENT_DESCRIPTION,
            category: RENT_CATEGORY,
          });
        }
      }
    };

    if (accessToken && spreadsheetId) {
      if (hasCheckedSheetForPaychecks.current) return;
      hasCheckedSheetForPaychecks.current = true;
      readIncomeFromSheet(accessToken, spreadsheetId)
        .then((sheetIncome) => {
          if (hasPaycheckOnSheet(sheetIncome) || hasRentOnSheet(sheetIncome)) {
            void pullFromSheet().then(() => {
              ensureCurrentMonthPaychecks();
              ensureCurrentMonthRent();
            });
          } else {
            ensureCurrentMonthPaychecks();
            ensureCurrentMonthRent();
          }
        })
        .catch(() => {
          ensureCurrentMonthPaychecks();
          ensureCurrentMonthRent();
        });
      return;
    }

    if (!accessToken && !hasAddedPaychecksWhenUnsignedIn.current) {
      hasAddedPaychecksWhenUnsignedIn.current = true;
      ensureCurrentMonthPaychecks();
      ensureCurrentMonthRent();
    }
  }, [
    accessToken,
    spreadsheetId,
    budget.income,
    budget.addIncome,
    pullFromSheet,
  ]);

  const value = useMemo<GoogleAuthContextValue>(
    () => ({
      isSignedIn: !!accessToken,
      signIn,
      signOut,
      spreadsheetId,
      setSpreadsheetId,
      syncToSheets,
      pullFromSheet,
      syncStatus,
      syncErrorMessage,
    }),
    [
      accessToken,
      signIn,
      signOut,
      spreadsheetId,
      setSpreadsheetId,
      syncToSheets,
      pullFromSheet,
      syncStatus,
      syncErrorMessage,
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
