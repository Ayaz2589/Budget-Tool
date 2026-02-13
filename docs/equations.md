# Equation Inventory

This document lists the equation-style logic used across the app, with examples in comment form.

## Scope

- Covers equation-bearing logic in `src/` (financial math, conversion math, date math, and key operational timing math).
- Excludes pure rendering/styling code with no numeric behavior impact.

---

## 1) Monthly Totals (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/totals.ts`)

### `computeMonthTotals`

```ts
// totalEarned = sum(income.amount for selected month)
// Example: 3200 + 1800 = 5000

// totalSpent = sum(expense.amount for selected month)
// Example: 900 + 300 + 100 = 1300

// totalSpentWithoutMortgage = sum(expense.amount where category != Mortgage)
// Example: (900 mortgage excluded) 300 + 100 = 400

// total5050Spent = sum(expense.amount where category == "50/50")
// Example: 200 + 60 = 260

// split5050 = total5050Spent / 2
// Example: 260 / 2 = 130

// novasTotalSpending = novasPurchase + split5050
// Example: 500 + 130 = 630

// myTotalSpendingWithoutMortgage = myCategoriesSpent + split5050
// Example: 700 + 130 = 830

// totalSaved = totalEarned - totalSpent
// Example: 5000 - 1300 = 3700

// personalSavingsRate = totalSaved / totalEarned (if totalEarned > 0 else 0)
// Example: 3700 / 5000 = 0.74 (74%)

// investingTotal = hysa + investing
// Example: 1200 + 800 = 2000
```

### `computeGrandTotals`

```ts
// Every "grand" metric is sum(month.metric) across all months
// Example: grand.totalSpent = 1300 + 1500 + 1100 = 3900

// grand.personalSavingsRate = sum(totalSaved) / sum(totalEarned), guarded by denominator > 0
// Example: (3700 + 3200) / (5000 + 4800) = 6900 / 9800 = 0.7041
```

---

## 2) Debt Math (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/debtUtils.ts`)

### `getDebtBalance`

```ts
// totalPaid = sum(payment.amount for debtId)
// Example: 250 + 250 + 100 = 600

// balance = max(0, initialAmount - totalPaid)
// Example: max(0, 1200 - 600) = 600
```

---

## 3) Owner Allocation + Balances (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/ownerAccounting.ts`)

### Rounding

```ts
// round2(value) = round((value + EPSILON) * 100) / 100
// Example: round2(10.005) = 10.01
```

### Allocation scaling (`scaleAllocations`)

```ts
// ratio = total / sum(allocation.amount)
// Example: total 100, raw sum 90 => ratio = 1.1111...

// scaledAmount = round2(rawAmount * ratio)
// Example: 45 * 1.1111... = 50

// diff = total - sum(scaledAmounts)
// Example: total 100, scaled sum 99.99 => diff 0.01
// Apply diff to last row to force exact total conservation.
```

### Explicit allocation with mixed fixed+percent (`normalizeExplicitAllocation`)

```ts
// fixedAmount = sum(entry.amount)
// remaining = max(0, expenseAmount - fixedAmount)
// percentAmount = (remaining * entry.percent) / percentTotal

// Example:
// expenseAmount = 100, fixedAmount = 30, remaining = 70
// percents: A=25, B=75 (total 100)
// A gets 17.5, B gets 52.5, fixed rows keep their fixed amounts.
```

### Equal split

```ts
// perOwnerAmount = round2(totalAmount / ownerCount)
// Example: 655 / 2 = 327.5
```

### Owner balance (`buildOwnerBalances`)

```ts
// paid = sum(expense.amount where paidByOwner == owner)
// allocated = sum(owner's normalized allocation amounts)
// sent = sum(transfer.amount where fromOwner == owner)
// received = sum(transfer.amount where toOwner == owner)

// balance = paid - allocated + received - sent
// Example: paid 2000, allocated 1400, received 300, sent 100 => balance 800
```

---

## 4) Mortgage Math (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/mortgageMath.ts`)

### Rate + payment

```ts
// monthlyRate = annualRate / 100 / 12
// Example: 6% => 0.06 / 12 = 0.005

// Zero-rate payment: payment = balance / termMonths
// Example: 120000 / 240 = 500

// Standard amortization payment:
// payment = (balance * r) / (1 - (1 + r)^(-n))
// Example: balance 120000, r 0.005, n 240 => ~859.29
```

### Schedule roll-forward (`buildAmortizationSchedule`)

```ts
// interest = round2(balance * monthlyRate)
// principal = round2(min(balance, paymentAmount - interest))
// nextBalance = round2(max(0, balance - principal))

// Example (month):
// balance 100000, rate 0.5% => interest 500
// payment 900 => principal 400
// next balance => 99600
```

### Scenario extras

```ts
// month 0 adds oneTimeExtraPayment
// every 12th month adds annualExtraPayment
// monthlyPaymentTarget or computed base payment can also be increased by extraMonthlyPayment
```

### Monthly/yearly summaries

```ts
// summarizeByMonth: sums principal, interest, payment per monthKey
// summarizeByYear: sums by year and computes:
// totalHousingCost = mortgagePaymentsRecorded + tax + insurance
// Example: 24000 + 9000 + 1800 = 34800
```

### Scenario delta

```ts
// monthsSaved = max(0, baseMonths - scenarioMonths)
// interestSaved = max(0, baseInterest - scenarioInterest), rounded 2 decimals
// Example: 318 - 280 = 38 months saved
```

---

## 5) Currency + FX Math

### Display conversion (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/format.ts`)

```ts
// displayAmount = usdAmount * fxRate (non-USD)
// Example: USD 100, EUR rate 0.84 => EUR 84

// usdAmount = displayAmount / fxRate (non-USD input parse path)
// Example: EUR 84 / 0.84 = USD 100

// Percent fallback string uses n * 100
// Example: 0.125 => "12.5%"
```

### FX cache timing (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/fx.ts`)

```ts
// FX_TTL_MS = 12 * 60 * 60 * 1000
// stale = (Date.now() - fetchedAt) > FX_TTL_MS
// Example: fetched 13h ago => stale true
```

### Currency input rounding/precision (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/currencyInput.ts`)

```ts
// Fraction digits enforced by currency metadata
// Example: JPY keeps 0 decimals, USD/EUR keep 2 decimals
```

---

## 6) Dashboard Equations

### KPI and aggregates (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/pages/dashboard/dashboardSelectors.ts`)

```ts
// currentSpent = currentExpenses + currentDebtPayments
// previousSpent = previousExpenses + previousDebtPayments

// netCashFlow = currentIncome - currentExpenses - currentDebtPayments
// Example: 9000 - 2500 - 400 = 6100

// spentVsLastMonthPct = (currentSpent - previousSpent) / previousSpent (if previousSpent > 0 else null)
// Example: (2900 - 2000) / 2000 = 0.45 => +45%

// debtOutstanding = sum(getDebtBalance(debt))
// Example: 600 + 1200 = 1800
```

### Debt snapshot

```ts
// paid = max(0, initialAmount - remaining)
// progress = paid / initialAmount (if initialAmount > 0 else 0)
// Example: initial 2000, remaining 500 => paid 1500, progress 0.75
```

### Fixed obligations

```ts
// fixedObligations = (mortgage + utilities expenses for month) + debtPaymentsForMonth
// Example: (1200 + 180) + 300 = 1680
```

### Owner allocation and owner split (month/range)

```ts
// owner slice value = sum(normalized allocation amounts for that owner)
// shared bucket increments for shared expenses; unassigned allocation also contributes to shared bucket
```

### Dashboard insights (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/pages/dashboard/dashboardInsights.ts`)

```ts
// spending spike pct = (currentSpent - previousSpent) / previousSpent
// Alert threshold: pct >= 0.25 (25%)
// Example: previous 2000, current 2600 => 30% => alert
```

### In-page derived rows (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/pages/dashboard/Dashboard.tsx`)

```ts
// netCashFlow chart row:
// netCashFlow = incomeTotal - expensesTotal - debtPaymentsTotal

// owner transfer-adjusted row (current implementation):
// net = gross - received + sent
// Example: gross 1200, received 600, sent 0 => net 600

// percentOfTotal = ownerGross / totalSpentForSelectedRange (guarded by denominator > 0)
// Example: 500 / 2000 = 0.25 => 25%

// debt progress bar width = clamp(row.progress * 100, 0, 100)
// Example: 0.82 => 82%
```

---

## 7) Transactions + Income Monthly Totals

### Transaction totals (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/pages/transactions/ExpensesByMonthTable.tsx`)

```ts
// monthTotal = sum(row.amount)
// optional rule: if includeOwnerTransfersInTotals == false, transfer rows are excluded
// Example: expenses 500 + 200, transfer 100 => total 700 or 800 depending on toggle
```

### Mobile/desktop month totals

- `/Users/ayazuddin/Development/personal/Web/budget-tool/src/pages/transactions/ExpensesByMonthList.tsx`
- `/Users/ayazuddin/Development/personal/Web/budget-tool/src/pages/income/IncomeTable.tsx`
- `/Users/ayazuddin/Development/personal/Web/budget-tool/src/pages/income/IncomeList.tsx`

```ts
// monthTotal = sum(row.amount for that month)
```

### Sort comparator math (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/pages/transactions/transactionsLedger.ts`)

```ts
// cmp = sortDir === "asc" ? 1 : -1
// return diff * cmp
// Example: amount diff 50 with desc => 50 * -1 = -50
```

---

## 8) Import De-duplication Tolerances

### Generic import dedupe (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/importDedup.ts`)

```ts
// duplicate if same date and abs(amountA - amountB) < 0.01
// plus owner equality check when both owners are present
// Example: 24.99 vs 25.00 => abs 0.01 (NOT duplicate because threshold is strict < 0.01)
```

### Import page income dedupe (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/pages/import/ImportPage.tsx`)

```ts
// duplicate if same date, abs(amount diff) < 0.01, and category matches (case-insensitive)
```

---

## 9) Allocation Defaults in Add Transaction
(`/Users/ayazuddin/Development/personal/Web/budget-tool/src/components/add-transaction-utils.ts`)

```ts
// single mode => 100% to selected owner
// equal mode => each owner percent = 100 / ownerCount
// Example: 3 owners => 33.333...% each (stored as percent values)
```

---

## 10) Date Equations

### Sheets serial date conversion (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/dateRepair.ts`)

```ts
// ms = serial * 86400000 + epoch(1899-12-30)
// Example: serial 46038 => converted to YYYY-MM-DD date
```

### Date text transforms (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/dateInput.ts`)

```ts
// MM/DD/YYYY and YYYY/MM/DD are built by slicing an 8-digit normalized string
// Example: "20260214" + YYYY/MM/DD => "2026/02/14"
```

### Calendar grid math (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/components/ui/date-picker.tsx`)

```ts
// startOffset = weekday index of month first day
// daysInMonth = lastDay.getDate()
// Fill previous-month leading cells + current month + trailing cells until 42 cells total
```

### Month-year picker (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/components/ui/month-year-picker.tsx`)

```ts
// month value = `${year}-${pad(monthIndex + 1)}`
// Example: year 2026, monthIndex 1 => "2026-02"
```

---

## 11) Parsing Math

### CSV amount normalization (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/parsers/amex.ts`, `/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/parsers/apple.ts`)

```ts
// parsedAmount = abs(parseFloat(cleanedCurrencyText)) or 0
// Example: "-$34.20" => 34.20
```

### Deterministic hash IDs (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/parsers/amex.ts`, `/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/parsers/apple.ts`)

```ts
// h = (h << 5) - h + charCode
// h |= 0 to keep 32-bit signed integer
// id = prefix + abs(h).toString(36)
```

### PDF fallback dedupe key (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/pdfExport.ts`)

```ts
// income dedupe key = `${date}-${description}-${amount}`
// Example: "2026-01-31-Paycheck-4178.4"
```

---

## 12) Operational Timing Equations (Non-financial but numeric)

### Sync success visibility delay (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/components/Layout.tsx`)

```ts
// elapsed = Date.now() - syncingStartedAt
// remaining = max(0, MIN_SYNCING_VISIBLE_MS - elapsed)
// success badge is delayed by `remaining` to avoid flicker
```

### OAuth token expiry + sync retry backoff (`/Users/ayazuddin/Development/personal/Web/budget-tool/src/context/GoogleAuthContext.tsx`)

```ts
// tokenExpiresAt = Date.now() + expiresInSeconds * 1000
// Example: now + 3600s => +1 hour

// on rate limit:
// nextSyncAllowedAt = Date.now() + retryBackoffMs
// retryBackoffMs = min(retryBackoffMs * 2, MAX_DELAY)
```

---

## 13) Dummy Data Equations (for dummy mode)
(`/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/dummyData.ts`)

```ts
// Synthetic amount generation:
// expenseAmount = seed.base + ((i + monthIndex * 7) % 9) * 5
// incomeAmount  = seed.base + ((i + monthIndex * 3) % 6) * 75

// Synthetic day generation:
// expenseDay = ((i * 3 + monthIndex * 5) % days) + 1
// incomeDay  = ((i * 2 + monthIndex * 4) % 26) + 1
```

---

## Notes

- Monetary storage remains canonical in USD amounts; display conversion applies at formatting/input edges.
- Some equations are intentionally guarded (`max(0, ...)`, denominator checks) to avoid invalid negative balances or divide-by-zero.
