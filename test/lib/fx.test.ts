import { beforeEach, describe, expect, mock, test } from "bun:test";
import { getUsdToEurRate } from "@/lib/fx";

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

    const first = await getUsdToEurRate();
    expect(first.rate).toBe(0.92);
    expect(first.asOf).toBe("2026-02-10");
    expect(first.fallback).toBe(false);

    const second = await getUsdToEurRate();
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

    const fx = await getUsdToEurRate();
    expect(fx.rate).toBe(0.9);
    expect(fx.fallback).toBe(true);
  });
});

