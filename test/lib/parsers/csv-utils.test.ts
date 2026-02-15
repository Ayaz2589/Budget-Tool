import { test, expect, describe } from "bun:test";
import {
  parseCsvLine,
  parseAmount,
  parseDate,
  hashId,
  stripBom,
  STRIP_BOM,
} from "@/lib/parsers/csv-utils";

describe("parseCsvLine", () => {
  test("splits simple comma-separated values", () => {
    expect(parseCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  test("handles quoted fields with commas", () => {
    expect(parseCsvLine('a,"b,c",d')).toEqual(["a", "b,c", "d"]);
  });

  test("handles empty fields", () => {
    expect(parseCsvLine(",a,,b,")).toEqual(["", "a", "", "b", ""]);
  });

  test("handles single value", () => {
    expect(parseCsvLine("hello")).toEqual(["hello"]);
  });

  test("handles empty string", () => {
    expect(parseCsvLine("")).toEqual([""]);
  });

  test("handles quoted field at start and end", () => {
    expect(parseCsvLine('"hello",world,"foo"')).toEqual([
      "hello",
      "world",
      "foo",
    ]);
  });
});

describe("parseAmount", () => {
  test("parses plain number", () => {
    expect(parseAmount("5.25")).toBe(5.25);
  });

  test("strips dollar sign", () => {
    expect(parseAmount("$10.00")).toBe(10);
  });

  test("strips commas and dollar sign", () => {
    expect(parseAmount("$1,234.56")).toBe(1234.56);
  });

  test("returns absolute value for negative amounts", () => {
    expect(parseAmount("-15.99")).toBe(15.99);
  });

  test("returns 0 for non-numeric input", () => {
    expect(parseAmount("abc")).toBe(0);
  });

  test("handles whitespace", () => {
    expect(parseAmount("  $5.00  ")).toBe(5);
  });

  test("returns 0 for empty string", () => {
    expect(parseAmount("")).toBe(0);
  });
});

describe("parseDate", () => {
  test("converts MM/DD/YYYY to YYYY-MM-DD", () => {
    expect(parseDate("01/15/2025")).toBe("2025-01-15");
  });

  test("converts MM/DD/YY to YYYY-MM-DD", () => {
    expect(parseDate("1/5/25")).toBe("2025-01-05");
  });

  test("pads single-digit month and day", () => {
    expect(parseDate("2/3/2025")).toBe("2025-02-03");
  });

  test("returns original string for non-date input", () => {
    expect(parseDate("not-a-date")).toBe("not-a-date");
  });

  test("returns original string for partial date", () => {
    expect(parseDate("01/15")).toBe("01/15");
  });

  test("handles trimming whitespace", () => {
    expect(parseDate("  12/25/2025  ")).toBe("2025-12-25");
  });
});

describe("hashId", () => {
  test("generates a deterministic hash with prefix", () => {
    const id1 = hashId("amex", "2025-01-15", "Coffee", "5", "Ayaz");
    const id2 = hashId("amex", "2025-01-15", "Coffee", "5", "Ayaz");
    expect(id1).toBe(id2);
  });

  test("different prefix produces different id", () => {
    const amexId = hashId("amex", "2025-01-15", "Coffee", "5", "Ayaz");
    const appleId = hashId("apple", "2025-01-15", "Coffee", "5", "Ayaz");
    expect(amexId).not.toBe(appleId);
    expect(amexId.startsWith("amex-")).toBe(true);
    expect(appleId.startsWith("apple-")).toBe(true);
  });

  test("different data produces different hash", () => {
    const id1 = hashId("amex", "2025-01-15", "Coffee", "5", "Ayaz");
    const id2 = hashId("amex", "2025-01-16", "Coffee", "5", "Ayaz");
    expect(id1).not.toBe(id2);
  });

  test("prefix is included in the output", () => {
    const id = hashId("test", "a", "b");
    expect(id.startsWith("test-")).toBe(true);
  });
});

describe("stripBom / STRIP_BOM", () => {
  test("strips BOM from start of string", () => {
    expect(stripBom("\uFEFFhello")).toBe("hello");
  });

  test("returns string unchanged when no BOM present", () => {
    expect(stripBom("hello")).toBe("hello");
  });

  test("only strips BOM at the start", () => {
    expect(stripBom("hello\uFEFF")).toBe("hello\uFEFF");
  });

  test("handles empty string", () => {
    expect(stripBom("")).toBe("");
  });

  test("STRIP_BOM regex matches BOM at start", () => {
    expect(STRIP_BOM.test("\uFEFFdata")).toBe(true);
    expect(STRIP_BOM.test("data")).toBe(false);
  });
});
