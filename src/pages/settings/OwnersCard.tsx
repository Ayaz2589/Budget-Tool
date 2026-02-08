import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
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

export function OwnersCard({ owners, onRemove, onAdd }: OwnersCardProps) {
  const { t } = useTranslation();
  const [newOwner, setNewOwner] = useState("");
  const [ownerToRemove, setOwnerToRemove] = useState<string | null>(null);

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

  return (
    <Card className="md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
      <div className="px-4 py-4 md:px-0 md:py-0">
        <DsSectionHeader
          title={t("settings.owners")}
          titleClassName="text-lg md:text-xl"
        />
      </div>
      <CardContent className="space-y-3 pb-6 px-4 md:px-0">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {owners.map((owner) => (
            <li
              key={owner}
              className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2"
            >
              <span className="text-sm font-medium truncate min-w-0">
                {owner}
              </span>
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
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("settings.ownersNoOwnerHint")}
        </p>
        <div className="flex gap-2">
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
            className="h-11 shrink-0"
          >
            {t("settings.addOwner")}
          </Button>
        </div>
      </CardContent>

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
    </Card>
  );
}
