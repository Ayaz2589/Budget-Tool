import { type DisplayCurrency } from "@/types/currency";
import { storage, STORAGE_KEYS } from "@/lib/storage";

const FX_TTL_MS = 12 * 60 * 60 * 1000;
const FALLBACK_RATE = 1;

type SupportedCurrency = DisplayCurrency;

type CachedFx = {
  rate: number;
  asOf: string;
  fetchedAt: number;
};

const inFlight = new Map<
  SupportedCurrency,
  Promise<{ rate: number; asOf: string; fallback: boolean }>
>();

function getCacheKey(currency: SupportedCurrency): string {
  return `${STORAGE_KEYS.FX_CACHE_PREFIX}${currency.toLowerCase()}`;
}

function readCache(currency: SupportedCurrency): CachedFx | null {
  try {
    const raw = storage.getItem(getCacheKey(currency));
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<CachedFx>;
    if (
      !Number.isFinite(data.rate) ||
      !data.asOf ||
      !Number.isFinite(data.fetchedAt)
    ) {
      return null;
    }
    return {
      rate: Number(data.rate),
      asOf: String(data.asOf),
      fetchedAt: Number(data.fetchedAt),
    };
  } catch {
    return null;
  }
}

export function getCachedUsdFxRate(
  currency: SupportedCurrency
): { rate: number; asOf: string; stale: boolean } | null {
  if (currency === "USD") {
    return { rate: 1, asOf: new Date().toISOString(), stale: false };
  }
  const cached = readCache(currency);
  if (!cached) return null;
  const stale = Date.now() - cached.fetchedAt > FX_TTL_MS;
  return { rate: cached.rate, asOf: cached.asOf, stale };
}

function writeCache(currency: SupportedCurrency, cache: CachedFx): void {
  storage.setItem(getCacheKey(currency), JSON.stringify(cache));
}

async function fetchUsdRate(currency: Exclude<SupportedCurrency, "USD">): Promise<CachedFx> {
  const primaryUrl = `https://api.frankfurter.app/latest?from=USD&to=${currency}`;
  const fallbackUrl = "https://open.er-api.com/v6/latest/USD";

  const tryParse = async (url: string): Promise<CachedFx> => {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`FX fetch failed: ${res.status} ${body}`);
    }
    const data = (await res.json()) as {
      rates?: Record<string, number | undefined>;
      date?: string;
      time_last_update_utc?: string;
    };
    const rate = Number(data.rates?.[currency]);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`FX fetch failed: invalid ${currency} rate`);
    }
    return {
      rate,
      asOf: data.date || data.time_last_update_utc || new Date().toISOString(),
      fetchedAt: Date.now(),
    };
  };

  try {
    return await tryParse(primaryUrl);
  } catch {
    return await tryParse(fallbackUrl);
  }
}

export async function getUsdFxRate(currency: SupportedCurrency): Promise<{
  rate: number;
  asOf: string;
  fallback: boolean;
}> {
  if (currency === "USD") {
    return { rate: 1, asOf: new Date().toISOString(), fallback: false };
  }

  const cached = readCache(currency);
  const now = Date.now();
  if (cached && now - cached.fetchedAt <= FX_TTL_MS) {
    return { rate: cached.rate, asOf: cached.asOf, fallback: false };
  }

  const active = inFlight.get(currency);
  if (active) return active;

  const task = (async () => {
    try {
      const fresh = await fetchUsdRate(currency);
      writeCache(currency, fresh);
      return { rate: fresh.rate, asOf: fresh.asOf, fallback: false };
    } catch {
      if (cached) {
        return { rate: cached.rate, asOf: cached.asOf, fallback: true };
      }
      return {
        rate: FALLBACK_RATE,
        asOf: new Date().toISOString(),
        fallback: true,
      };
    } finally {
      inFlight.delete(currency);
    }
  })();

  inFlight.set(currency, task);
  return task;
}
