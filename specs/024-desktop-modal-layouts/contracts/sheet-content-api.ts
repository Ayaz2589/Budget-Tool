/**
 * Contract: SheetContent component API after width tier modification
 *
 * Extends the desktopVariant="modal" feature (023) with size tiers.
 */

type SheetSide = "top" | "bottom" | "left" | "right";
type DesktopVariant = "sheet" | "modal";
type DesktopModalSize = "compact" | "standard" | "wide";

/**
 * SheetContent props — extends Radix DialogPrimitive.Content props
 *
 * @param side - Which edge the sheet slides from (default: "right")
 * @param desktopVariant - Desktop presentation mode (default: "sheet")
 * @param desktopModalSize - Desktop modal width tier (default: "compact")
 *   - "compact": 448px (max-w-md) — action dialogs, display-heavy
 *   - "standard": 576px (max-w-xl) — simple input forms (3–5 fields)
 *   - "wide": 672px (max-w-2xl) — complex forms (6+ fields, multi-column)
 *   Only applies when desktopVariant="modal" and viewport >= 768px
 * @param showCloseButton - Whether to show the X close button (default: true)
 */
interface SheetContentProps {
  side?: SheetSide;
  desktopVariant?: DesktopVariant;
  desktopModalSize?: DesktopModalSize;
  showCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
  onOpenAutoFocus?: (event: Event) => void;
}

/**
 * Width tier mapping:
 *
 *   compact  → max-w-md  (28rem / 448px)
 *   standard → max-w-xl  (36rem / 576px)
 *   wide     → max-w-2xl (42rem / 672px)
 *
 * Modal-to-tier assignments:
 *
 *   COMPACT: ExpenseActionsDialog, TransferActionsDialog,
 *            IncomeActionsDialog, DebtActionsDialog,
 *            MortgagePaymentActionsDialog, Preset Actions
 *
 *   STANDARD: AddIncomeDialog, EditIncomeDialog, AddDebtDialog,
 *             AddMortgagePaymentDialog, EditTransferDialog,
 *             Preset Editor
 *
 *   WIDE: AddTransactionDialog, EditTransactionDialog,
 *         FiltersAndActionsDialog
 */
export type { SheetContentProps, SheetSide, DesktopVariant, DesktopModalSize };
