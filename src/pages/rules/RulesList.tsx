import { Lock } from "lucide-react";
import type { CategoryRule } from "@/lib/categoryRules";
import { CategoryOption } from "@/lib/categoryColors";
import { cn } from "@/lib/utils";

export type RulesListProps = {
  baselineRules: readonly { id: string; pattern: string; category: string }[];
  customRules: CategoryRule[];
  onRuleTap: (rule: CategoryRule) => void;
};

export function RulesList({
  baselineRules,
  customRules,
  onRuleTap,
}: RulesListProps) {
  return (
    <div className="border rounded-md divide-y overflow-hidden">
      {baselineRules.map((r, index) => (
        <div
          key={r.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3 min-h-[52px]",
            index % 2 === 1 ? "bg-muted/30" : undefined,
          )}
        >
          <span className="flex-1 min-w-0 font-mono text-sm text-muted-foreground truncate">
            {r.pattern}
          </span>
          <span className="shrink-0">
            <CategoryOption name={r.category} type="expense" />
          </span>
          <Lock
            className="size-4 text-muted-foreground shrink-0"
            aria-label="Built-in rule (cannot be removed)"
          />
        </div>
      ))}
      {customRules.map((r, index) => (
        <button
          key={r.id}
          type="button"
          className={cn(
            "flex items-center gap-3 w-full text-left px-4 py-3 min-h-[52px] rounded-none",
            "hover:bg-muted/50 active:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            (baselineRules.length + index) % 2 === 1
              ? "bg-muted/30"
              : undefined,
          )}
          onClick={() => onRuleTap(r)}
          aria-label={`Rule: ${r.pattern} → ${r.category}`}
        >
          <span className="flex-1 min-w-0 font-mono text-sm truncate">
            {r.pattern}
          </span>
          <span className="shrink-0">
            <CategoryOption name={r.category} type="expense" />
          </span>
        </button>
      ))}
    </div>
  );
}
