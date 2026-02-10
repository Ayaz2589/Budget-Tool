const FX_CACHE_KEY = "budget-tool-fx-usd-eur";
const FX_TTL_MS = 12 * 60 * 60 * 1000;
const FALLBACK_RATE = 1;

let inFlight: Promise<{ rate: number; asOf: string; fallback: boolean }> | null = null;

type CachedFx = {
  rate: number;
  asOf: string;
  fetchedAt: number;
};

function readCache(): CachedFx | null {
  try {
    const raw = localStorage.getItem(FX_CACHE_KEY);
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

function writeCache(cache: CachedFx): void {
  try {
    localStorage.setItem(FX_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

async function fetchUsdToEurRate(): Promise<CachedFx> {
  const primaryUrl = "https://api.frankfurter.app/latest?from=USD&to=EUR";
  const fallbackUrl = "https://open.er-api.com/v6/latest/USD";

  const tryParse = async (url: string): Promise<CachedFx> => {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`FX fetch failed: ${res.status} ${body}`);
    }
    const data = (await res.json()) as {
      rates?: { EUR?: number };
      date?: string;
      time_last_update_utc?: string;
    };
    const rate = Number(data.rates?.EUR);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("FX fetch failed: invalid EUR rate");
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

export async function getUsdToEurRate(): Promise<{
  rate: number;
  asOf: string;
  fallback: boolean;
}> {
  const cached = readCache();
  const now = Date.now();
  if (cached && now - cached.fetchedAt <= FX_TTL_MS) {
    return { rate: cached.rate, asOf: cached.asOf, fallback: false };
  }

  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const fresh = await fetchUsdToEurRate();
      writeCache(fresh);
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
      inFlight = null;
    }
  })();

  return inFlight;
}
