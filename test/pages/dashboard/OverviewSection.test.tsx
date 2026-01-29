import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Accordion } from "@/components/ui/accordion";
import { OverviewSection } from "@/pages/dashboard/OverviewSection";
import type { ChartConfig } from "@/components/ui/chart";

const mockT = (key: string) => key;
const emptyConfig: ChartConfig = {};

test("OverviewSection shows Overview accordion trigger", () => {
  render(
    <Accordion type="single" collapsible>
      <OverviewSection
        summaryBarData={[]}
        summaryBarConfig={emptyConfig}
        spendingPieData={[]}
        incomeStackedBarData={[]}
        incomeStackedBarConfig={emptyConfig}
        incomeCategoryKeys={[]}
        t={mockT}
      />
    </Accordion>,
  );
  expect(screen.getByText("dashboard.overview")).toBeInTheDocument();
});
