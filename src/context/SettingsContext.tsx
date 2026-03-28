import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ExpenseSource } from "@/types/core";
import { ALL_EXPENSE_SOURCES } from "@/lib/types";
import {
  getDefaultUiFormatSettings,
  setUiFormatSettings as applyUiFormatSettings,
  type UiFormatSettings,
} from "@/lib/format";
import { toDisplayCurrency } from "@/types/currency";
import { getCachedUsdFxRate, getUsdFxRate } from "@/lib/platform/fx";
import { storage, STORAGE_KEYS } from "@/lib/platform/storage";

// ---------------------------------------------------------------------------
// Stored-settings loaders (pure functions, no side effects)
// ---------------------------------------------------------------------------

export function loadStoredUiFormatSettings(): UiFormatSettings {
  const fallback = getDefaultUiFormatSettings();
  try {
    const raw = storage.getItem(STORAGE_KEYS.UI_FORMAT);
    if (!raw) return fallback;
    const data = JSON.parse(raw) as Partial<UiFormatSettings>;
    const currency = toDisplayCurrency(data.currency);
    const dateFormat =
      data.dateFormat === "MM/DD/YYYY" || data.dateFormat === "YYYY/MM/DD"
        ? data.dateFormat
        : fallback.dateFormat;
    const fxRate =
      Number.isFinite(data.fxRate) && Number(data.fxRate) > 0
        ? Number(data.fxRate)
        : fallback.fxRate;
    return {
      ...fallback,
      currency,
      baseCurrency: "USD",
      fxRate: currency === "USD" ? 1 : fxRate,
      fxAsOf: typeof data.fxAsOf === "string" ? data.fxAsOf : undefined,
      fxFallback:
        typeof data.fxFallback === "boolean" ? data.fxFallback : undefined,
      dateFormat,
    };
  } catch {
    return fallback;
  }
}

export function loadStoredCardSources(raw?: string[] | null): string[] {
  if (Array.isArray(raw)) {
    const filtered = raw.filter((s): s is ExpenseSource =>
      ALL_EXPENSE_SOURCES.includes(s as ExpenseSource),
    );
    for (const src of ALL_EXPENSE_SOURCES) {
      if (!filtered.includes(src)) filtered.push(src);
    }
    return filtered.length > 0 ? filtered : [...ALL_EXPENSE_SOURCES];
  }
  return [...ALL_EXPENSE_SOURCES];
}

/** @deprecated Categories are now preset; this loader is kept only for legacy data compat. */
export function loadStoredCategories(
  raw: string[] | undefined,
  defaults: readonly string[],
): string[] {
  if (
    Array.isArray(raw) &&
    raw.every((c) => typeof c === "string")
  ) {
    return raw;
  }
  return [...defaults];
}

// ---------------------------------------------------------------------------
// Stored-budget loader shape (settings-related fields only)
// ---------------------------------------------------------------------------

export interface StoredSettingsData {
  ownerBalances: Record<string, Record<string, number>>;
  cardSources: string[];
  owners: string[];
}

export function loadStoredSettings(): StoredSettingsData {
  try {
    const raw = storage.getItem(STORAGE_KEYS.BUDGET_DATA);
    if (raw) {
      const data = JSON.parse(raw) as Partial<{
        ownerBalances: Record<string, Record<string, number>>;
        cardSources: string[];
        owners: string[];
      }>;
      return {
        ownerBalances:
          data.ownerBalances && typeof data.ownerBalances === "object"
            ? data.ownerBalances
            : {},
        cardSources: loadStoredCardSources(data.cardSources),
        owners:
          Array.isArray(data.owners) &&
          data.owners.every((o) => typeof o === "string")
            ? data.owners
            : [],
      };
    }
  } catch {
    // ignore
  }
  return {
    ownerBalances: {},
    cardSources: [...ALL_EXPENSE_SOURCES],
    owners: [],
  };
}

// ---------------------------------------------------------------------------
// Context value type
// ---------------------------------------------------------------------------

export interface SettingsContextValue {
  owners: string[];
  cardSources: string[];
  ownerBalances: Record<string, Record<string, number>>;
  uiFormatSettings: UiFormatSettings;
  isCurrencyUpdating: boolean;
  setOwners: (owners: string[]) => void;
  setCardSources: (sources: string[]) => void;
  setOwnerBalance: (monthKey: string, owner: string, amount: number) => void;
  setUiFormatSettings: (settings: UiFormatSettings) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings: StoredSettingsData;
}) {
  const [owners, setOwnersState] = useState<string[]>(
    initialSettings.owners,
  );
  const [cardSources, setCardSourcesState] = useState<string[]>(
    initialSettings.cardSources,
  );
  const [ownerBalances, setOwnerBalancesState] = useState<
    Record<string, Record<string, number>>
  >(initialSettings.ownerBalances);
  const [uiFormatSettings, setUiFormatSettingsState] =
    useState<UiFormatSettings>(() => {
      const initial = loadStoredUiFormatSettings();
      applyUiFormatSettings(initial);
      return initial;
    });
  const [isCurrencyUpdating, setIsCurrencyUpdating] = useState(false);

  // --- persist UI format settings on change ---
  useEffect(() => {
    applyUiFormatSettings(uiFormatSettings);
    storage.setItem(STORAGE_KEYS.UI_FORMAT, JSON.stringify(uiFormatSettings));
  }, [uiFormatSettings]);

  // --- FX rate fetch when currency changes ---
  useEffect(() => {
    if (uiFormatSettings.currency === "USD") {
      setIsCurrencyUpdating(false);
      return;
    }
    setIsCurrencyUpdating(true);
    let cancelled = false;
    getUsdFxRate(uiFormatSettings.currency)
      .then((fx) => {
        if (cancelled) return;
        setUiFormatSettingsState((prev) => {
          if (
            prev.currency !== uiFormatSettings.currency ||
            (Math.abs(prev.fxRate - fx.rate) < 0.000001 &&
              prev.fxAsOf === fx.asOf &&
              prev.fxFallback === fx.fallback)
          ) {
            return prev;
          }
          const nextSettings: UiFormatSettings = {
            ...prev,
            fxRate: fx.rate,
            fxAsOf: fx.asOf,
            fxFallback: fx.fallback,
          };
          applyUiFormatSettings(nextSettings);
          return nextSettings;
        });
      })
      .finally(() => {
        if (!cancelled) setIsCurrencyUpdating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uiFormatSettings.currency]);

  // --- Simple setters (no cross-concern side effects) ---
  const setOwners = useCallback(
    (nextOwners: string[]) => setOwnersState(nextOwners),
    [],
  );
  const setCardSources = useCallback(
    (sources: string[]) => {
      if (sources.length === 0) return;
      setCardSourcesState(sources);
    },
    [],
  );
  const setOwnerBalance = useCallback(
    (monthKey: string, owner: string, amount: number) => {
      setOwnerBalancesState((prev) => ({
        ...prev,
        [monthKey]: { ...(prev[monthKey] ?? {}), [owner]: amount },
      }));
    },
    [],
  );

  const setUiFormatSettings = useCallback((settings: UiFormatSettings) => {
    setUiFormatSettingsState((prev) => {
      const nextCurrency = toDisplayCurrency(settings.currency);
      const currencyChanged = nextCurrency !== prev.currency;
      const cachedFx =
        nextCurrency === "USD" ? null : getCachedUsdFxRate(nextCurrency);
      const explicitFxRate =
        Number.isFinite(settings.fxRate) &&
        settings.fxRate > 0 &&
        (!currencyChanged || typeof settings.fxAsOf === "string")
          ? settings.fxRate
          : null;
      const nextFxRate =
        nextCurrency === "USD"
          ? 1
          : explicitFxRate ??
            cachedFx?.rate ??
            (currencyChanged ? 1 : prev.fxRate || 1);
      const nextFxAsOf =
        nextCurrency === "USD"
          ? undefined
          : settings.fxAsOf ??
            cachedFx?.asOf ??
            (currencyChanged ? undefined : prev.fxAsOf);
      const nextFxFallback =
        nextCurrency === "USD"
          ? false
          : settings.fxFallback ??
            (cachedFx
              ? cachedFx.stale
              : currencyChanged
                ? true
                : prev.fxFallback);
      const nextSettings: UiFormatSettings = {
        ...prev,
        ...settings,
        baseCurrency: "USD",
        currency: nextCurrency,
        fxRate: nextFxRate,
        fxAsOf: nextFxAsOf,
        fxFallback: nextFxFallback,
      };
      applyUiFormatSettings(nextSettings);
      return nextSettings;
    });
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      owners,
      cardSources,
      ownerBalances,
      uiFormatSettings,
      isCurrencyUpdating,
      setOwners,
      setCardSources,
      setOwnerBalance,
      setUiFormatSettings,
    }),
    [
      owners,
      cardSources,
      ownerBalances,
      uiFormatSettings,
      isCurrencyUpdating,
      setOwners,
      setCardSources,
      setOwnerBalance,
      setUiFormatSettings,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
