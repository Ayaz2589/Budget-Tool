import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import {
  getMarketDataCooldownRemainingMs,
  getOhlc,
  getQuote,
  resetMarketDataStateForTests,
  searchSymbols,
} from "@/lib/marketData";

beforeEach(() => {
  mock.restore();
  resetMarketDataStateForTests();
  (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_ALPHA_VANTAGE_API_KEY =
    "test-key";
});

afterEach(() => {
  mock.restore();
});

test("searchSymbols maps Alpha Vantage matches", async () => {
  const fetchMock = mock(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          bestMatches: [
            {
              "1. symbol": "VOO",
              "2. name": "Vanguard S&P 500 ETF",
              "4. region": "United States",
              "8. currency": "USD",
            },
          ],
        }),
        { status: 200 }
      )
    )
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  const matches = await searchSymbols("voo");
  expect(matches).toHaveLength(1);
  expect(matches[0]).toMatchObject({
    symbol: "VOO",
    name: "Vanguard S&P 500 ETF",
  });
});

test("getQuote returns parsed quote and reuses cache", async () => {
  let calls = 0;
  const fetchMock = mock(() => {
    calls += 1;
    return Promise.resolve(
      new Response(
        JSON.stringify({
          "Global Quote": {
            "05. price": "515.25",
            "09. change": "1.25",
            "10. change percent": "0.24%",
          },
        }),
        { status: 200 }
      )
    );
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  const first = await getQuote("spy");
  const second = await getQuote("SPY");

  expect(calls).toBe(1);
  expect(first.symbol).toBe("SPY");
  expect(first.price).toBe(515.25);
  expect(second.price).toBe(515.25);
});

test("getOhlc parses bars and handles timeframe slicing", async () => {
  const fetchMock = mock(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          "Time Series (Daily)": {
            "2026-02-03": {
              "1. open": "500",
              "2. high": "510",
              "3. low": "495",
              "4. close": "505",
              "5. volume": "100",
            },
            "2026-02-04": {
              "1. open": "505",
              "2. high": "515",
              "3. low": "500",
              "4. close": "510",
              "5. volume": "110",
            },
            "2026-02-05": {
              "1. open": "510",
              "2. high": "520",
              "3. low": "505",
              "4. close": "515",
              "5. volume": "120",
            },
          },
        }),
        { status: 200 }
      )
    )
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  const bars = await getOhlc("VOO", "1W");
  expect(bars).toHaveLength(3);
  expect(bars[0]?.time).toBe("2026-02-03");
  expect(bars[2]?.close).toBe(515);
});

test("rate-limit response starts cooldown and blocks immediate follow-up requests", async () => {
  let calls = 0;
  const fetchMock = mock(() => {
    calls += 1;
    return Promise.resolve(
      new Response(
        JSON.stringify({
          Note: "Thank you for using Alpha Vantage!",
        }),
        { status: 200 }
      )
    );
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  await expect(getQuote("VOO")).rejects.toThrow(/rate limited/i);
  const remaining = getMarketDataCooldownRemainingMs();
  expect(remaining).toBeGreaterThan(0);

  await expect(getQuote("VOO")).rejects.toThrow(/rate limited/i);
  expect(calls).toBe(1);
});

test("rate-limit error includes provider details when present", async () => {
  const fetchMock = mock(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          Information: "The free API rate limit is 25 requests per day.",
        }),
        { status: 200 }
      )
    )
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  await expect(getQuote("AAPL")).rejects.toThrow(/25 requests per day/i);
});
