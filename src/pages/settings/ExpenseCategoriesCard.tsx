import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { DsSectionHeader } from "@/components/ds";
import type { ExpenseCategoriesCardProps } from "@/types/settings";

export type { ExpenseCategoriesCardProps };

export function ExpenseCategoriesCard({
  categories,
  onRemove,
  onAdd,
  onRename,
  bare = false,
}: ExpenseCategoriesCardProps) {
  const { t } = useTranslation();
  const [newCategory, setNewCategory] = useState("");
  const [categoryToRemove, setCategoryToRemove] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

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

  const handleStartEdit = (category: string) => {
    setEditingCategory(category);
    setEditValue(category);
    setTimeout(() => editInputRef.current?.select(), 0);
  };

  const handleSaveEdit = () => {
    const trimmed = editValue.trim();
    if (
      editingCategory &&
      trimmed &&
      trimmed !== editingCategory &&
      !categories.includes(trimmed) &&
      onRename
    ) {
      onRename(editingCategory, trimmed);
    }
    setEditingCategory(null);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  const content = (
    <div className="space-y-3">
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {categories.map((category) => (
          <li
            key={category}
            className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5"
          >
            {editingCategory === category ? (
              <div className="flex flex-1 items-center gap-1.5 min-w-0">
                <Input
                  ref={editInputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleSaveEdit(); }
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="h-7 min-w-0 flex-1 text-sm"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-emerald-600 hover:text-emerald-700"
                  onClick={handleSaveEdit}
                  disabled={!editValue.trim() || editValue.trim() === editingCategory || categories.includes(editValue.trim())}
                  aria-label={t("common.save")}
                >
                  <Check className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={handleCancelEdit}
                  aria-label={t("common.cancel")}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium truncate min-w-0">
                  {category}
                </span>
                <div className="flex items-center gap-0.5 shrink-0">
                  {onRename && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleStartEdit(category)}
                      aria-label={t("settings.renameCategory", { category })}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  )}
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
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {t("settings.expenseCategoriesUncategorizedHint")}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
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
          className="shrink-0 w-full sm:w-auto"
        >
          {t("settings.addCategory")}
        </Button>
      </div>
    </div>
  );

  const dialog = (
    <Dialog
        open={!!categoryToRemove}
        onOpenChange={(open) => !open && setCategoryToRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("settings.removeExpenseCategoryConfirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("settings.removeExpenseCategoryConfirmDesc", {
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
  );

  if (bare) {
    return <>{content}{dialog}</>;
  }

  return (
    <Card className="md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
      <div className="px-4 py-4 md:px-0 md:py-0">
        <DsSectionHeader
          title={t("settings.expenseCategories")}
          titleClassName="text-lg md:text-xl"
        />
      </div>
      <CardContent className="space-y-3 pb-6 px-4 md:px-0">
        <div className="rounded-xl border border-border/70 bg-card/40 p-4 md:p-5">
          {content}
        </div>
      </CardContent>
      {dialog}
    </Card>
  );
}
