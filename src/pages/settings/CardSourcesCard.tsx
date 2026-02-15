import { useTranslation } from "react-i18next";
import type { ExpenseSource } from "@/lib/types";
import { ALL_EXPENSE_SOURCES } from "@/lib/types";
import { EXPENSE_SOURCE_LOCALE_KEYS } from "@/lib/sourceLabels";
import { EXPENSE_SOURCE_BADGE_LABELS } from "@/lib/sourceLabels";
import { useBudget } from "@/context";
import { usePresetTransactions } from "@/context";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DsSectionHeader } from "@/components/ds";

export function CardSourcesCard({ bare = false }: { bare?: boolean } = {}) {
  const { t } = useTranslation();
  const { cardSources, setCardSources } = useBudget();
  const { presetTransactions, setPresets } = usePresetTransactions();

  const handleToggle = (id: ExpenseSource, checked: boolean) => {
    if (checked) {
      const next = ALL_EXPENSE_SOURCES.filter(
        (s) => s === id || cardSources.includes(s),
      );
      setCardSources(next);
    } else {
      const next = cardSources.filter((s) => s !== id);
      if (next.length === 0) return;
      const fallback = next[0] as ExpenseSource;
      setCardSources(next);
      setPresets(
        presetTransactions.map((p) =>
          p.source === id ? { ...p, source: fallback } : p,
        ),
      );
    }
  };

  const onlyOneEnabled = cardSources.length <= 1;

  const content = (
    <>
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {ALL_EXPENSE_SOURCES.map((sourceId) => {
          const enabled = cardSources.includes(sourceId);
          const isLast = cardSources.length === 1 && enabled;
          return (
            <li
              key={sourceId}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5"
            >
              <Checkbox
                id={`card-source-${sourceId}`}
                checked={enabled}
                onCheckedChange={(checked) =>
                  handleToggle(sourceId, checked === true)
                }
                disabled={isLast}
                aria-label={t(`addTransaction.${EXPENSE_SOURCE_LOCALE_KEYS[sourceId]}`)}
              />
              <label
                htmlFor={`card-source-${sourceId}`}
                className="flex items-center gap-2 flex-1 cursor-pointer min-w-0"
              >
                <span className="inline-flex items-center justify-center rounded-md bg-muted text-[10px] px-2 py-0.5 text-muted-foreground">
                  {EXPENSE_SOURCE_BADGE_LABELS[sourceId]}
                </span>
                <span className="text-sm font-medium truncate">
                  {t(`addTransaction.${EXPENSE_SOURCE_LOCALE_KEYS[sourceId]}`)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {onlyOneEnabled && (
        <p className="text-xs text-muted-foreground">
          {t("settings.cardSourcesOneRequired")}
        </p>
      )}
    </>
  );

  if (bare) {
    return <div className="space-y-3">{content}</div>;
  }

  return (
    <Card className="md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
      <div className="px-4 py-4 md:px-0 md:py-0">
        <DsSectionHeader
          title={t("settings.cardSources")}
          subtitle={t("settings.cardSourcesDesc")}
          titleClassName="text-lg md:text-xl"
          subtitleClassName="text-xs md:text-sm"
        />
      </div>
      <CardContent className="px-4 md:px-0">
        <div className="rounded-xl border border-border/70 bg-card/40 p-4 md:p-5">
          {content}
        </div>
      </CardContent>
    </Card>
  );
}
