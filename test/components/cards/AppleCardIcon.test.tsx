import { test, expect } from "bun:test";
import { render } from "@testing-library/react";
import { AppleCardIcon } from "@/components/cards/AppleCardIcon";

test("AppleCardIcon renders svg with expected dimensions", () => {
  const { container } = render(<AppleCardIcon size={40} />);
  const svg = container.querySelector("svg");
  expect(svg).toBeTruthy();
  expect(svg?.getAttribute("width")).toBe("40");
  expect(svg?.getAttribute("height")).toBe("40");
});
