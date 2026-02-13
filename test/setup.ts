import { GlobalRegistrator } from "@happy-dom/global-registrator";
import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "bun:test";
import "../src/i18n";

GlobalRegistrator.register();
expect.extend(matchers);

try {
  localStorage.setItem("budget-tool-app-tour-completed", "1");
} catch {
  // ignore
}
