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
import i18n from "@/i18n";
import { useBudget } from "@/context/BudgetContext";
import { usePresetTransactions } from "@/context/PresetTransactionsContext";
import { useRules } from "@/context/RulesContext";
import { computeAllTotals, computeGrandTotals } from "@/lib/totals";
import {
  ensureSheetsExist,
  clearAndWriteExpenses,
  clearAndWriteMortgage,
  clearAndWriteIncome,
  clearAndWriteDebts,
  clearAndWriteDebtPayments,
  clearAndWriteRules,
  clearAndWritePresets,
  writeTotalsSheet,
  writeDataBlob,
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
  readRulesFromSheet,
} from "@/lib/googleSheets";
import { serializeToBlob, parseFromBlob } from "@/lib/minifiedPayload";
import { getCategoryColor } from "@/lib/categoryColors";

const SPREADSHEET_ID_KEY = "budget-tool-spreadsheet-id";
const ACCESS_TOKEN_STORAGE_KEY = "budget-tool-google-access-token";

/** Set when user signs out or visits /auth; used to skip landing and go to /auth on next visit. */
export const RETURNING_USER_KEY = "budget-tool-returning-user";

function getStoredAccessToken(): string | null {
  try {
    const raw = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      access_token: string;
      expires_at?: number;
    };
    if (
      parsed.expires_at != null &&
      Date.now() >= parsed.expires_at
    ) {
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
  expiresInSeconds?: number,
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

type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface GoogleUserProfile {
  name: string;
  picture: string;
  email: string;
}

/** Exported for tests that need to inject auth state (e.g. AuthGate, LoginPage). */
export interface GoogleAuthContextValue {
  isSignedIn: boolean;
  userProfile: GoogleUserProfile | null;
  signIn: () => void;
  signOut: () => void;
  spreadsheetId: string | null;
  setSpreadsheetId: (id: string | null) => void;
  syncToSheets: () => Promise<void>;
  pullFromSheet: () => Promise<void>;
  syncStatus: SyncStatus;
  syncErrorMessage: string | null;
}

/** Exported for tests that need to inject isSignedIn (e.g. AuthGate, LoginPage). */
export const GoogleAuthContext =
  createContext<GoogleAuthContextValue | null>(null);

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
    }),
    [spreadsheetId, setSpreadsheetId, syncStatus, syncErrorMessage],
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

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(
    getStoredAccessToken,
  );
  const [expiresAt, setExpiresAt] = useState<number | null>(getStoredExpiresAt);
  const [userProfile, setUserProfile] = useState<GoogleUserProfile | null>(
    null,
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

  const clearSession = useCallback(() => {
    clearStoredAccessToken();
    setAccessToken(null);
    setExpiresAt(null);
    setUserProfile(null);
    try {
      localStorage.setItem(RETURNING_USER_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const expiresIn = tokenResponse.expires_in ?? 3600;
      setStoredAccessToken(
        tokenResponse.access_token,
        expiresIn,
      );
      setAccessToken(tokenResponse.access_token);
      setExpiresAt(Date.now() + expiresIn * 1000);
    },
    onError: () => {
      clearSession();
    },
    scope:
      "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    flow: "implicit",
  });

  useEffect(() => {
    if (!accessToken) {
      setUserProfile(null);
      return;
    }
    let cancelled = false;
    fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(new Error("Failed to fetch profile")),
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
    } else {
      setSpreadsheetIdState(null);
    }
  }, []);

  const budget = useBudget();
  const rulesContext = useRules();
  const { presetTransactions, setPresets } = usePresetTransactions();

  const syncToSheets = useCallback(async () => {
    if (!accessToken || !spreadsheetId) {
      setSyncStatus("error");
      setSyncErrorMessage(i18n.t("auth.notSignedInOrNoSpreadsheet"));
      return;
    }
    setSyncStatus("syncing");
    setSyncErrorMessage(null);
    try {
      await ensureSheetsExist(accessToken, spreadsheetId);
      const nonMortgageExpenses = budget.expenses.filter(
        (e) => (e.category || "").toLowerCase() !== "mortgage",
      );
      const mortgageExpenses = budget.expenses.filter(
        (e) => (e.category || "").toLowerCase() === "mortgage",
      );
      await clearAndWriteExpenses(
        accessToken,
        spreadsheetId,
        nonMortgageExpenses,
      );
      await clearAndWriteMortgage(accessToken, spreadsheetId, mortgageExpenses);
      await clearAndWriteIncome(accessToken, spreadsheetId, budget.income);
      await clearAndWriteDebts(accessToken, spreadsheetId, budget.debts);
      await clearAndWriteDebtPayments(
        accessToken,
        spreadsheetId,
        budget.debtPayments,
      );
      await clearAndWriteRules(accessToken, spreadsheetId, rulesContext.rules);
      await clearAndWritePresets(
        accessToken,
        spreadsheetId,
        presetTransactions,
      );
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2d169f94-ce25-47a9-9a41-3de41225c2ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GoogleAuthContext.tsx:syncToSheets',message:'before serializeToBlob',data:{expenseCategoriesLen:budget.expenseCategories?.length,incomeCategoriesLen:budget.incomeCategories?.length,expenseCategoriesSample:budget.expenseCategories?.slice(0,3)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      const expenseCategoriesWithColors = budget.expenseCategories.map((name) => ({
        name,
        color: getCategoryColor(name, "expense"),
      }));
      const incomeCategoriesWithColors = budget.incomeCategories.map((name) => ({
        name,
        color: getCategoryColor(name, "income"),
      }));
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2d169f94-ce25-47a9-9a41-3de41225c2ac',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GoogleAuthContext.tsx:syncToSheets',message:'categoriesWithColors built',data:{expenseWithColorsLen:expenseCategoriesWithColors.length,incomeWithColorsLen:incomeCategoriesWithColors.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      const dataBlob = serializeToBlob({
        expenses: budget.expenses,
        income: budget.income,
        debts: budget.debts,
        debtPayments: budget.debtPayments,
        rules: rulesContext.rules,
        presetTransactions,
        expenseCategoriesWithColors,
        incomeCategoriesWithColors,
        cardSources: budget.cardSources,
      });
      await writeDataBlob(accessToken, spreadsheetId, dataBlob);
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
      if (isUnauthorizedError(err)) {
        clearSession();
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error("Sync failed:", err);
      setSyncStatus("error");
      setSyncErrorMessage(message);
    }
  }, [
    accessToken,
    spreadsheetId,
    clearSession,
    budget.expenses,
    budget.income,
    budget.debts,
    budget.debtPayments,
    budget.expenseCategories,
    budget.incomeCategories,
    budget.iOweNova,
    budget.cardSources,
    rulesContext.rules,
    presetTransactions,
  ]);

  const pullFromSheet = useCallback(async () => {
    if (!accessToken || !spreadsheetId) {
      setSyncStatus("error");
      setSyncErrorMessage(i18n.t("auth.notSignedInOrNoSpreadsheet"));
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
      const appDebtIds = new Set(budget.debts.map((d) => d.id));
      const appPaymentIds = new Set(budget.debtPayments.map((p) => p.id));

      let sheetExpenses: typeof budget.expenses;
      let sheetMortgage: typeof budget.expenses;
      let sheetIncome: typeof budget.income;
      let sheetDebts: typeof budget.debts;
      let sheetPayments: typeof budget.debtPayments;
      let sheetRules: typeof rulesContext.rules;
      let sheetPresets: typeof presetTransactions;

      const blob = await readDataBlob(accessToken, spreadsheetId);
      if (blob && blob.startsWith("V2")) {
        try {
          const expanded = parseFromBlob(blob);
          const allExpenses = expanded.expenses ?? [];
          sheetExpenses = allExpenses.filter(
            (e) => (e.category || "").toLowerCase() !== "mortgage",
          );
          sheetMortgage = allExpenses.filter(
            (e) => (e.category || "").toLowerCase() === "mortgage",
          );
          sheetIncome = expanded.income ?? [];
          sheetDebts = expanded.debts ?? [];
          sheetPayments = expanded.debtPayments ?? [];
          sheetRules = expanded.rules ?? [];
          sheetPresets = expanded.presetTransactions ?? [];
          if (Array.isArray(expanded.cardSources) && expanded.cardSources.length > 0) {
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
        } catch {
          const [expenses, mortgage, income, debts, payments, rules, presets] =
            await Promise.all([
              readExpensesFromSheet(accessToken, spreadsheetId),
              readMortgageFromSheet(accessToken, spreadsheetId),
              readIncomeFromSheet(accessToken, spreadsheetId),
              readDebtsFromSheet(accessToken, spreadsheetId),
              readDebtPaymentsFromSheet(accessToken, spreadsheetId),
              readRulesFromSheet(accessToken, spreadsheetId),
              readPresetsFromSheet(accessToken, spreadsheetId),
            ]);
          sheetExpenses = expenses;
          sheetMortgage = mortgage;
          sheetIncome = income;
          sheetDebts = debts;
          sheetPayments = payments;
          sheetRules = rules;
          sheetPresets = presets;
        }
      } else {
        [sheetExpenses, sheetMortgage, sheetIncome, sheetDebts, sheetPayments, sheetRules, sheetPresets] =
          await Promise.all([
            readExpensesFromSheet(accessToken, spreadsheetId),
            readMortgageFromSheet(accessToken, spreadsheetId),
            readIncomeFromSheet(accessToken, spreadsheetId),
            readDebtsFromSheet(accessToken, spreadsheetId),
            readDebtPaymentsFromSheet(accessToken, spreadsheetId),
            readRulesFromSheet(accessToken, spreadsheetId),
            readPresetsFromSheet(accessToken, spreadsheetId),
          ]);
      }

      const newExpenses = sheetExpenses.filter(
        (e) => !appExpenseKeys.has(expenseKey(e)),
      );
      const newMortgage = sheetMortgage.filter(
        (e) => !appExpenseKeys.has(expenseKey(e)),
      );
      const newIncome = sheetIncome.filter(
        (i) => !appIncomeKeys.has(incomeKey(i)),
      );

      const expenseCatSet = new Set(budget.expenseCategories);
      const incomeCatSet = new Set(budget.incomeCategories);
      const normalizeExpenseCategory = (category: string) =>
        expenseCatSet.has(category) ? category : "";
      const normalizeIncomeCategory = (category: string) =>
        incomeCatSet.has(category) ? category : "";

      const normalizedNewExpenses = newExpenses.map((e) => ({
        ...e,
        category: normalizeExpenseCategory(e.category || ""),
      }));
      const normalizedNewMortgage = newMortgage.map((e) => ({
        ...e,
        category: normalizeExpenseCategory(e.category || ""),
      }));

      if (normalizedNewExpenses.length > 0 || normalizedNewMortgage.length > 0) {
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
            category: normalizeIncomeCategory(i.category || ""),
          });
        }
      }

      const newDebts = sheetDebts.filter((d) => !appDebtIds.has(d.id));
      const newPayments = sheetPayments.filter((p) => !appPaymentIds.has(p.id));
      if (newDebts.length > 0) {
        budget.addDebts(newDebts);
      }
      if (newPayments.length > 0) {
        budget.addDebtPayments(newPayments);
      }

      if (sheetRules.length > 0) {
        rulesContext.setRules(sheetRules);
      }
      if (sheetPresets.length > 0) {
        setPresets(sheetPresets);
      }

      setSyncStatus("success");
      setSyncErrorMessage(null);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearSession();
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error("Restore from sheet failed:", err);
      setSyncStatus("error");
      setSyncErrorMessage(message);
    }
  }, [
    accessToken,
    spreadsheetId,
    clearSession,
    budget.expenses,
    budget.income,
    budget.debts,
    budget.debtPayments,
    rulesContext.rules,
    rulesContext.setRules,
    setPresets,
    budget.addExpenses,
    budget.addIncome,
    budget.addDebts,
    budget.addDebtPayments,
    budget.setCardSources,
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
