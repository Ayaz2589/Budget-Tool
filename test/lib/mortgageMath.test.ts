import { expect, test } from "bun:test";
import {
  buildAmortizationSchedule,
  computeMonthlyPayment,
  computeMonthlyRate,
  computeScenarioDelta,
  summarizeByMonth,
  summarizeByYear,
  type AmortizationRow,
} from "@/lib/mortgageMath";
import type { Expense } from "@/types/core";
import type { MortgageProfile } from "@/types/mortgage";

function profile(overrides: Partial<MortgageProfile> = {}): MortgageProfile {
  return {
    id: "mortgage-1",
    name: "Primary Home",
    currentBalance: 300000,
    interestRateAnnual: 4.5,
    loanType: "fixed",
    remainingTermMonths: 360,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

test("computeMonthlyRate returns annual percentage divided by 12", () => {
  expect(computeMonthlyRate(0)).toBe(0);
  expect(computeMonthlyRate(-3)).toBe(0);
  expect(computeMonthlyRate(12)).toBeCloseTo(0.01, 8);
});

test("computeMonthlyPayment handles both interest-bearing and zero-interest loans", () => {
  expect(computeMonthlyPayment(1200, 0, 12)).toBe(100);
  expect(computeMonthlyPayment(100000, 6, 360)).toBeCloseTo(599.55, 2);
  expect(computeMonthlyPayment(0, 6, 360)).toBe(0);
  expect(computeMonthlyPayment(100000, 6, 0)).toBe(0);
});

test("buildAmortizationSchedule reduces balance monotonically and keeps payment identity", () => {
  const schedule = buildAmortizationSchedule(
    profile({
      currentBalance: 10000,
      interestRateAnnual: 6,
      remainingTermMonths: 24,
    }),
  );

  expect(schedule.length).toBeGreaterThan(0);
  for (let i = 1; i < schedule.length; i += 1) {
    expect(schedule[i]!.balance).toBeLessThanOrEqual(schedule[i - 1]!.balance);
  }
  for (const row of schedule) {
    expect(row.payment).toBeGreaterThanOrEqual(row.interest);
    const delta = Math.abs(row.payment - (row.principal + row.interest));
    expect(delta).toBeLessThanOrEqual(0.11);
  }
  expect(schedule[schedule.length - 1]!.balance).toBe(0);
});

test("buildAmortizationSchedule respects recorded payments when larger than target", () => {
  const firstMonthKey = new Date().toISOString().slice(0, 7);
  const payments: Expense[] = [
    {
      id: "payment-1",
      date: `${firstMonthKey}-15`,
      amount: 250,
      description: "Manual mortgage payment",
      category: "Mortgage",
      source: "manual",
    },
  ];

  const schedule = buildAmortizationSchedule(
    profile({
      currentBalance: 1000,
      interestRateAnnual: 0,
      remainingTermMonths: 12,
      monthlyPaymentTarget: 50,
    }),
    payments,
  );

  expect(schedule[0]!.payment).toBe(250);
});

test("computeScenarioDelta shows payoff acceleration and interest savings with extra payments", () => {
  const base = buildAmortizationSchedule(
    profile({
      currentBalance: 250000,
      interestRateAnnual: 5.5,
      remainingTermMonths: 360,
    }),
  );
  const scenario = buildAmortizationSchedule(
    profile({
      currentBalance: 250000,
      interestRateAnnual: 5.5,
      remainingTermMonths: 360,
    }),
    [],
    { extraMonthlyPayment: 300 },
  );

  const delta = computeScenarioDelta(base, scenario);
  expect(delta.monthsSaved).toBeGreaterThan(0);
  expect(delta.interestSaved).toBeGreaterThan(0);
  expect(delta.payoffDateBase).toBeTruthy();
  expect(delta.payoffDateScenario).toBeTruthy();
});

test("summarizeByMonth and summarizeByYear aggregate values correctly", () => {
  const schedule: AmortizationRow[] = [
    {
      monthIndex: 1,
      date: "2026-01-01",
      payment: 1000,
      principal: 600,
      interest: 400,
      balance: 99000,
    },
    {
      monthIndex: 2,
      date: "2026-02-01",
      payment: 1000,
      principal: 602,
      interest: 398,
      balance: 98398,
    },
    {
      monthIndex: 3,
      date: "2027-01-01",
      payment: 1000,
      principal: 650,
      interest: 350,
      balance: 97748,
    },
  ];
  const payments: Expense[] = [
    {
      id: "p1",
      date: "2026-01-15",
      amount: 1000,
      description: "Mortgage payment",
      category: "Mortgage",
      source: "manual",
    },
    {
      id: "p2",
      date: "2027-01-15",
      amount: 1000,
      description: "Mortgage payment",
      category: "Mortgage",
      source: "manual",
    },
  ];

  const monthSummary = summarizeByMonth(schedule);
  expect(monthSummary).toEqual([
    {
      monthKey: "2026-01",
      principal: 600,
      interest: 400,
      payment: 1000,
      balance: 99000,
    },
    {
      monthKey: "2026-02",
      principal: 602,
      interest: 398,
      payment: 1000,
      balance: 98398,
    },
    {
      monthKey: "2027-01",
      principal: 650,
      interest: 350,
      payment: 1000,
      balance: 97748,
    },
  ]);

  const yearly = summarizeByYear(schedule, payments, 12000, 2400);
  expect(yearly).toEqual([
    {
      year: 2026,
      principal: 1202,
      interest: 798,
      payment: 2000,
      mortgagePaymentsRecorded: 1000,
      tax: 12000,
      insurance: 2400,
      totalHousingCost: 15400,
    },
    {
      year: 2027,
      principal: 650,
      interest: 350,
      payment: 1000,
      mortgagePaymentsRecorded: 1000,
      tax: 12000,
      insurance: 2400,
      totalHousingCost: 15400,
    },
  ]);
});
