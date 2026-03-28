import type { LucideIcon } from "lucide-react";
import {
  // Parent icons
  Home,
  Heart,
  Utensils,
  Tv,
  Car,
  ShoppingBag,
  Landmark,
  Plane,
  PawPrint,
  GraduationCap,
  Wallet,
  // Home subcategory icons
  Building,
  Zap,
  Shield,
  Wrench,
  // Health subcategory icons
  Stethoscope,
  Eye,
  Pill,
  Dumbbell,
  // Food subcategory icons
  ShoppingCart,
  UtensilsCrossed,
  Coffee,
  // Entertainment subcategory icons
  MonitorPlay,
  Ticket,
  Palette,
  // Transport subcategory icons
  Fuel,
  Bus,
  CarFront,
  Navigation,
  // Shopping subcategory icons
  Shirt,
  Smartphone,
  Gift,
  Sparkles,
  // Finance subcategory icons
  PiggyBank,
  CreditCard,
  Receipt,
  // Travel subcategory icons
  PlaneTakeoff,
  BedDouble,
  CarTaxiFront,
  // Pets subcategory icons
  Bone,
  Syringe,
  // Education subcategory icons
  BookOpen,
  FileText,
  // Income subcategory icons
  Briefcase,
  Pen,
  Building2,
  TrendingUp,
  PartyPopper,
  RotateCcw,
} from "lucide-react";

import type { CategoryType } from "@/types/category";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubCategory {
  /** Unique key used in composite keys, e.g. "Groceries" */
  key: string;
  /** Human-readable label */
  label: string;
  /** Lucide icon component for this subcategory */
  icon: LucideIcon;
}

export interface ParentCategory {
  /** Unique key, e.g. "Food" */
  key: string;
  /** Human-readable label */
  label: string;
  /** Lucide icon for parent-level display */
  icon: LucideIcon;
  /** Tailwind bg class, e.g. "bg-green-500" */
  color: string;
  /** Subcategories under this parent */
  subcategories: SubCategory[];
}

export interface CategoryDefinition {
  parentKey: string;
  subKey: string;
  compositeKey: string;
  parent: ParentCategory;
  sub: SubCategory;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const COMPOSITE_KEY_SEPARATOR = " > ";

// ---------------------------------------------------------------------------
// Expense categories
// ---------------------------------------------------------------------------

export const EXPENSE_CATEGORIES: ParentCategory[] = [
  {
    key: "Home",
    label: "Home",
    icon: Home,
    color: "bg-red-500",
    subcategories: [
      { key: "Rent/Mortgage", label: "Rent/Mortgage", icon: Building },
      { key: "Utilities", label: "Utilities", icon: Zap },
      { key: "Insurance", label: "Insurance", icon: Shield },
      { key: "Maintenance", label: "Maintenance", icon: Wrench },
    ],
  },
  {
    key: "Health",
    label: "Health",
    icon: Heart,
    color: "bg-rose-500",
    subcategories: [
      { key: "Medical", label: "Medical", icon: Stethoscope },
      { key: "Dental & Vision", label: "Dental & Vision", icon: Eye },
      { key: "Pharmacy", label: "Pharmacy", icon: Pill },
      { key: "Fitness", label: "Fitness", icon: Dumbbell },
    ],
  },
  {
    key: "Food",
    label: "Food",
    icon: Utensils,
    color: "bg-green-500",
    subcategories: [
      { key: "Groceries", label: "Groceries", icon: ShoppingCart },
      { key: "Dining Out", label: "Dining Out", icon: UtensilsCrossed },
      { key: "Coffee & Drinks", label: "Coffee & Drinks", icon: Coffee },
    ],
  },
  {
    key: "Entertainment",
    label: "Entertainment",
    icon: Tv,
    color: "bg-purple-500",
    subcategories: [
      { key: "Subscriptions", label: "Subscriptions", icon: MonitorPlay },
      { key: "Events & Tickets", label: "Events & Tickets", icon: Ticket },
      { key: "Hobbies", label: "Hobbies", icon: Palette },
    ],
  },
  {
    key: "Transport",
    label: "Transport",
    icon: Car,
    color: "bg-amber-500",
    subcategories: [
      { key: "Gas/Fuel", label: "Gas/Fuel", icon: Fuel },
      { key: "Public Transit", label: "Public Transit", icon: Bus },
      {
        key: "Car Insurance & Maintenance",
        label: "Car Insurance & Maintenance",
        icon: CarFront,
      },
      { key: "Rideshare", label: "Rideshare", icon: Navigation },
    ],
  },
  {
    key: "Shopping",
    label: "Shopping",
    icon: ShoppingBag,
    color: "bg-blue-500",
    subcategories: [
      { key: "Clothing", label: "Clothing", icon: Shirt },
      { key: "Electronics", label: "Electronics", icon: Smartphone },
      { key: "Gifts", label: "Gifts", icon: Gift },
      { key: "Personal Care", label: "Personal Care", icon: Sparkles },
    ],
  },
  {
    key: "Finance",
    label: "Finance",
    icon: Landmark,
    color: "bg-emerald-500",
    subcategories: [
      { key: "Savings", label: "Savings", icon: PiggyBank },
      { key: "Debt Payments", label: "Debt Payments", icon: CreditCard },
      { key: "Taxes", label: "Taxes", icon: Receipt },
    ],
  },
  {
    key: "Travel",
    label: "Travel",
    icon: Plane,
    color: "bg-sky-500",
    subcategories: [
      { key: "Flights", label: "Flights", icon: PlaneTakeoff },
      { key: "Lodging", label: "Lodging", icon: BedDouble },
      { key: "Car Rental", label: "Car Rental", icon: CarTaxiFront },
    ],
  },
  {
    key: "Pets",
    label: "Pets",
    icon: PawPrint,
    color: "bg-orange-500",
    subcategories: [
      { key: "Food & Supplies", label: "Food & Supplies", icon: Bone },
      { key: "Vet", label: "Vet", icon: Syringe },
    ],
  },
  {
    key: "Education",
    label: "Education",
    icon: GraduationCap,
    color: "bg-indigo-500",
    subcategories: [
      { key: "Tuition/Courses", label: "Tuition/Courses", icon: BookOpen },
      { key: "Student Loans", label: "Student Loans", icon: FileText },
    ],
  },
];

// ---------------------------------------------------------------------------
// Income categories
// ---------------------------------------------------------------------------

export const INCOME_CATEGORIES: ParentCategory[] = [
  {
    key: "Income",
    label: "Income",
    icon: Wallet,
    color: "bg-teal-500",
    subcategories: [
      { key: "Salary", label: "Salary", icon: Briefcase },
      { key: "Freelance", label: "Freelance", icon: Pen },
      { key: "Rental Income", label: "Rental Income", icon: Building2 },
      { key: "Investments", label: "Investments", icon: TrendingUp },
      { key: "Bonus", label: "Bonus", icon: PartyPopper },
      { key: "Refunds", label: "Refunds", icon: RotateCcw },
    ],
  },
];

// ---------------------------------------------------------------------------
// Derived flat lists
// ---------------------------------------------------------------------------

function buildDefinitions(parents: ParentCategory[]): CategoryDefinition[] {
  const defs: CategoryDefinition[] = [];
  for (const parent of parents) {
    for (const sub of parent.subcategories) {
      defs.push({
        parentKey: parent.key,
        subKey: sub.key,
        compositeKey: `${parent.key}${COMPOSITE_KEY_SEPARATOR}${sub.key}`,
        parent,
        sub,
      });
    }
  }
  return defs;
}

/** Flat list of all expense subcategories with parent info. */
export const ALL_EXPENSE_SUBCATEGORIES: CategoryDefinition[] =
  buildDefinitions(EXPENSE_CATEGORIES);

/** Flat list of all income subcategories with parent info. */
export const ALL_INCOME_SUBCATEGORIES: CategoryDefinition[] =
  buildDefinitions(INCOME_CATEGORIES);

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Build a composite key from parent + sub keys: `"Food > Groceries"` */
export function buildCompositeKey(parentKey: string, subKey: string): string {
  return `${parentKey}${COMPOSITE_KEY_SEPARATOR}${subKey}`;
}

/** Parse a composite key back into parent + sub keys. Returns null if not composite. */
export function parseCompositeKey(
  compositeKey: string,
): { parentKey: string; subKey: string } | null {
  const idx = compositeKey.indexOf(COMPOSITE_KEY_SEPARATOR);
  if (idx === -1) return null;
  return {
    parentKey: compositeKey.slice(0, idx),
    subKey: compositeKey.slice(idx + COMPOSITE_KEY_SEPARATOR.length),
  };
}

/** Find a full category definition by composite key. */
export function findCategory(
  compositeKey: string,
  type?: CategoryType,
): CategoryDefinition | undefined {
  if (type === "income") {
    return ALL_INCOME_SUBCATEGORIES.find(
      (d) => d.compositeKey === compositeKey,
    );
  }
  if (type === "expense") {
    return ALL_EXPENSE_SUBCATEGORIES.find(
      (d) => d.compositeKey === compositeKey,
    );
  }
  return (
    ALL_EXPENSE_SUBCATEGORIES.find((d) => d.compositeKey === compositeKey) ??
    ALL_INCOME_SUBCATEGORIES.find((d) => d.compositeKey === compositeKey)
  );
}

/** Get the parent category from a composite key. */
export function getParentFromComposite(
  compositeKey: string,
  type?: CategoryType,
): ParentCategory | undefined {
  const parsed = parseCompositeKey(compositeKey);
  if (!parsed) return undefined;
  const parents =
    type === "income"
      ? INCOME_CATEGORIES
      : type === "expense"
        ? EXPENSE_CATEGORIES
        : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  return parents.find((p) => p.key === parsed.parentKey);
}

/** Get parent categories for a given type. */
export function getParentCategories(type: CategoryType): ParentCategory[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

/** Get subcategories for a given parent key and type. */
export function getSubcategories(
  parentKey: string,
  type: CategoryType,
): SubCategory[] {
  const parents = getParentCategories(type);
  return parents.find((p) => p.key === parentKey)?.subcategories ?? [];
}

/** Get the icon for a composite key. Returns the sub icon, or parent icon if only parent matches. */
export function getCategoryIcon(
  compositeKey: string,
  type?: CategoryType,
): LucideIcon | undefined {
  const def = findCategory(compositeKey, type);
  if (def) return def.sub.icon;
  // Try matching as a parent key
  const parents =
    type === "income"
      ? INCOME_CATEGORIES
      : type === "expense"
        ? EXPENSE_CATEGORIES
        : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  const parent = parents.find((p) => p.key === compositeKey);
  return parent?.icon;
}

/** Get the Tailwind bg color class for a composite key. */
export function getCategoryColorClass(
  compositeKey: string,
  type?: CategoryType,
): string {
  const def = findCategory(compositeKey, type);
  if (def) return def.parent.color;
  const parent = getParentFromComposite(compositeKey, type);
  if (parent) return parent.color;
  // Try as a parent key directly
  const parents =
    type === "income"
      ? INCOME_CATEGORIES
      : type === "expense"
        ? EXPENSE_CATEGORIES
        : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  const directParent = parents.find((p) => p.key === compositeKey);
  if (directParent) return directParent.color;
  return "bg-gray-400";
}

/** All composite keys for a given type (for backward compat with string[] consumers). */
export function getAllCompositeKeys(type: CategoryType): string[] {
  const defs =
    type === "income" ? ALL_INCOME_SUBCATEGORIES : ALL_EXPENSE_SUBCATEGORIES;
  return defs.map((d) => d.compositeKey);
}

/**
 * Find a parent category that contains a subcategory matching the given key
 * (case-insensitive). Useful for migration from flat category strings.
 */
export function findParentBySubKey(
  subKey: string,
  type?: CategoryType,
): { parent: ParentCategory; sub: SubCategory } | undefined {
  const lower = subKey.toLowerCase();
  const parents =
    type === "income"
      ? INCOME_CATEGORIES
      : type === "expense"
        ? EXPENSE_CATEGORIES
        : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  for (const parent of parents) {
    const sub = parent.subcategories.find(
      (s) => s.key.toLowerCase() === lower,
    );
    if (sub) return { parent, sub };
  }
  return undefined;
}
