import type { Expense } from "@/types/core";
import type { MortgageProfile } from "@/types/mortgage";
import { roundTo, sumAmountsBy } from "@/lib/math";

export interface MortgageScenarioInput {
  extraMonthlyPayment?: number;
  oneTimeExtraPayment?: number;
  annualExtraPayment?: number;
}

export interface AmortizationRow {
  monthIndex: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface MonthlySummaryRow {
  monthKey: string;
  principal: number;
  interest: number;
  payment: number;
  balance: number;
}

export interface YearlySummaryRow {
  year: number;
  principal: number;
  interest: number;
  payment: number;
  mortgagePaymentsRecorded: number;
  tax: number;
  insurance: number;
  totalHousingCost: number;
}

export interface ScenarioDelta {
  monthsSaved: number;
  interestSaved: number;
  payoffDateBase?: string;
  payoffDateScenario?: string;
}

function round2(value: number): number {
  return roundTo(value, 2);
}

function toMonthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function firstDayOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const next = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate())
  );
  return next.toISOString().slice(0, 10);
}

function resolveRemainingTermMonths(profile: MortgageProfile): number {
  if (
    typeof profile.remainingTermMonths === "number" &&
    Number.isFinite(profile.remainingTermMonths) &&
    profile.remainingTermMonths > 0
  ) {
    return Math.floor(profile.remainingTermMonths);
  }
  if (profile.maturityDate) {
    const now = firstDayOfMonth(new Date());
    const maturity = firstDayOfMonth(new Date(`${profile.maturityDate}T00:00:00Z`));
    const months =
      (maturity.getUTCFullYear() - now.getUTCFullYear()) * 12 +
      (maturity.getUTCMonth() - now.getUTCMonth());
    return Math.max(1, months);
  }
  return 360;
}

export function computeMonthlyRate(annualRate: number): number {
  if (!Number.isFinite(annualRate) || annualRate <= 0) return 0;
  return annualRate / 100 / 12;
}

export function computeMonthlyPayment(
  balance: number,
  annualRate: number,
  termMonths: number
): number {
  if (!Number.isFinite(balance) || balance <= 0) return 0;
  if (!Number.isFinite(termMonths) || termMonths <= 0) return 0;
  const monthlyRate = computeMonthlyRate(annualRate);
  if (monthlyRate === 0) {
    return round2(balance / termMonths);
  }
  const payment =
    (balance * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
  return round2(payment);
}

export function buildAmortizationSchedule(
  profile: MortgageProfile,
  payments: Expense[] = [],
  scenario: MortgageScenarioInput = {}
): AmortizationRow[] {
  const baseBalance = Math.max(0, Number(profile.currentBalance) || 0);
  if (baseBalance <= 0) return [];

  const termMonths = resolveRemainingTermMonths(profile);
  const basePayment = computeMonthlyPayment(
    baseBalance,
    profile.interestRateAnnual,
    termMonths
  );
  const monthlyRate = computeMonthlyRate(profile.interestRateAnnual);
  const monthlyPayment =
    (profile.monthlyPaymentTarget && profile.monthlyPaymentTarget > 0
      ? profile.monthlyPaymentTarget
      : basePayment) + (scenario.extraMonthlyPayment ?? 0);
  const oneTimeExtra = Math.max(0, scenario.oneTimeExtraPayment ?? 0);
  const annualExtra = Math.max(0, scenario.annualExtraPayment ?? 0);

  const monthNow = firstDayOfMonth(new Date()).toISOString().slice(0, 10);
  const paymentsByMonth = new Map<string, number>();
  for (const payment of payments) {
    if (!payment.date || !Number.isFinite(payment.amount)) continue;
    const key = toMonthKey(payment.date);
    paymentsByMonth.set(key, (paymentsByMonth.get(key) ?? 0) + payment.amount);
  }

  let balance = baseBalance;
  const schedule: AmortizationRow[] = [];
  for (let i = 0; i < termMonths && balance > 0; i++) {
    const date = addMonths(monthNow, i);
    const monthKey = toMonthKey(date);
    const interest = round2(balance * monthlyRate);
    let paymentAmount = monthlyPayment;
    if (i === 0 && oneTimeExtra > 0) paymentAmount += oneTimeExtra;
    if (annualExtra > 0 && i > 0 && i % 12 === 0) paymentAmount += annualExtra;
    if (paymentsByMonth.has(monthKey)) {
      paymentAmount = Math.max(paymentAmount, paymentsByMonth.get(monthKey) ?? 0);
    }
    paymentAmount = Math.max(paymentAmount, interest);
    const principal = round2(Math.min(balance, paymentAmount - interest));
    balance = round2(Math.max(0, balance - principal));
    schedule.push({
      monthIndex: i + 1,
      date,
      payment: round2(paymentAmount),
      principal,
      interest,
      balance,
    });
  }
  return schedule;
}

export function summarizeByMonth(schedule: AmortizationRow[]): MonthlySummaryRow[] {
  const map = new Map<string, MonthlySummaryRow>();
  for (const row of schedule) {
    const monthKey = toMonthKey(row.date);
    const existing = map.get(monthKey);
    if (!existing) {
      map.set(monthKey, {
        monthKey,
        principal: row.principal,
        interest: row.interest,
        payment: row.payment,
        balance: row.balance,
      });
      continue;
    }
    existing.principal = round2(existing.principal + row.principal);
    existing.interest = round2(existing.interest + row.interest);
    existing.payment = round2(existing.payment + row.payment);
    existing.balance = row.balance;
  }
  return Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

export function summarizeByYear(
  schedule: AmortizationRow[],
  payments: Expense[],
  annualPropertyTax?: number,
  annualInsurance?: number
): YearlySummaryRow[] {
  const paymentMap = new Map<number, number>();
  for (const payment of payments) {
    const year = Number(payment.date.slice(0, 4));
    if (!Number.isFinite(year)) continue;
    paymentMap.set(year, round2((paymentMap.get(year) ?? 0) + payment.amount));
  }

  const map = new Map<number, YearlySummaryRow>();
  for (const row of schedule) {
    const year = Number(row.date.slice(0, 4));
    if (!Number.isFinite(year)) continue;
    const existing = map.get(year);
    if (!existing) {
      map.set(year, {
        year,
        principal: row.principal,
        interest: row.interest,
        payment: row.payment,
        mortgagePaymentsRecorded: paymentMap.get(year) ?? 0,
        tax: annualPropertyTax ?? 0,
        insurance: annualInsurance ?? 0,
        totalHousingCost: round2(
          (paymentMap.get(year) ?? 0) + (annualPropertyTax ?? 0) + (annualInsurance ?? 0)
        ),
      });
      continue;
    }
    existing.principal = round2(existing.principal + row.principal);
    existing.interest = round2(existing.interest + row.interest);
    existing.payment = round2(existing.payment + row.payment);
    existing.mortgagePaymentsRecorded = paymentMap.get(year) ?? 0;
    existing.tax = annualPropertyTax ?? 0;
    existing.insurance = annualInsurance ?? 0;
    existing.totalHousingCost = round2(
      existing.mortgagePaymentsRecorded + existing.tax + existing.insurance
    );
  }
  return Array.from(map.values()).sort((a, b) => a.year - b.year);
}

export function computeScenarioDelta(
  base: AmortizationRow[],
  scenario: AmortizationRow[]
): ScenarioDelta {
  const baseMonths = base.length;
  const scenarioMonths = scenario.length;
  const baseInterest = round2(sumAmountsBy(base, (row) => row.interest));
  const scenarioInterest = round2(sumAmountsBy(scenario, (row) => row.interest));
  return {
    monthsSaved: Math.max(0, baseMonths - scenarioMonths),
    interestSaved: round2(Math.max(0, baseInterest - scenarioInterest)),
    payoffDateBase: base[base.length - 1]?.date,
    payoffDateScenario: scenario[scenario.length - 1]?.date,
  };
}
