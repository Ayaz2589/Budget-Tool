import { test, expect } from "bun:test";
import {
  computeAverageCost,
  computeHoldingMetrics,
  computePortfolioMetrics,
} from "@/lib/investmentsMath";
import type { InvestmentPortfolio, MarketQuote } from "@/types/investments";

test("computeAverageCost handles normal and zero-quantity cases", () => {
  expect(computeAverageCost(10, 250)).toBe(25);
  expect(computeAverageCost(0, 250)).toBe(0);
});

test("computeHoldingMetrics derives value and P/L fields", () => {
  const metrics = computeHoldingMetrics(
    {
      id: "h1",
      symbol: "VOO",
      quantity: 4,
      investedAmount: 1500,
      currency: "USD",
    },
    {
      symbol: "VOO",
      price: 400,
      change: 2,
      changePercent: 0.005,
      asOf: "2026-02-06T00:00:00.000Z",
    }
  );

  expect(metrics.marketValue).toBe(1600);
  expect(metrics.avgCost).toBe(375);
  expect(metrics.unrealizedPnL).toBe(100);
  expect(metrics.unrealizedPnLPercent).toBeCloseTo(100 / 1500, 8);
});

test("computePortfolioMetrics aggregates totals and allocation", () => {
  const portfolio: InvestmentPortfolio = {
    id: "p1",
    name: "Core",
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    holdings: [
      {
        id: "h1",
        symbol: "VOO",
        quantity: 2,
        investedAmount: 700,
        currency: "USD",
      },
      {
        id: "h2",
        symbol: "QQQ",
        quantity: 1,
        investedAmount: 300,
        currency: "USD",
      },
    ],
  };

  const quotes: Record<string, MarketQuote> = {
    VOO: {
      symbol: "VOO",
      price: 400,
      change: 0,
      changePercent: 0,
      asOf: "2026-02-06T00:00:00.000Z",
    },
    QQQ: {
      symbol: "QQQ",
      price: 350,
      change: 0,
      changePercent: 0,
      asOf: "2026-02-06T00:00:00.000Z",
    },
  };

  const metrics = computePortfolioMetrics(portfolio, quotes);

  expect(metrics.totalInvested).toBe(1000);
  expect(metrics.totalMarketValue).toBe(1150);
  expect(metrics.totalUnrealizedPnL).toBe(150);
  expect(metrics.totalUnrealizedPnLPercent).toBe(0.15);
  expect(metrics.allocation).toHaveLength(2);
  expect(metrics.allocation[0]?.symbol).toBe("VOO");
  expect(metrics.allocation[0]?.percent).toBeCloseTo(800 / 1150, 8);
});

