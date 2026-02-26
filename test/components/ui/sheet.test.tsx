import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

// Helper to set desktop viewport (768px+)
function setDesktopViewport() {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 1024,
  });
  window.matchMedia = (query: string) => ({
    matches: !query.includes("max-width: 767px"),
    media: query,
    onchange: null,
    addEventListener: (_: string, cb: () => void) => cb(),
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  });
}

// Helper to set mobile viewport (<768px)
function setMobileViewport() {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 375,
  });
  window.matchMedia = (query: string) => ({
    matches: query.includes("max-width: 767px"),
    media: query,
    onchange: null,
    addEventListener: (_: string, cb: () => void) => cb(),
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  });
}

function renderSheet(props: {
  desktopVariant?: "sheet" | "modal";
  desktopModalSize?: "compact" | "standard" | "wide";
} = {}) {
  return render(
    <Sheet open>
      <SheetContent {...props}>
        <SheetTitle>Test Title</SheetTitle>
        <SheetDescription>Test Description</SheetDescription>
        <p>Sheet body content</p>
      </SheetContent>
    </Sheet>
  );
}

describe("SheetContent", () => {
  afterEach(() => {
    cleanup();
  });

  describe("default behavior (desktopVariant not set)", () => {
    it("renders as side sheet on desktop", () => {
      setDesktopViewport();
      renderSheet();

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      // Default side sheet should have slide-in animation classes
      expect(dialog.className).toMatch(/slide-in-from/);
    });

    it("has role='dialog'", () => {
      setDesktopViewport();
      renderSheet();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe('desktopVariant="modal" on desktop', () => {
    beforeEach(() => {
      setDesktopViewport();
    });

    it("renders with centered modal positioning", () => {
      renderSheet({ desktopVariant: "modal" });

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      // Modal should have centered positioning classes (not slide-in from side)
      expect(dialog.className).toMatch(/max-w-lg/);
      expect(dialog.className).not.toMatch(/slide-in-from-right/);
    });

    it("has role='dialog'", () => {
      renderSheet({ desktopVariant: "modal" });

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("renders close button", () => {
      renderSheet({ desktopVariant: "modal" });

      const closeButton = screen.getByLabelText("Close");
      expect(closeButton).toBeInTheDocument();
    });

    it("renders children content", () => {
      renderSheet({ desktopVariant: "modal" });

      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Sheet body content")).toBeInTheDocument();
    });
  });

  describe("desktopModalSize on desktop", () => {
    beforeEach(() => {
      setDesktopViewport();
    });

    it("defaults to compact (max-w-lg) when desktopVariant='modal'", () => {
      renderSheet({ desktopVariant: "modal" });

      const dialog = screen.getByRole("dialog");
      expect(dialog.className).toMatch(/max-w-lg/);
    });

    it("renders standard size (max-w-2xl) when desktopModalSize='standard'", () => {
      renderSheet({ desktopVariant: "modal", desktopModalSize: "standard" });

      const dialog = screen.getByRole("dialog");
      expect(dialog.className).toMatch(/max-w-2xl/);
      expect(dialog.className).not.toMatch(/max-w-lg/);
    });

    it("renders wide size (max-w-4xl) when desktopModalSize='wide'", () => {
      renderSheet({ desktopVariant: "modal", desktopModalSize: "wide" });

      const dialog = screen.getByRole("dialog");
      expect(dialog.className).toMatch(/max-w-4xl/);
      expect(dialog.className).not.toMatch(/max-w-lg/);
    });

    it("ignores desktopModalSize when desktopVariant is 'sheet'", () => {
      renderSheet({ desktopVariant: "sheet", desktopModalSize: "wide" });

      const dialog = screen.getByRole("dialog");
      // Sheet mode should not have modal width classes
      expect(dialog.className).not.toMatch(/max-w-4xl/);
      expect(dialog.className).toMatch(/slide-in-from/);
    });
  });

  describe("desktopModalSize on mobile", () => {
    beforeEach(() => {
      setMobileViewport();
    });

    it("ignores desktopModalSize on mobile viewport", () => {
      renderSheet({ desktopVariant: "modal", desktopModalSize: "wide" });

      const dialog = screen.getByRole("dialog");
      // On mobile, no modal width classes
      expect(dialog.className).not.toMatch(/max-w-4xl/);
      expect(dialog.className).not.toMatch(/max-w-2xl/);
    });
  });

  describe('desktopVariant="modal" on mobile', () => {
    beforeEach(() => {
      setMobileViewport();
    });

    it("renders as full-screen sheet regardless of desktopVariant", () => {
      renderSheet({ desktopVariant: "modal" });

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      // On mobile, should NOT have modal positioning — should have mobile sheet classes
      expect(dialog.className).not.toMatch(/max-w-lg/);
    });
  });
});
