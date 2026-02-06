import type { ExpenseSource } from "@/types/core";
import type { SourceIconProps } from "@/types/cards";
import { AmexPlatinumCardIcon } from "./AmexPlatinumCardIcon";
import { AmexGoldCardIcon } from "./AmexGoldCardIcon";
import { MasterCardIcon } from "./MasterCardIcon";
import { ChaseCardIcon } from "./ChaseCardIcon";
import { TdBankCardIcon } from "./TdBankCardIcon";
import { VisaCardIcon } from "./VisaCardIcon";
import { SapphireCardIcon } from "./SapphireCardIcon";
import { BankOfAmericaCardIcon } from "./BankOfAmericaCardIcon";
import { WellsFargoCardIcon } from "./WellsFargoCardIcon";

const SOURCE_ICONS: Record<
  ExpenseSource,
  React.ComponentType<{ className?: string; size?: number }>
> = {
  amex: AmexPlatinumCardIcon,
  "amex-gold": AmexGoldCardIcon,
  apple: MasterCardIcon,
  visa: VisaCardIcon,
  sapphire: SapphireCardIcon,
  "bank-of-america": BankOfAmericaCardIcon,
  "wells-fargo": WellsFargoCardIcon,
  chase: ChaseCardIcon,
  manual: () => null,
  td: TdBankCardIcon,
};

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
  if (source === "manual") return null;
  return el;
}
