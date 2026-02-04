import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { IncomeCategoriesCardProps } from "@/types/settings";

export type { IncomeCategoriesCardProps };

export function IncomeCategoriesCard({
  categories,
  onRemove,
  onAdd,
}: IncomeCategoriesCardProps) {
  const { t } = useTranslation();
  const [newCategory, setNewCategory] = useState("");
  const [categoryToRemove, setCategoryToRemove] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = newCategory.trim();
    if (trimmed) {
      onAdd(trimmed);
      setNewCategory("");
    }
  };

  const handleConfirmRemove = () => {
    if (categoryToRemove) {
      onRemove(categoryToRemove);
      setCategoryToRemove(null);
    }
  };

  return (
    <Card className="md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
      <CardHeader className="px-4 md:px-0">
        <CardTitle>{t("settings.incomeCategories")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-6 px-4 md:px-0">
        <ul className="space-y-2">
          {categories.map((category) => (
            <li
              key={category}
              className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2"
            >
              <span className="text-sm font-medium truncate min-w-0">
                {category}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-destructive hover:text-destructive"
                onClick={() => setCategoryToRemove(category)}
                aria-label={t("settings.removeCategory", { category })}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("settings.incomeCategoriesUncategorizedHint")}
        </p>
        <div className="flex gap-2">
          <Input
            aria-label={t("settings.addCategory")}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAdd())
            }
            placeholder={t("settings.addCategoryPlaceholder")}
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            variant="default"
            onClick={handleAdd}
            disabled={!newCategory.trim()}
            className="h-11 shrink-0"
          >
            {t("settings.addCategory")}
          </Button>
        </div>
      </CardContent>

      <Dialog
        open={!!categoryToRemove}
        onOpenChange={(open) => !open && setCategoryToRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("settings.removeIncomeCategoryConfirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("settings.removeIncomeCategoryConfirmDesc", {
                category: categoryToRemove ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryToRemove(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmRemove}>
              <Trash2 className="size-4" />
              {t("settings.removeCategory", {
                category: categoryToRemove ?? "",
              })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
