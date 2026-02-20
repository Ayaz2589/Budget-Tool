import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

function GoogleSheetsIcon({ className = "size-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 65"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M29.58 0H4.44A4.44 4.44 0 0 0 0 4.44v56.21a4.44 4.44 0 0 0 4.44 4.44H42.9a4.44 4.44 0 0 0 4.43-4.44V17.75L29.58 0Z"
        fill="#0F9D58"
      />
      <path
        d="M29.58 0v13.31a4.44 4.44 0 0 0 4.44 4.44h13.31L29.58 0Z"
        fill="#87CEAC"
      />
      <path
        d="M11.83 31.8v21.45H35.5V31.8H11.83Zm10.35 18.49h-7.4v-3.7h7.4v3.7Zm0-5.92h-7.4v-3.7h7.4v3.7Zm0-5.92h-7.4v-3.7h7.4v3.7Zm10.36 11.84h-7.4v-3.7h7.4v3.7Zm0-5.92h-7.4v-3.7h7.4v3.7Zm0-5.92h-7.4v-3.7h7.4v3.7Z"
        fill="#F1F1F1"
      />
    </svg>
  );
}

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
        className="max-w-[calc(100%-1rem)] gap-3 p-4 sm:max-w-lg sm:gap-4 sm:p-5"
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
          <div className="max-h-52 space-y-2 overflow-y-auto">
            {availableDriveSheets.map((sheet) => {
              const active = selectedSheetId === sheet.id;
              return (
                <button
                  key={sheet.id}
                  type="button"
                  className={`w-full rounded-xl border px-4 py-4 text-left text-lg transition-colors ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted/40"
                  }`}
                  onClick={() => setSelectedSheetId(sheet.id)}
                >
                  <div className="flex min-h-12 items-center gap-3">
                    <GoogleSheetsIcon className="size-7 shrink-0" />
                    <div className="font-semibold leading-tight">{sheet.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-2 pt-1">
          {sheetSetupState === "needs-selection" ? (
            <>
              <Button
                className="w-full"
                disabled={!canUseSelection}
                onClick={() => linkDriveSheet(selectedSheetId)}
              >
                {t("settings.sheetSetupUseSelected")}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void runSheetAutoSetup()}
                >
                {t("settings.sheetSetupRefresh")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={dismissSheetSetupPrompt}
                >
                  {t("settings.sheetSetupNotNow")}
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {sheetSetupState === "needs-create" && (
                <Button className="w-full" onClick={() => void createOrthoDriveSheet()}>
                  {t("settings.sheetSetupCreate")}
                </Button>
              )}
              {sheetSetupState === "error" && (
                <Button className="w-full" onClick={() => void runSheetAutoSetup()}>
                  {t("settings.sheetSetupRetry")}
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={dismissSheetSetupPrompt}
              >
                {t("settings.sheetSetupNotNow")}
              </Button>
            </div>
          )}
        </div>

        {(sheetSetupState === "needs-create" || sheetSetupState === "error") && (
          <p className="text-xs text-muted-foreground">
            {t("settings.sheetSetupManualHint")}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
