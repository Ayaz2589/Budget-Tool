import { expect, test } from "bun:test";
import {
  amountsWithinTolerance,
  clamp,
  computeDebtBalance,
  computeDebtProgress,
  computeMonthOverMonthPct,
  computeNetCashFlow,
  computeOwnerNetFromTransfers,
  percentOfTotal,
  roundTo,
  safeDivide,
  sumAmountsBy,
} from "@/lib/math";

test("sumAmountsBy adds finite values from a list", () => {
  const result = sumAmountsBy(
    [{ amount: 10 }, { amount: 12.5 }, { amount: Number.NaN }],
    (row) => row.amount,
  );
  expect(result).toBe(22.5);
});

test("computeNetCashFlow subtracts expenses and debt payments from income", () => {
  expect(computeNetCashFlow(5000, 1200, 300)).toBe(3500);
});

test("month-over-month percent returns null when previous month is not positive", () => {
  expect(computeMonthOverMonthPct(100, 0)).toBeNull();
  expect(computeMonthOverMonthPct(120, 100)).toBe(0.2);
});

test("debt balance and debt progress are clamped safely", () => {
  expect(computeDebtBalance(1000, 1200)).toBe(0);
  expect(computeDebtProgress(1000, 250)).toBe(0.75);
  expect(computeDebtProgress(0, 0)).toBe(0);
});

test("owner net and percent helpers are deterministic", () => {
  expect(computeOwnerNetFromTransfers(1500, 200, 75)).toBe(1375);
  expect(percentOfTotal(25, 100)).toBe(0.25);
  expect(percentOfTotal(25, 0)).toBe(0);
});

test("utility helpers cover rounding, tolerance, divide and clamp", () => {
  expect(roundTo(10.005, 2)).toBe(10.01);
  expect(safeDivide(5, 2)).toBe(2.5);
  expect(safeDivide(5, 0, -1)).toBe(-1);
  expect(amountsWithinTolerance(10.0, 10.009, 0.01)).toBe(true);
  expect(amountsWithinTolerance(10.0, 10.02, 0.01)).toBe(false);
  expect(clamp(120, 0, 100)).toBe(100);
});
