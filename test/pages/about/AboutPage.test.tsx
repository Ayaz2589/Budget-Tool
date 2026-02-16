import { afterEach, beforeEach, test, expect } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/context";
import { PresetTransactionsProvider } from "@/context";
import { GoogleAuthProviderFallback } from "@/context";
import { Layout } from "@/components/Layout";
import { AboutPage } from "@/pages/about/AboutPage";
import i18n from "@/i18n";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => cleanup());

function TestWrapper() {
  return (
    <BudgetProvider>
      <PresetTransactionsProvider>
        <GoogleAuthProviderFallback>
          <MemoryRouter initialEntries={["/dashboard/about"]}>
            <Routes>
              <Route path="/dashboard" element={<Layout />}>
                <Route path="about" element={<AboutPage />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </GoogleAuthProviderFallback>
      </PresetTransactionsProvider>
    </BudgetProvider>
  );
}

test("AboutPage renders without crashing", () => {
  render(<TestWrapper />);
  expect(
    screen.getByRole("heading", { name: i18n.t("about.missionTitle") }),
  ).toBeInTheDocument();
});

test("AboutPage shows page title and subtitle", () => {
  render(<TestWrapper />);
  expect(screen.getAllByText(i18n.t("about.title")).length).toBeGreaterThan(0);
  expect(screen.getAllByText(i18n.t("about.subtitle")).length).toBeGreaterThan(0);
});

test("AboutPage shows mission statement content", () => {
  render(<TestWrapper />);
  expect(screen.getByText(i18n.t("about.missionStrong"))).toBeInTheDocument();
  expect(screen.getByText(i18n.t("about.missionBody"))).toBeInTheDocument();
});

test("AboutPage shows commitment list items", () => {
  render(<TestWrapper />);
  expect(screen.getByText(i18n.t("about.committedItem1"))).toBeInTheDocument();
  expect(screen.getByText(i18n.t("about.committedItem2"))).toBeInTheDocument();
  expect(screen.getByText(i18n.t("about.committedItem3"))).toBeInTheDocument();
  expect(screen.getByText(i18n.t("about.committedItem4"))).toBeInTheDocument();
});

test("AboutPage shows data privacy and export sections", () => {
  render(<TestWrapper />);
  expect(screen.getByText(i18n.t("about.noBackendBody"))).toBeInTheDocument();
  expect(screen.getByText(i18n.t("about.exportBody"))).toBeInTheDocument();
});

test("AboutPage shows closing statement", () => {
  render(<TestWrapper />);
  expect(screen.getByText(i18n.t("about.closingStrong"))).toBeInTheDocument();
});

test("AboutPage shows support section with feedback button", () => {
  render(<TestWrapper />);
  expect(screen.getByText(i18n.t("about.supportBody"))).toBeInTheDocument();
  const feedbackButton = screen.getByRole("button", {
    name: new RegExp(i18n.t("feedback.title"), "i"),
  });
  expect(feedbackButton).toBeInTheDocument();
});

test("AboutPage has an accessible mission section landmark", () => {
  render(<TestWrapper />);
  const section = document.querySelector(".ortho-mission");
  expect(section).not.toBeNull();
  expect(section?.getAttribute("aria-labelledby")).toBe("ortho-mission-title");
});
