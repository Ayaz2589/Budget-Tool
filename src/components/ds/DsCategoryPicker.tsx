import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { CheckIcon, ChevronDownIcon, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryType } from "@/types/category";
import {
  getParentCategories,
  findCategory,
  buildCompositeKey,
} from "@/lib/categories/registry";
import { DsCategoryIcon } from "./DsCategoryIcon";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverContent = PopoverPrimitive.Content;

interface DsCategoryPickerProps {
  value: string;
  onValueChange: (compositeKey: string) => void;
  type: CategoryType;
  className?: string;
  disabled?: boolean;
}

export function DsCategoryPicker({
  value,
  onValueChange,
  type,
  className,
  disabled,
}: DsCategoryPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const parents = getParentCategories(type);
  const currentDef = findCategory(value, type);
  const isIncome = type === "income";

  const handleSelect = (compositeKey: string) => {
    onValueChange(compositeKey);
    setOpen(false);
  };

  // Display label for the trigger button
  const displayLabel = currentDef
    ? currentDef.sub.label
    : value
      ? value
      : t("addTransaction.uncategorized", "Uncategorized");

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
          data-placeholder={!value ? "" : undefined}
        >
          <span className="truncate flex items-center gap-2">
            {value && currentDef ? (
              <>
                <DsCategoryIcon
                  compositeKey={value}
                  type={type}
                  size="sm"
                />
                <span>{displayLabel}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{displayLabel}</span>
            )}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 w-[var(--radix-popover-trigger-width)] min-w-[14rem] p-1 max-h-[var(--radix-popover-content-available-height,24rem)] overflow-y-auto overscroll-contain"
        collisionPadding={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Uncategorized option */}
        <button
          type="button"
          className={cn(
            "relative flex w-full cursor-default items-center gap-2 rounded-md py-2 pr-8 pl-2.5 text-sm outline-none select-none hover:bg-[var(--control-hover)]",
            !value && "font-medium",
          )}
          onClick={() => handleSelect("")}
        >
          {!value ? (
            <span className="absolute right-2 flex size-3.5 items-center justify-center">
              <CheckIcon className="size-4" />
            </span>
          ) : null}
          <CircleDashed className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {t("addTransaction.uncategorized", "Uncategorized")}
          </span>
        </button>

        {isIncome
            ? /* Income: flat list of subcategories (no parent header) */
              parents[0]?.subcategories.map((sub) => {
                const compositeKey = buildCompositeKey(
                  parents[0]!.key,
                  sub.key,
                );
                const isSelected = value === compositeKey;
                return (
                  <button
                    key={compositeKey}
                    type="button"
                    className={cn(
                      "relative flex w-full cursor-default items-center gap-2 rounded-md py-2 pr-8 pl-2.5 text-sm outline-none select-none hover:bg-[var(--control-hover)]",
                      isSelected && "font-medium",
                    )}
                    onClick={() => handleSelect(compositeKey)}
                  >
                    {isSelected ? (
                      <span className="absolute right-2 flex size-3.5 items-center justify-center">
                        <CheckIcon className="size-4" />
                      </span>
                    ) : null}
                    <DsCategoryIcon
                      compositeKey={compositeKey}
                      type={type}
                      size="sm"
                    />
                    <span>{sub.label}</span>
                  </button>
                );
              })
            : /* Expense: grouped by parent with section headers */
              parents.map((parent) => {
                const ParentIcon = parent.icon;
                return (
                  <div key={parent.key}>
                    {/* Parent header (non-interactive) */}
                    <div className="flex items-center gap-2 px-2.5 pt-3 pb-1">
                      <div
                        className={cn(
                          "flex shrink-0 items-center justify-center size-5 rounded",
                          parent.color,
                        )}
                      >
                        <ParentIcon className="size-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {parent.label}
                      </span>
                    </div>
                    {/* Subcategories */}
                    {parent.subcategories.map((sub) => {
                      const compositeKey = buildCompositeKey(
                        parent.key,
                        sub.key,
                      );
                      const isSelected = value === compositeKey;
                      return (
                        <button
                          key={compositeKey}
                          type="button"
                          className={cn(
                            "relative flex w-full cursor-default items-center gap-2 rounded-md py-2 pr-8 pl-7 text-sm outline-none select-none hover:bg-[var(--control-hover)]",
                            isSelected && "font-medium",
                          )}
                          onClick={() => handleSelect(compositeKey)}
                        >
                          {isSelected ? (
                            <span className="absolute right-2 flex size-3.5 items-center justify-center">
                              <CheckIcon className="size-4" />
                            </span>
                          ) : null}
                          <DsCategoryIcon
                            compositeKey={compositeKey}
                            type={type}
                            size="sm"
                          />
                          <span>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
      </PopoverContent>
    </Popover>
  );
}
