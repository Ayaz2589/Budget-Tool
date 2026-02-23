import { describe, test, expect } from "bun:test";
import { ALL_EXPENSE_SOURCES } from "@/types/core";
import type { ExpenseSource } from "@/types/core";
import {
  EXPENSE_SOURCE_LOCALE_KEYS,
  EXPENSE_SOURCE_DISPLAY_LABELS,
  EXPENSE_SOURCE_BADGE_LABELS,
  SOURCE_LABEL_KEYS,
  SOURCE_OPTIONS,
} from "@/lib/format/sourceLabels";

// ---------------------------------------------------------------------------
// EXPENSE_SOURCE_LOCALE_KEYS
// ---------------------------------------------------------------------------

describe("EXPENSE_SOURCE_LOCALE_KEYS", () => {
  test("has an entry for every ExpenseSource", () => {
    for (const source of ALL_EXPENSE_SOURCES) {
      expect(EXPENSE_SOURCE_LOCALE_KEYS[source]).toBeDefined();
      expect(typeof EXPENSE_SOURCE_LOCALE_KEYS[source]).toBe("string");
    }
  });

  test("returns expected i18n key suffixes", () => {
    expect(EXPENSE_SOURCE_LOCALE_KEYS.amex).toBe("sourceAmexPlatinum");
    expect(EXPENSE_SOURCE_LOCALE_KEYS["amex-gold"]).toBe("sourceAmexGold");
    expect(EXPENSE_SOURCE_LOCALE_KEYS.apple).toBe("sourceApple");
    expect(EXPENSE_SOURCE_LOCALE_KEYS.visa).toBe("sourceVisa");
    expect(EXPENSE_SOURCE_LOCALE_KEYS.sapphire).toBe("sourceSapphire");
    expect(EXPENSE_SOURCE_LOCALE_KEYS["bank-of-america"]).toBe("sourceBankOfAmerica");
    expect(EXPENSE_SOURCE_LOCALE_KEYS["wells-fargo"]).toBe("sourceWellsFargo");
    expect(EXPENSE_SOURCE_LOCALE_KEYS.chase).toBe("sourceChase");
    expect(EXPENSE_SOURCE_LOCALE_KEYS.manual).toBe("sourceManual");
    expect(EXPENSE_SOURCE_LOCALE_KEYS.td).toBe("sourceTd");
  });
});

// ---------------------------------------------------------------------------
// EXPENSE_SOURCE_DISPLAY_LABELS
// ---------------------------------------------------------------------------

describe("EXPENSE_SOURCE_DISPLAY_LABELS", () => {
  test("has an entry for every ExpenseSource", () => {
    for (const source of ALL_EXPENSE_SOURCES) {
      expect(EXPENSE_SOURCE_DISPLAY_LABELS[source]).toBeDefined();
      expect(typeof EXPENSE_SOURCE_DISPLAY_LABELS[source]).toBe("string");
    }
  });

  test("returns human-readable English labels", () => {
    expect(EXPENSE_SOURCE_DISPLAY_LABELS.amex).toBe("Amex Platinum Card");
    expect(EXPENSE_SOURCE_DISPLAY_LABELS["amex-gold"]).toBe("Amex Gold Card");
    expect(EXPENSE_SOURCE_DISPLAY_LABELS.apple).toBe("Master Card");
    expect(EXPENSE_SOURCE_DISPLAY_LABELS.visa).toBe("Visa");
    expect(EXPENSE_SOURCE_DISPLAY_LABELS.sapphire).toBe("Sapphire");
    expect(EXPENSE_SOURCE_DISPLAY_LABELS["bank-of-america"]).toBe("Bank of America");
    expect(EXPENSE_SOURCE_DISPLAY_LABELS["wells-fargo"]).toBe("Wells Fargo");
    expect(EXPENSE_SOURCE_DISPLAY_LABELS.chase).toBe("Chase");
    expect(EXPENSE_SOURCE_DISPLAY_LABELS.manual).toBe("Manual");
    expect(EXPENSE_SOURCE_DISPLAY_LABELS.td).toBe("TD Bank");
  });
});

// ---------------------------------------------------------------------------
// EXPENSE_SOURCE_BADGE_LABELS
// ---------------------------------------------------------------------------

describe("EXPENSE_SOURCE_BADGE_LABELS", () => {
  test("has an entry for every ExpenseSource", () => {
    for (const source of ALL_EXPENSE_SOURCES) {
      expect(EXPENSE_SOURCE_BADGE_LABELS[source]).toBeDefined();
      expect(typeof EXPENSE_SOURCE_BADGE_LABELS[source]).toBe("string");
    }
  });

  test("returns short uppercase badge strings", () => {
    expect(EXPENSE_SOURCE_BADGE_LABELS.amex).toBe("AMEX");
    expect(EXPENSE_SOURCE_BADGE_LABELS["amex-gold"]).toBe("AMEX");
    expect(EXPENSE_SOURCE_BADGE_LABELS.apple).toBe("MC");
    expect(EXPENSE_SOURCE_BADGE_LABELS.visa).toBe("VISA");
    expect(EXPENSE_SOURCE_BADGE_LABELS.sapphire).toBe("SAPPHIRE");
    expect(EXPENSE_SOURCE_BADGE_LABELS["bank-of-america"]).toBe("BOA");
    expect(EXPENSE_SOURCE_BADGE_LABELS["wells-fargo"]).toBe("WF");
    expect(EXPENSE_SOURCE_BADGE_LABELS.chase).toBe("CHASE");
    expect(EXPENSE_SOURCE_BADGE_LABELS.manual).toBe("MANUAL");
    expect(EXPENSE_SOURCE_BADGE_LABELS.td).toBe("TD");
  });

  test("all badge labels are uppercase", () => {
    for (const source of ALL_EXPENSE_SOURCES) {
      const badge = EXPENSE_SOURCE_BADGE_LABELS[source];
      expect(badge).toBe(badge.toUpperCase());
    }
  });
});

// ---------------------------------------------------------------------------
// SOURCE_LABEL_KEYS
// ---------------------------------------------------------------------------

describe("SOURCE_LABEL_KEYS", () => {
  test("has entries for every ExpenseSource plus 'all'", () => {
    for (const source of ALL_EXPENSE_SOURCES) {
      expect(SOURCE_LABEL_KEYS[source]).toBeDefined();
    }
    expect(SOURCE_LABEL_KEYS.all).toBe("common.all");
  });

  test("all source keys use the transactions namespace", () => {
    for (const source of ALL_EXPENSE_SOURCES) {
      expect(SOURCE_LABEL_KEYS[source]).toMatch(/^transactions\./);
    }
  });
});

// ---------------------------------------------------------------------------
// SOURCE_OPTIONS
// ---------------------------------------------------------------------------

describe("SOURCE_OPTIONS", () => {
  test("has one option per ExpenseSource", () => {
    expect(SOURCE_OPTIONS.length).toBe(ALL_EXPENSE_SOURCES.length);
  });

  test("each option has value and label fields", () => {
    for (const opt of SOURCE_OPTIONS) {
      expect(ALL_EXPENSE_SOURCES).toContain(opt.value);
      expect(typeof opt.label).toBe("string");
      expect(opt.label.length).toBeGreaterThan(0);
    }
  });

  test("option labels match EXPENSE_SOURCE_DISPLAY_LABELS", () => {
    for (const opt of SOURCE_OPTIONS) {
      expect(opt.label).toBe(EXPENSE_SOURCE_DISPLAY_LABELS[opt.value]);
    }
  });
});
