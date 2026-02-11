import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GoogleAuthContextValue } from "@/types/auth";

type SheetSetupDialogProps = Pick<
  GoogleAuthContextValue,
  | "isSignedIn"
  | "spreadsheetId"
  | "sheetSetupState"
  | "availableDriveSheets"
  | "runSheetAutoSetup"
  | "linkDriveSheet"
  | "createOrthoDriveSheet"
  | "dismissSheetSetupPrompt"
>;

export function SheetSetupDialog({
  isSignedIn,
  spreadsheetId,
  sheetSetupState,
  availableDriveSheets,
  runSheetAutoSetup,
  linkDriveSheet,
  createOrthoDriveSheet,
  dismissSheetSetupPrompt,
}: SheetSetupDialogProps) {
  const { t } = useTranslation();
  const [selectedSheetId, setSelectedSheetId] = useState<string>("");

  const open = isSignedIn && !spreadsheetId && sheetSetupState !== "idle" && sheetSetupState !== "done";

  const canUseSelection =
    sheetSetupState === "needs-selection" &&
    selectedSheetId.length > 0;

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{t("settings.sheetSetupTitle")}</DialogTitle>
          <DialogDescription>
            {sheetSetupState === "loading" && t("settings.sheetSetupLoading")}
            {sheetSetupState === "needs-selection" && t("settings.sheetSetupSelectDesc")}
            {sheetSetupState === "needs-create" && t("settings.sheetSetupCreateDesc")}
            {sheetSetupState === "creating" && t("settings.sheetSetupCreating")}
            {sheetSetupState === "error" && t("settings.sheetSetupError")}
          </DialogDescription>
        </DialogHeader>

        {sheetSetupState === "needs-selection" && (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {availableDriveSheets.map((sheet) => {
              const active = selectedSheetId === sheet.id;
              return (
                <button
                  key={sheet.id}
                  type="button"
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted/40"
                  }`}
                  onClick={() => setSelectedSheetId(sheet.id)}
                >
                  <div className="font-medium">{sheet.name}</div>
                  <div className="text-xs text-muted-foreground break-all">{sheet.id}</div>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={dismissSheetSetupPrompt}>
            {t("settings.sheetSetupNotNow")}
          </Button>

          {sheetSetupState === "needs-selection" && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void runSheetAutoSetup()}>
                {t("settings.sheetSetupRefresh")}
              </Button>
              <Button
                disabled={!canUseSelection}
                onClick={() => linkDriveSheet(selectedSheetId)}
              >
                {t("settings.sheetSetupUseSelected")}
              </Button>
            </div>
          )}

          {sheetSetupState === "needs-create" && (
            <Button onClick={() => void createOrthoDriveSheet()}>
              {t("settings.sheetSetupCreate")}
            </Button>
          )}

          {sheetSetupState === "error" && (
            <Button onClick={() => void runSheetAutoSetup()}>
              {t("settings.sheetSetupRetry")}
            </Button>
          )}
        </DialogFooter>

        {(sheetSetupState === "needs-create" || sheetSetupState === "error") && (
          <p className="text-xs text-muted-foreground">
            {t("settings.sheetSetupManualHint")}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
