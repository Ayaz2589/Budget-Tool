import { test, expect } from "bun:test";
import { cn } from "@/lib/utils";

test("cn merges class names", () => {
  expect(cn("a", "b")).toBe("a b");
});

test("cn merges tailwind classes correctly", () => {
  expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
});

test("cn handles undefined and false", () => {
  expect(cn("a", undefined, false, "b")).toBe("a b");
});
