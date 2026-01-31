import type { ExpenseSource } from "@/lib/types";
import { AmexPlatinumCardIcon } from "./AmexPlatinumCardIcon";
import { AmexGoldCardIcon } from "./AmexGoldCardIcon";
import { AppleCardIcon } from "./AppleCardIcon";
import { ChaseCardIcon } from "./ChaseCardIcon";

const SOURCE_ICONS: Record<
  ExpenseSource,
  React.ComponentType<{ className?: string; size?: number }>
> = {
  amex: AmexPlatinumCardIcon,
  "amex-gold": AmexGoldCardIcon,
  chase: ChaseCardIcon,
  apple: AppleCardIcon,
  manual: () => null,
  td: () => null,
};

interface SourceIconProps {
  source: ExpenseSource;
  size?: number;
  className?: string;
}

export function SourceIcon({
  source,
  size = 20,
  className = "",
}: SourceIconProps) {
  const Icon = SOURCE_ICONS[source];
  if (!Icon) return null;
  const Rendered = Icon as React.ComponentType<{
    className?: string;
    size?: number;
  }>;
  const el = <Rendered size={size} className={className} />;
  if (source === "manual" || source === "td") return null;
  return el;
}
