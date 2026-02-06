import { test, expect } from "bun:test";
import { render } from "@testing-library/react";
import { SourceIcon } from "@/components/cards/SourceIcon";

test("SourceIcon renders for card sources", () => {
  const { container } = render(<SourceIcon source="visa" size={18} />);
  expect(container.querySelector("svg")).toBeTruthy();
});

test("SourceIcon returns null for manual source", () => {
  const { container } = render(<SourceIcon source="manual" />);
  expect(container.querySelector("svg")).toBeNull();
});
