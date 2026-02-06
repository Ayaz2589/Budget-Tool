import type {
  MarketQuote,
  OhlcBar,
  SymbolSearchResult,
} from "@/types/investments";

export type OhlcTimeframe = "1W" | "1M" | "3M" | "6M" | "1Y";

const ALPHA_BASE_URL = "https://www.alphavantage.co/query";
const QUOTE_TTL_MS = 60_000;
const RATE_LIMIT_COOLDOWN_MS = 75_000;
const DAILY_RATE_LIMIT_COOLDOWN_MS = 24 * 60 * 60_000;
const OHLC_STORAGE_KEY = "budget-tool-ohlc-cache-v1";
const MAX_PERSISTED_SYMBOLS = 20;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();
let rateLimitedUntilMs = 0;

type PersistedOhlcEntry = {
  value: OhlcBar[];
  expiresAt: number;
  updatedAt: number;
};

function getApiKey(): string {
  const key = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
  if (!key || typeof key !== "string") {
    throw new Error("Missing VITE_ALPHA_VANTAGE_API_KEY");
  }
  return key;
}

function getCached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) return null;
  return hit.value as T;
}

function getLastValue<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  return hit.value as T;
}

function setCached<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function ohlcKey(symbol: string, timeframe: OhlcTimeframe): string {
  return `ohlc:${symbol}:${timeframe}`;
}

function parseOhlcKey(key: string): { symbol: string; timeframe: OhlcTimeframe } | null {
  const parts = key.split(":");
  if (parts.length !== 3 || parts[0] !== "ohlc") return null;
  const timeframe = parts[2];
  if (
    timeframe !== "1W" &&
    timeframe !== "1M" &&
    timeframe !== "3M" &&
    timeframe !== "6M" &&
    timeframe !== "1Y"
  ) {
    return null;
  }
  return { symbol: parts[1] ?? "", timeframe };
}

function getOhlcTtlMs(timeframe: OhlcTimeframe): number {
  if (timeframe === "1W") return 15 * 60_000;
  if (timeframe === "1M") return 30 * 60_000;
  if (timeframe === "3M") return 60 * 60_000;
  if (timeframe === "6M") return 6 * 60 * 60_000;
  return 12 * 60 * 60_000;
}

function readPersistedOhlcCache(): Record<string, PersistedOhlcEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(OHLC_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PersistedOhlcEntry>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writePersistedOhlcCache(data: Record<string, PersistedOhlcEntry>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OHLC_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage write failures.
  }
}

function prunePersistedOhlcCache(
  data: Record<string, PersistedOhlcEntry>
): Record<string, PersistedOhlcEntry> {
  const now = Date.now();
  const cleaned: Record<string, PersistedOhlcEntry> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!value || !Array.isArray(value.value) || typeof value.expiresAt !== "number") continue;
    if (value.expiresAt < now) continue;
    if (!parseOhlcKey(key)) continue;
    cleaned[key] = value;
  }

  const bySymbol = new Map<string, number>();
  for (const [key, value] of Object.entries(cleaned)) {
    const parsed = parseOhlcKey(key);
    if (!parsed) continue;
    const prev = bySymbol.get(parsed.symbol) ?? 0;
    bySymbol.set(parsed.symbol, Math.max(prev, value.updatedAt));
  }
  if (bySymbol.size <= MAX_PERSISTED_SYMBOLS) return cleaned;

  const symbolsByAge = Array.from(bySymbol.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([symbol]) => symbol);
  const symbolsToDrop = new Set(
    symbolsByAge.slice(0, Math.max(0, bySymbol.size - MAX_PERSISTED_SYMBOLS))
  );

  const pruned: Record<string, PersistedOhlcEntry> = {};
  for (const [key, value] of Object.entries(cleaned)) {
    const parsed = parseOhlcKey(key);
    if (!parsed || symbolsToDrop.has(parsed.symbol)) continue;
    pruned[key] = value;
  }
  return pruned;
}

function getPersistedOhlc(key: string): OhlcBar[] | null {
  const data = readPersistedOhlcCache();
  const hit = data[key];
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) return null;
  return hit.value;
}

function getAnyPersistedOhlc(key: string): OhlcBar[] | null {
  const data = readPersistedOhlcCache();
  const hit = data[key];
  if (!hit) return null;
  return hit.value;
}

function setPersistedOhlc(key: string, value: OhlcBar[], ttlMs: number): void {
  const data = readPersistedOhlcCache();
  data[key] = {
    value,
    expiresAt: Date.now() + ttlMs,
    updatedAt: Date.now(),
  };
  writePersistedOhlcCache(prunePersistedOhlcCache(data));
}

function isRateLimitedResponse(json: Record<string, unknown>): boolean {
  if (typeof json.Note === "string" && json.Note.length > 0) return true;
  if (typeof json.Information === "string" && json.Information.length > 0) return true;
  return false;
}

function getRateLimitText(json: Record<string, unknown>): string {
  if (typeof json.Note === "string" && json.Note.length > 0) return json.Note;
  if (typeof json.Information === "string" && json.Information.length > 0) return json.Information;
  return "";
}

function looksLikeDailyRateLimit(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("per day") ||
    lower.includes("daily") ||
    lower.includes("25 requests") ||
    lower.includes("premium endpoint")
  );
}

async function fetchAlpha(
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  if (Date.now() < rateLimitedUntilMs) {
    throw new Error("Rate limited by Alpha Vantage");
  }
  const query = new URLSearchParams({
    ...params,
    apikey: getApiKey(),
  });
  const res = await fetch(`${ALPHA_BASE_URL}?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Market API request failed: ${res.status}`);
  }
  const json = (await res.json()) as Record<string, unknown>;
  if (isRateLimitedResponse(json)) {
    const detail = getRateLimitText(json);
    const cooldownMs = looksLikeDailyRateLimit(detail)
      ? DAILY_RATE_LIMIT_COOLDOWN_MS
      : RATE_LIMIT_COOLDOWN_MS;
    rateLimitedUntilMs = Math.max(
      rateLimitedUntilMs,
      Date.now() + cooldownMs,
    );
    throw new Error(
      detail
        ? `Rate limited by Alpha Vantage: ${detail}`
        : "Rate limited by Alpha Vantage",
    );
  }
  if (typeof json["Error Message"] === "string") {
    throw new Error(String(json["Error Message"]));
  }
  return json;
}

export function getMarketDataCooldownRemainingMs(): number {
  return Math.max(0, rateLimitedUntilMs - Date.now());
}

export function resetMarketDataStateForTests(): void {
  cache.clear();
  inFlight.clear();
  rateLimitedUntilMs = 0;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(OHLC_STORAGE_KEY);
  }
}

async function runWithCache<T>(
  key: string,
  ttlMs: number,
  producer: () => Promise<T>
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached) return cached;

  const active = inFlight.get(key) as Promise<T> | undefined;
  if (active) return active;

  const promise = producer()
    .then((value) => {
      setCached(key, value, ttlMs);
      return value;
    })
    .catch((error) => {
      const stale = getLastValue<T>(key);
      if (stale) return stale;
      throw error;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

function parseQuote(json: Record<string, unknown>, symbol: string): MarketQuote {
  const raw = json["Global Quote"] as Record<string, unknown> | undefined;
  if (!raw) throw new Error("Missing quote payload");
  const price = Number(raw["05. price"] ?? 0);
  const change = Number(raw["09. change"] ?? 0);
  const changePercentRaw = String(raw["10. change percent"] ?? "0%");
  const changePercent = Number(changePercentRaw.replace("%", "")) / 100;
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid quote price");
  }
  return {
    symbol,
    price,
    change: Number.isFinite(change) ? change : 0,
    changePercent: Number.isFinite(changePercent) ? changePercent : 0,
    asOf: new Date().toISOString(),
  };
}

function barsForTimeframe(all: OhlcBar[], timeframe: OhlcTimeframe): OhlcBar[] {
  const points = timeframe === "1W"
    ? 7
    : timeframe === "1M"
      ? 30
      : timeframe === "3M"
        ? 90
        : timeframe === "6M"
          ? 180
          : 365;
  return all.slice(-points);
}

function parseDailySeries(json: Record<string, unknown>): OhlcBar[] {
  const series = json["Time Series (Daily)"] as
    | Record<string, Record<string, string>>
    | undefined;
  if (!series) throw new Error("Missing daily OHLC payload");

  return Object.entries(series)
    .map(([date, values]) => ({
      time: date,
      open: Number(values["1. open"] ?? 0),
      high: Number(values["2. high"] ?? 0),
      low: Number(values["3. low"] ?? 0),
      close: Number(values["4. close"] ?? 0),
      volume: Number(values["5. volume"] ?? 0),
    }))
    .filter((x) => Number.isFinite(x.open) && Number.isFinite(x.close))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export async function searchSymbols(query: string): Promise<SymbolSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const key = `search:${trimmed.toLowerCase()}`;
  return runWithCache(key, QUOTE_TTL_MS, async () => {
    const json = await fetchAlpha({
      function: "SYMBOL_SEARCH",
      keywords: trimmed,
    });
    const matches = (json.bestMatches as Record<string, string>[] | undefined) ?? [];
    return matches
      .map((match) => ({
        symbol: (match["1. symbol"] ?? "").trim(),
        name: (match["2. name"] ?? "").trim(),
        region: (match["4. region"] ?? "").trim(),
        currency: (match["8. currency"] ?? "").trim(),
      }))
      .filter((x) => x.symbol.length > 0 && x.name.length > 0)
      .slice(0, 12);
  });
}

export async function getQuote(symbol: string): Promise<MarketQuote> {
  const normalized = symbol.trim().toUpperCase();
  const key = `quote:${normalized}`;
  return runWithCache(key, QUOTE_TTL_MS, async () => {
    const json = await fetchAlpha({
      function: "GLOBAL_QUOTE",
      symbol: normalized,
    });
    return parseQuote(json, normalized);
  });
}

export async function getOhlc(
  symbol: string,
  timeframe: OhlcTimeframe
): Promise<OhlcBar[]> {
  const normalized = symbol.trim().toUpperCase();
  const key = ohlcKey(normalized, timeframe);
  const cached = getCached<OhlcBar[]>(key);
  if (cached) return cached;

  const persisted = getPersistedOhlc(key);
  if (persisted) {
    setCached(key, persisted, getOhlcTtlMs(timeframe));
    return persisted;
  }

  const fetchKey = `ohlc-fetch:${normalized}`;
  const inFlightFetch = inFlight.get(fetchKey) as Promise<OhlcBar[]> | undefined;
  if (inFlightFetch) {
    const allBars = await inFlightFetch;
    return barsForTimeframe(allBars, timeframe);
  }

  const fetchPromise = (async () => {
    const json = await fetchAlpha({
      function: "TIME_SERIES_DAILY",
      symbol: normalized,
      outputsize: "full",
    });
    const allBars = parseDailySeries(json);
    if (allBars.length === 0) {
      throw new Error("No OHLC data found");
    }
    for (const tf of ["1W", "1M", "3M", "6M", "1Y"] as OhlcTimeframe[]) {
      const tfKey = ohlcKey(normalized, tf);
      const tfBars = barsForTimeframe(allBars, tf);
      const ttlMs = getOhlcTtlMs(tf);
      setCached(tfKey, tfBars, ttlMs);
      setPersistedOhlc(tfKey, tfBars, ttlMs);
    }
    return allBars;
  })().finally(() => {
    inFlight.delete(fetchKey);
  });

  inFlight.set(fetchKey, fetchPromise);
  try {
    const allBars = await fetchPromise;
    return barsForTimeframe(allBars, timeframe);
  } catch (error) {
    const stale = getAnyPersistedOhlc(key);
    if (stale) return stale;
    throw error;
  }
}
