## Plan: Copy Transaction

**What:** Add a "Copy" action to expense and income transaction rows. Clicking it opens the Add dialog pre-filled with the transaction's data but with today's date.

**Why:** Users frequently create similar recurring transactions. Copying saves re-entering all fields manually.

**Acceptance criteria:**
- [x] AC1: Each expense row (desktop table + mobile list) has a copy icon button
- [x] AC2: Clicking copy on an expense opens AddTransactionDialog pre-filled with that expense's data (description, amount, category, source, owner, allocation) but date set to today
- [x] AC3: Each income row (desktop table + mobile list) has a copy icon button
- [x] AC4: Clicking copy on an income opens AddIncomeDialog pre-filled with that income's data (description, amount, category, owner) but date set to today
- [x] AC5: The copied transaction gets a new ID (not a duplicate of the original)
- [x] AC6: All tests pass, build succeeds

**Implementation steps:**

### Expenses
1. Add `onCopy?: (row: TransactionLedgerRow) => void` to `ExpensesByMonthTableProps` and `ExpensesByMonthListProps`
2. Add copy icon button to each row in ExpensesByMonthTable (new column) and ExpensesByMonthList (in trailing area)
3. Add `initialExpense?: Expense` prop to `AddTransactionDialogProps` — when provided, pre-fill the first row from the expense data (similar to existing `initialPresetId` logic) but override date to today
4. Wire up in `TransactionsPage`: manage state for "copy source expense", pass onCopy + initialExpense

### Income
5. Add `onCopy?: (income: Income) => void` to `IncomeTableProps` and `IncomeListProps`
6. Add copy icon button to each row in IncomeTable (new column) and IncomeList (in trailing area)
7. Add `initialIncome?: Income` prop to `AddIncomeDialogProps` — pre-fill form fields, date set to today
8. Wire up in `IncomePage`: manage state for "copy source income", pass onCopy + initialIncome

**Gotchas:**
- Copy button must stopPropagation to avoid triggering onRowTap/onIncomeTap
- AddTransactionDialog already has `initialPresetId` pre-fill logic — `initialExpense` should use the same pattern
- Need to convert expense amount (number) to currency input string format
- Allocation data (allocationMode, allocation array) needs to be mapped to form state (allocationOwners, allocationPercents)
- Owner transfers don't need a copy button (they go through a different flow)
