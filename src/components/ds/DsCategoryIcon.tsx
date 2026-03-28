import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryType } from "@/types/category";
import { findCategory, getCategoryColorClass, getCategoryIcon } from "@/lib/categories/registry";

type DsCategoryIconSize = "sm" | "md" | "lg";

interface DsCategoryIconProps {
  /** Composite key, e.g. "Food > Groceries", or a parent key like "Food" */
  compositeKey: string;
  type?: CategoryType;
  /** sm = 20px, md = 28px, lg = 36px */
  size?: DsCategoryIconSize;
  className?: string;
}

const SIZE_CLASSES: Record<DsCategoryIconSize, string> = {
  sm: "size-5 rounded",
  md: "size-7 rounded-md",
  lg: "size-9 rounded-lg",
};

const ICON_SIZE_CLASSES: Record<DsCategoryIconSize, string> = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
};

export function DsCategoryIcon({
  compositeKey,
  type,
  size = "md",
  className,
}: DsCategoryIconProps) {
  const colorClass = getCategoryColorClass(compositeKey, type);
  const Icon = getCategoryIcon(compositeKey, type) ?? HelpCircle;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        SIZE_CLASSES[size],
        colorClass,
        className,
      )}
    >
      <Icon className={cn("text-white", ICON_SIZE_CLASSES[size])} />
    </div>
  );
}

/**
 * Renders a category icon + label inline. Used in dropdowns, tables, etc.
 * For unknown/empty categories, shows "Uncategorized" with a gray icon.
 */
export function DsCategoryBadge({
  compositeKey,
  type,
  size = "sm",
  className,
  label,
}: DsCategoryIconProps & { label?: string }) {
  const def = findCategory(compositeKey, type);
  const displayLabel =
    label ?? def?.sub.label ?? (compositeKey || "Uncategorized");

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <DsCategoryIcon compositeKey={compositeKey} type={type} size={size} />
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}
