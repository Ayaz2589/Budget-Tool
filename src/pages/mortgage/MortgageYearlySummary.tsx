import { formatCurrency } from "@/lib/format";
import type { YearlySummaryRow } from "@/lib/mortgageMath";

interface MortgageYearlySummaryProps {
  rows: YearlySummaryRow[];
}

export function MortgageYearlySummary({ rows }: MortgageYearlySummaryProps) {
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <h2 className="text-base font-semibold">Annual housing cost</h2>
      <div className="space-y-2">
        {rows.slice(-5).map((row) => (
          <div
            key={row.year}
            className="grid grid-cols-2 gap-2 rounded-lg border p-3 text-sm md:grid-cols-4"
          >
            <div>
              <div className="text-muted-foreground">Year</div>
              <div className="font-medium">{row.year}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Recorded payments</div>
              <div className="font-medium">
                {formatCurrency(row.mortgagePaymentsRecorded)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Principal / Interest</div>
              <div className="font-medium">
                {formatCurrency(row.principal)} / {formatCurrency(row.interest)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Total housing cost</div>
              <div className="font-semibold">{formatCurrency(row.totalHousingCost)}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
