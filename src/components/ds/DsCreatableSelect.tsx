import { type ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckIcon, ChevronDownIcon, PlusIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DsCreatableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  onCreateNew: (name: string) => void;
  placeholder?: string;
  /** Label shown for the "none" option (e.g., "Uncategorized"). */
  noneLabel?: string;
  /** Value that represents "none" (e.g., "_" or "_none"). */
  noneValue?: string;
  /** Label for the create input placeholder. */
  createLabel?: string;
  /** Custom renderer for each option. Receives the option string. */
  renderOption?: (name: string) => ReactNode;
  className?: string;
  disabled?: boolean;
}

export function DsCreatableSelect({
  value,
  onValueChange,
  options,
  onCreateNew,
  placeholder,
  noneLabel,
  noneValue,
  createLabel,
  renderOption,
  className,
  disabled,
}: DsCreatableSelectProps) {
  const { t } = useTranslation();
  const resolvedCreateLabel = createLabel ?? t("common.createNew");
  const [open, setOpen] = useState(false);
  const [newValue, setNewValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue =
    value === noneValue
      ? noneLabel ?? placeholder ?? ""
      : options.includes(value)
        ? value
        : placeholder ?? "";

  const handleSelect = (v: string) => {
    onValueChange(v);
    setOpen(false);
  };

  const handleCreate = () => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    if (!options.includes(trimmed)) {
      onCreateNew(trimmed);
    }
    onValueChange(trimmed);
    setNewValue("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "data-[placeholder]:text-muted-foreground text-[var(--text-primary)] [&_svg:not([class*='text-'])]:text-muted-foreground flex w-full items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--control-border)] bg-[var(--field-surface)] px-3 h-11 min-h-[44px] text-sm whitespace-nowrap shadow-[var(--field-shadow)] transition-[background-color,border-color,box-shadow,color] outline-none hover:bg-[var(--control-hover)] hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          data-placeholder={!value || value === noneValue ? "" : undefined}
        >
          <span className="truncate flex items-center gap-2">
            {renderOption && value && value !== noneValue
              ? renderOption(value)
              : displayValue}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[8rem] p-0 flex flex-col max-h-[var(--radix-popover-content-available-height)]"
        collisionPadding={8}
        onOpenAutoFocus={(e) => {
          // Don't steal focus from items when opening
          e.preventDefault();
        }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
          {noneLabel && noneValue ? (
            <button
              type="button"
              className={cn(
                "relative flex w-full cursor-default items-center gap-2 rounded-md py-2 pr-8 pl-2.5 text-sm outline-none select-none hover:bg-[var(--control-hover)]",
                value === noneValue && "font-medium",
              )}
              onClick={() => handleSelect(noneValue)}
            >
              {value === noneValue ? (
                <span className="absolute right-2 flex size-3.5 items-center justify-center">
                  <CheckIcon className="size-4" />
                </span>
              ) : null}
              <span className="text-muted-foreground">
                {renderOption ? renderOption(noneLabel) : noneLabel}
              </span>
            </button>
          ) : null}
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={cn(
                "relative flex w-full cursor-default items-center gap-2 rounded-md py-2 pr-8 pl-2.5 text-sm outline-none select-none hover:bg-[var(--control-hover)]",
                value === opt && "font-medium",
              )}
              onClick={() => handleSelect(opt)}
            >
              {value === opt ? (
                <span className="absolute right-2 flex size-3.5 items-center justify-center">
                  <CheckIcon className="size-4" />
                </span>
              ) : null}
              {renderOption ? renderOption(opt) : opt}
            </button>
          ))}
        </div>
        <div className="shrink-0 border-t border-border p-2">
          <form
            className="flex items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={resolvedCreateLabel}
              className="flex-1 min-w-0 rounded-md border border-[var(--control-border)] bg-[var(--field-surface)] px-2 py-1.5 text-sm outline-none focus-visible:border-[var(--focus-ring)] focus-visible:ring-[var(--focus-ring)]/45 focus-visible:ring-[3px]"
            />
            <button
              type="submit"
              disabled={!newValue.trim()}
              className="shrink-0 inline-flex items-center justify-center rounded-md bg-primary px-2 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
            >
              <PlusIcon className="size-3.5" />
            </button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
