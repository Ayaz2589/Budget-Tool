import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Check, Save, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import type { SavedLayoutEntry, SaveLayoutResult, RenameResult } from "@/types/widget";

interface DsLayoutSwitcherProps {
  savedLayouts: SavedLayoutEntry[];
  activeLayoutId: string;
  onSwitch: (id: string) => void;
  onSave: (name: string) => SaveLayoutResult;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => RenameResult;
}

export function DsLayoutSwitcher({
  savedLayouts,
  activeLayoutId,
  onSwitch,
  onSave,
  onDelete,
  onRename,
}: DsLayoutSwitcherProps) {
  const { t } = useTranslation();
  const [listOpen, setListOpen] = useState(false);

  // Save dialog state
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveError, setSaveError] = useState("");

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<SavedLayoutEntry | null>(null);

  // Rename dialog state
  const [renameTarget, setRenameTarget] = useState<SavedLayoutEntry | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameError, setRenameError] = useState("");

  const activeLayout = savedLayouts.find((e) => e.id === activeLayoutId);

  // --- Save ---

  const handleSave = useCallback(() => {
    const result = onSave(saveName);
    if (result.ok) {
      setSaveOpen(false);
      setSaveName("");
      setSaveError("");
    } else {
      switch (result.reason) {
        case "empty_name":
          setSaveError(t("widget.layoutNameRequired"));
          break;
        case "name_too_long":
          setSaveError(t("widget.layoutNameTooLong"));
          break;
        case "limit_reached":
          setSaveError(t("widget.layoutLimitReached"));
          break;
        default:
          setSaveError(t("widget.layoutNameRequired"));
          break;
      }
    }
  }, [saveName, onSave, t]);

  const handleOpenSave = useCallback(() => {
    setSaveName("");
    setSaveError("");
    setSaveOpen(true);
  }, []);

  // --- Delete ---

  const handleDelete = useCallback(() => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, onDelete]);

  // --- Rename ---

  const handleOpenRename = useCallback((entry: SavedLayoutEntry) => {
    setRenameName(entry.name);
    setRenameError("");
    setRenameTarget(entry);
  }, []);

  const handleRename = useCallback(() => {
    if (!renameTarget) return;
    const result = onRename(renameTarget.id, renameName);
    if (result.ok) {
      setRenameTarget(null);
      setRenameName("");
      setRenameError("");
    } else {
      switch (result.reason) {
        case "empty_name":
          setRenameError(t("widget.layoutNameRequired"));
          break;
        case "name_too_long":
          setRenameError(t("widget.layoutNameTooLong"));
          break;
        case "duplicate_name":
          setRenameError(t("widget.layoutNameDuplicate"));
          break;
        default:
          setRenameError(t("widget.layoutNameRequired"));
          break;
      }
    }
  }, [renameTarget, renameName, onRename, t]);

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Popover open={listOpen} onOpenChange={setListOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-8 rounded-full text-xs px-3 min-w-[100px] justify-between gap-1.5"
            >
              <span className="truncate max-w-[120px]">
                {activeLayout?.name ?? t("widget.defaultLayout")}
              </span>
              <ChevronDown className="size-3.5 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1" align="start">
            {savedLayouts.map((entry) => (
              <div
                key={entry.id}
                className="group flex items-center rounded-md text-sm"
              >
                <button
                  className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent cursor-default"
                  onClick={() => {
                    onSwitch(entry.id);
                    setListOpen(false);
                  }}
                >
                  <Check
                    className={`size-3.5 shrink-0 ${entry.id === activeLayoutId ? "opacity-100" : "opacity-0"}`}
                  />
                  <span className="truncate">{entry.name}</span>
                </button>
                {entry.id !== "default" && (
                  <div className="flex shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setListOpen(false);
                        handleOpenRename(entry);
                      }}
                      aria-label={t("widget.renameLayout")}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setListOpen(false);
                        setDeleteTarget(entry);
                      }}
                      aria-label={t("widget.deleteLayoutConfirmTitle")}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={handleOpenSave}
          aria-label={t("widget.saveLayout")}
        >
          <Save className="size-3.5" />
        </Button>
      </div>

      {/* Save dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("widget.saveLayout")}</DialogTitle>
            <DialogDescription>{t("widget.layoutName")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={saveName}
              onChange={(e) => {
                setSaveName(e.target.value);
                setSaveError("");
              }}
              placeholder={t("widget.myLayout")}
              maxLength={30}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              autoFocus
            />
            {saveError && (
              <p className="text-destructive text-sm">{saveError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave}>{t("widget.saveLayout")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("widget.deleteLayoutConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("widget.deleteLayoutConfirmDescription", {
                name: deleteTarget?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("widget.deleteLayoutConfirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename dialog */}
      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("widget.renameLayout")}</DialogTitle>
            <DialogDescription>{t("widget.layoutName")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={renameName}
              onChange={(e) => {
                setRenameName(e.target.value);
                setRenameError("");
              }}
              maxLength={30}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
              autoFocus
            />
            {renameError && (
              <p className="text-destructive text-sm">{renameError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleRename}>{t("widget.renameLayout")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
