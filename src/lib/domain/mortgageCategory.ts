export const MORTGAGE_CATEGORY_LABEL = "Mortgage";

export function isMortgageCategory(category?: string | null): boolean {
  return (category ?? "").trim().toLowerCase() === "mortgage";
}
