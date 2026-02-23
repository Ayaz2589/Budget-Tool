import type { ExpenseSource } from "@/lib/types";
import { ALL_EXPENSE_SOURCES } from "@/lib/types";

/**
 * i18n key suffix per expense source. Use with namespaces:
 * - addTransaction.* for AddTransactionDialog and CardSourcesCard
 * - transactions.* for FiltersAndActionsDialog and TransactionsPage
 */
export const EXPENSE_SOURCE_LOCALE_KEYS: Record<ExpenseSource, string> = {
  amex: "sourceAmexPlatinum",
  "amex-gold": "sourceAmexGold",
  apple: "sourceApple",
  visa: "sourceVisa",
  sapphire: "sourceSapphire",
  "bank-of-america": "sourceBankOfAmerica",
  "wells-fargo": "sourceWellsFargo",
  chase: "sourceChase",
  manual: "sourceManual",
  td: "sourceTd",
};

/** English display names for PDF export and presets labels. */
export const EXPENSE_SOURCE_DISPLAY_LABELS: Record<ExpenseSource, string> = {
  amex: "Amex Platinum Card",
  "amex-gold": "Amex Gold Card",
  apple: "Master Card",
  visa: "Visa",
  sapphire: "Sapphire",
  "bank-of-america": "Bank of America",
  "wells-fargo": "Wells Fargo",
  chase: "Chase",
  manual: "Manual",
  td: "TD Bank",
};

/** Short badge labels for compact UI chips. */
export const EXPENSE_SOURCE_BADGE_LABELS: Record<ExpenseSource, string> = {
  amex: "AMEX",
  "amex-gold": "AMEX",
  apple: "MC",
  visa: "VISA",
  sapphire: "SAPPHIRE",
  "bank-of-america": "BOA",
  "wells-fargo": "WF",
  chase: "CHASE",
  manual: "MANUAL",
  td: "TD",
};

/** Full i18n keys for transaction filter dropdown (transactions.* + common.all). */
export const SOURCE_LABEL_KEYS: Record<ExpenseSource | "all", string> = {
  all: "common.all",
  amex: "transactions.sourceAmexPlatinum",
  "amex-gold": "transactions.sourceAmexGold",
  apple: "transactions.sourceApple",
  visa: "transactions.sourceVisa",
  sapphire: "transactions.sourceSapphire",
  "bank-of-america": "transactions.sourceBankOfAmerica",
  "wells-fargo": "transactions.sourceWellsFargo",
  chase: "transactions.sourceChase",
  manual: "transactions.sourceManual",
  td: "transactions.sourceTd",
};

/** Options for Presets page: value + display label. */
export const SOURCE_OPTIONS: { value: ExpenseSource; label: string }[] =
  ALL_EXPENSE_SOURCES.map((value) => ({
    value,
    label: EXPENSE_SOURCE_DISPLAY_LABELS[value],
  }));
