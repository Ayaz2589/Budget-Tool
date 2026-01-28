import { cn } from "@/lib/utils";

const EXPENSE_COLORS: Record<string, string> = {
  "My Purchase": "bg-blue-500",
  "Tasnuva's Purchases": "bg-rose-500",
  "50/50": "bg-amber-500",
  Mortgage: "bg-slate-500",
};

const INCOME_COLORS: Record<string, string> = {
  Rent: "bg-emerald-500",
  Paycheck: "bg-sky-500",
  Bonus: "bg-amber-400",
  Other: "bg-gray-400",
};

const DEFAULT_COLOR = "bg-gray-400";

export type CategoryType = "expense" | "income";

export function getCategoryColor(name: string, type?: CategoryType): string {
  if (type === "expense") return EXPENSE_COLORS[name] ?? DEFAULT_COLOR;
  if (type === "income") return INCOME_COLORS[name] ?? DEFAULT_COLOR;
  return EXPENSE_COLORS[name] ?? INCOME_COLORS[name] ?? DEFAULT_COLOR;
}

export function CategoryOption({
  name,
  type,
  className,
}: {
  name: string;
  type?: CategoryType;
  className?: string;
}) {
  const colorClass = getCategoryColor(name, type);
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        className={cn("size-2 shrink-0 rounded-full", colorClass)}
        aria-hidden
      />
      <span>{name}</span>
    </span>
  );
}
