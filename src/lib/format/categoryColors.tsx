import { cn } from "@/lib/utils";
import type { CategoryType } from "@/types/category";
import {
  getCategoryColorClass,
  findCategory,
  parseCompositeKey,
} from "@/lib/categories/registry";
import { DsCategoryIcon } from "@/components/ds/DsCategoryIcon";

export type { CategoryType } from "@/types/category";

/**
 * Get the Tailwind bg color class for a category.
 * Supports both composite keys ("Food > Groceries") and legacy flat keys ("Groceries").
 */
export function getCategoryColor(name: string, type?: CategoryType): string {
  return getCategoryColorClass(name, type);
}

/**
 * Renders a category with its colored icon and label.
 * Supports both composite keys ("Food > Groceries") and flat keys.
 */
export function CategoryOption({
  name,
  type,
  className,
}: {
  name: string;
  type?: CategoryType;
  className?: string;
}) {
  const def = findCategory(name, type);
  const parsed = parseCompositeKey(name);
  const displayLabel = def?.sub.label ?? parsed?.subKey ?? name;

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <DsCategoryIcon compositeKey={name} type={type} size="sm" />
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}
