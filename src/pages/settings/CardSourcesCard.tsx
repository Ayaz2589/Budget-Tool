import { useTranslation } from "react-i18next";
import type { ExpenseSource } from "@/lib/types";
import { ALL_EXPENSE_SOURCES } from "@/lib/types";
import { useBudget } from "@/context/BudgetContext";
import { usePresetTransactions } from "@/context/PresetTransactionsContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SourceIcon } from "@/components/cards";

const SOURCE_LABEL_KEYS: Record<ExpenseSource, string> = {
  amex: "addTransaction.sourceAmexPlatinum",
  "amex-gold": "addTransaction.sourceAmexGold",
  chase: "addTransaction.sourceChase",
  apple: "addTransaction.sourceApple",
  manual: "addTransaction.sourceManual",
  td: "addTransaction.sourceTd",
};

export function CardSourcesCard() {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.cardSources")}</CardTitle>
        <CardDescription>{t("settings.cardSourcesDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {ALL_EXPENSE_SOURCES.map((sourceId) => {
            const enabled = cardSources.includes(sourceId);
            const isLast = cardSources.length === 1 && enabled;
            return (
              <li
                key={sourceId}
                className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2"
              >
                <Checkbox
                  id={`card-source-${sourceId}`}
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    handleToggle(sourceId, checked === true)
                  }
                  disabled={isLast}
                  aria-label={t(SOURCE_LABEL_KEYS[sourceId])}
                />
                <label
                  htmlFor={`card-source-${sourceId}`}
                  className="flex items-center gap-2 flex-1 cursor-pointer min-w-0"
                >
                  <SourceIcon source={sourceId} size={20} />
                  <span className="text-sm font-medium truncate">
                    {t(SOURCE_LABEL_KEYS[sourceId])}
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
      </CardContent>
    </Card>
  );
}
