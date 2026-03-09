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
import type { OwnersCardProps } from "@/types/settings";

export type { OwnersCardProps };

export function OwnersCard({ owners, onRemove, onAdd, onRename, bare = false }: OwnersCardProps) {
  const { t } = useTranslation();
  const [newOwner, setNewOwner] = useState("");
  const [ownerToRemove, setOwnerToRemove] = useState<string | null>(null);
  const [editingOwner, setEditingOwner] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmed = newOwner.trim();
    if (trimmed) {
      onAdd(trimmed);
      setNewOwner("");
    }
  };

  const handleConfirmRemove = () => {
    if (ownerToRemove) {
      onRemove(ownerToRemove);
      setOwnerToRemove(null);
    }
  };

  const handleStartEdit = (owner: string) => {
    setEditingOwner(owner);
    setEditValue(owner);
    setTimeout(() => editInputRef.current?.select(), 0);
  };

  const handleSaveEdit = () => {
    const trimmed = editValue.trim();
    if (
      editingOwner &&
      trimmed &&
      trimmed !== editingOwner &&
      !owners.includes(trimmed) &&
      onRename
    ) {
      onRename(editingOwner, trimmed);
    }
    setEditingOwner(null);
  };

  const handleCancelEdit = () => {
    setEditingOwner(null);
  };

  const content = (
    <div className="space-y-3">
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {owners.map((owner) => (
          <li
            key={owner}
            className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5"
          >
            {editingOwner === owner ? (
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
                  disabled={!editValue.trim() || editValue.trim() === editingOwner || owners.includes(editValue.trim())}
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
                  {owner}
                </span>
                <div className="flex items-center gap-0.5 shrink-0">
                  {onRename && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleStartEdit(owner)}
                      aria-label={t("settings.renameOwner", { owner })}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => setOwnerToRemove(owner)}
                    aria-label={t("settings.removeOwner", { owner })}
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
        {t("settings.ownersNoOwnerHint")}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          aria-label={t("settings.addOwner")}
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && (e.preventDefault(), handleAdd())
          }
          placeholder={t("settings.addOwnerPlaceholder")}
          className="min-w-0 flex-1"
        />
        <Button
          type="button"
          variant="default"
          onClick={handleAdd}
          disabled={!newOwner.trim()}
          className="shrink-0 w-full sm:w-auto"
        >
          {t("settings.addOwner")}
        </Button>
      </div>
    </div>
  );

  const dialog = (
    <Dialog
        open={!!ownerToRemove}
        onOpenChange={(open) => !open && setOwnerToRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.removeOwnerConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("settings.removeOwnerConfirmDesc", {
                owner: ownerToRemove ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOwnerToRemove(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmRemove}>
              <Trash2 className="size-4" />
              {t("settings.removeOwner", { owner: ownerToRemove ?? "" })}
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
          title={t("settings.owners")}
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
