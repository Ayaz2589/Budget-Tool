import { beforeEach, describe, expect, mock, test } from "bun:test";
import { getUsdFxRate } from "@/lib/platform/fx";
import type { DisplayCurrency } from "@/types/currency";

const originalFetch = globalThis.fetch;

describe("fx", () => {
  beforeEach(() => {
    localStorage.clear();
    mock.restore();
    globalThis.fetch = originalFetch;
  });

  test("returns fresh value and caches it", async () => {
    globalThis.fetch = mock(async () => {
      return new Response(
        JSON.stringify({ rates: { EUR: 0.92 }, date: "2026-02-10" }),
        { status: 200 }
      ) as unknown as Response;
    }) as typeof fetch;

    const first = await getUsdFxRate("EUR");
    expect(first.rate).toBe(0.92);
    expect(first.asOf).toBe("2026-02-10");
    expect(first.fallback).toBe(false);

    const second = await getUsdFxRate("EUR");
    expect(second.rate).toBe(0.92);
    expect(second.fallback).toBe(false);
  });

  test("uses stale cache when fetch fails", async () => {
    localStorage.setItem(
      "budget-tool-fx-usd-eur",
      JSON.stringify({ rate: 0.9, asOf: "2026-02-01", fetchedAt: 0 })
    );
    globalThis.fetch = mock(async () => {
      return new Response("fail", { status: 500 }) as unknown as Response;
    }) as typeof fetch;

    const fx = await getUsdFxRate("EUR");
    expect(fx.rate).toBe(0.9);
    expect(fx.fallback).toBe(true);
  });

  test("returns USD rate without fetch", async () => {
    const fx = await getUsdFxRate("USD");
    expect(fx.rate).toBe(1);
    expect(fx.fallback).toBe(false);
  });

  test("fetches and caches JPY rate", async () => {
    globalThis.fetch = mock(async () => {
      return new Response(
        JSON.stringify({ rates: { JPY: 150.12 }, date: "2026-02-10" }),
        { status: 200 }
      ) as unknown as Response;
    }) as typeof fetch;

    const fx = await getUsdFxRate("JPY");
    expect(fx.rate).toBe(150.12);
    expect(fx.fallback).toBe(false);
  });

  test("logs console.warn when falling back to rate 1 with no cache", async () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map(String).join(" "));
    };

    globalThis.fetch = mock(async () => {
      return new Response("fail", { status: 500 }) as unknown as Response;
    }) as typeof fetch;

    const fx = await getUsdFxRate("GBP");
    expect(fx.rate).toBe(1);
    expect(fx.fallback).toBe(true);
    expect(warnings.some((w) => w.includes("GBP"))).toBe(true);

    console.warn = originalWarn;
  });

  test("fetches rates for all newly added currencies", async () => {
    const currencies: DisplayCurrency[] = [
      "CAD",
      "MXN",
      "GBP",
      "BDT",
      "INR",
      "KRW",
      "CNY",
      "TWD",
    ];
    let idx = 0;
    globalThis.fetch = mock(async () => {
      const code = currencies[idx]!;
      idx += 1;
      return new Response(
        JSON.stringify({ rates: { [code]: 1 + idx }, date: "2026-02-10" }),
        { status: 200 }
      ) as unknown as Response;
    }) as typeof fetch;

    for (const code of currencies) {
      const fx = await getUsdFxRate(code);
      expect(fx.rate).toBeGreaterThan(1);
      expect(fx.fallback).toBe(false);
    }
  });
});
