/**
 * Contract: SheetContent component API after modification
 *
 * This defines the prop interface for the modified SheetContent component
 * that supports both sheet (side panel) and modal (centered overlay) variants
 * on desktop viewports.
 */

type SheetSide = "top" | "bottom" | "left" | "right";
type DesktopVariant = "sheet" | "modal";

/**
 * SheetContent props — extends Radix DialogPrimitive.Content props
 *
 * @param side - Which edge the sheet slides from (default: "right")
 * @param desktopVariant - Desktop presentation mode (default: "sheet")
 *   - "sheet": Current behavior — slides in from the specified side
 *   - "modal": Centered overlay with framer-motion fade+scale animation
 *   Mobile (< 768px) always renders as full-screen sheet regardless
 * @param showCloseButton - Whether to show the X close button (default: true)
 */
interface SheetContentProps {
  side?: SheetSide;
  desktopVariant?: DesktopVariant;
  showCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
  onOpenAutoFocus?: (event: Event) => void;
}

/**
 * Behavioral contract:
 *
 * When viewport >= 768px AND desktopVariant === "modal":
 *   - Renders as fixed centered overlay (no slide from edge)
 *   - Uses framer-motion AnimatePresence for open/close animation
 *   - Animation: fade + scale (0.95 → 1.0), 250ms, easeOut
 *   - Backdrop fades in/out in sync
 *   - Max width: max-w-md (448px), max height: 90vh with internal scroll
 *   - Radix focus trapping, Escape key, overlay dismiss all preserved
 *
 * When viewport < 768px (any desktopVariant):
 *   - Existing behavior preserved — full-screen top sheet
 *   - No framer-motion animations (current CSS slide animations)
 *
 * When desktopVariant === "sheet" or undefined (any viewport):
 *   - Existing behavior preserved — side panel with CSS slide animation
 */
export type { SheetContentProps, SheetSide, DesktopVariant };
