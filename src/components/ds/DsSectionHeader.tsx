import type * as React from "react";
import { useRef } from "react";
import { useBudget } from "@/context";
import {
  CURRENCY_META,
  DISPLAY_CURRENCIES,
  type DisplayCurrency,
} from "@/types/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DsSectionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  showCurrencyChip?: boolean;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export function DsSectionHeader({
  title,
  subtitle,
  actions,
  showCurrencyChip = false,
  className,
  titleClassName,
  subtitleClassName,
}: DsSectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-2 md:gap-3",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className={cn("text-xl md:text-2xl font-semibold ds-heading-2", titleClassName)}>
          {title}
        </h1>
        {subtitle ? (
          <p className={cn("text-xs md:text-sm text-muted-foreground ds-body-sm", subtitleClassName)}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {showCurrencyChip || actions ? (
        <div className="shrink-0 flex items-center gap-2">
          {showCurrencyChip ? <DsHeaderCurrencyChip /> : null}
          {actions ? <div>{actions}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function DsHeaderCurrencyChip() {
  const { uiFormatSettings, setUiFormatSettings, isCurrencyUpdating } = useBudget();
  const currencyMeta = CURRENCY_META[uiFormatSettings.currency];
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  return (
    <Select
      value={uiFormatSettings.currency}
      onOpenChange={(open) => {
        if (!open) {
          requestAnimationFrame(() => {
            triggerRef.current?.blur();
          });
        }
      }}
      onValueChange={(currency) =>
        setUiFormatSettings({
          ...uiFormatSettings,
          currency: currency as DisplayCurrency,
        })
      }
    >
      <SelectTrigger
        ref={triggerRef}
        disabled={isCurrencyUpdating}
        className="h-8 w-auto min-w-0 rounded-full border-border/70 bg-[var(--control-surface)] px-3 text-xs font-medium tracking-wide text-muted-foreground data-[size=default]:h-8"
      >
        <SelectValue>
          {isCurrencyUpdating
            ? "Updating..."
            : `${currencyMeta.flag} ${currencyMeta.code}`}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {DISPLAY_CURRENCIES.map((code) => {
          const meta = CURRENCY_META[code];
          return (
            <SelectItem key={code} value={code}>
              <span className="flex items-center gap-2">
                <span>{meta.flag}</span>
                <span className="flex flex-col">
                  <span className="text-sm leading-tight">{meta.name}</span>
                  <span className="text-[11px] text-muted-foreground leading-tight">{meta.symbol} · {meta.code}</span>
                </span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
