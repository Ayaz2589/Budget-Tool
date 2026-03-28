export const MORTGAGE_CATEGORY_LABEL = "Home > Rent/Mortgage";

/** Legacy label used before preset categories migration. */
export const MORTGAGE_CATEGORY_LEGACY_LABEL = "Mortgage";

export function isMortgageCategory(category?: string | null): boolean {
  const trimmed = (category ?? "").trim().toLowerCase();
  return trimmed === "mortgage" || trimmed === "home > rent/mortgage";
}
