import { cn } from "@/lib/utils";
import type { CategoryType } from "@/types/category";

const EXPENSE_COLORS: Record<string, string> = {
  Groceries: "bg-green-500",
  Dining: "bg-rose-500",
  Transport: "bg-amber-500",
  Mortgage: "bg-slate-500",
  Shopping: "bg-blue-500",
  Amazon: "bg-orange-500",
};

const INCOME_COLORS: Record<string, string> = {
  Rent: "bg-emerald-500",
  Paycheck: "bg-sky-500",
  Bonus: "bg-amber-400",
  Other: "bg-gray-400",
};

/**
 * Palette of distinct colors for categories that aren't in the hardcoded maps.
 * Uses Tailwind classes so Tailwind's content scanner picks them up.
 */
const COLOR_PALETTE = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
] as const;

/** Simple string hash → deterministic palette index. */
function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length]!;
}

export type { CategoryType } from "@/types/category";

export function getCategoryColor(name: string, type?: CategoryType): string {
  if (type === "expense") return EXPENSE_COLORS[name] ?? hashColor(name);
  if (type === "income") return INCOME_COLORS[name] ?? hashColor(name);
  return EXPENSE_COLORS[name] ?? INCOME_COLORS[name] ?? hashColor(name);
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
