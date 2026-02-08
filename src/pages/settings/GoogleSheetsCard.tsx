import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GoogleSheetsCardProps } from "@/types/settings";
import { DsSectionHeader } from "@/components/ds";

export type { GoogleSheetsCardProps };

export function GoogleSheetsCard({
  isSignedIn,
  signIn,
  signOut,
  spreadsheetId,
  sheetIdInput,
  onSheetIdChange,
  onSetSheetId,
  syncToSheets,
  pullFromSheet,
  syncStatus,
  syncErrorMessage,
  isAutoSyncEnabled,
  onAutoSyncToggle,
  lastSyncAt,
  hasUnsyncedChanges,
  syncHealth,
  onRepairDates,
  repairResult,
  syncConfirmOpen,
  setSyncConfirmOpen,
  restoreConfirmOpen,
  setRestoreConfirmOpen,
  t,
}: GoogleSheetsCardProps) {
  return (
    <Card className="md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
      <div className="px-4 py-4 md:px-0 md:py-0">
        <DsSectionHeader
          title={t("settings.googleSheets")}
          subtitle={t("settings.googleSheetsDesc")}
          titleClassName="text-lg md:text-xl"
          subtitleClassName="text-xs md:text-sm"
        />
      </div>
      <CardContent className="space-y-5 px-4 md:px-0">
        {!isSignedIn ? (
          <div className="flex flex-col gap-3">
            <Button onClick={signIn} className="h-11 w-full sm:w-auto">
              {t("settings.connectGoogle")}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t("settings.connectGoogleDesc")}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border/60 p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="auto-sync-toggle"
                  checked={isAutoSyncEnabled}
                  onCheckedChange={(checked) => onAutoSyncToggle(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="auto-sync-toggle" className="text-sm font-medium">
                    {t("settings.autoSyncTitle")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.autoSyncDesc")}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <span>
                  {t("settings.syncHealthLabel")}{" "}
                  {syncHealth === "healthy"
                    ? t("settings.syncHealthHealthy")
                    : syncHealth === "warning"
                      ? t("settings.syncHealthWarning")
                      : t("settings.syncHealthError")}
                </span>
                {lastSyncAt && (
                  <span className="ml-3">
                    {t("settings.lastSyncAt", { date: new Date(lastSyncAt).toLocaleString() })}
                  </span>
                )}
                {hasUnsyncedChanges && (
                  <span className="ml-3">{t("settings.unsyncedUpdatesDetected")}</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("settings.status")}
                </span>
                <span className="rounded-full border border-border/60 bg-muted/30 px-2 py-1 text-xs">
                  {t("settings.signedIn")}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={signOut}
                className="h-11"
              >
                {t("settings.disconnect")}
              </Button>
            </div>
            <div className="space-y-2">
              <Label>{t("settings.spreadsheetIdOrUrl")}</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  placeholder={t("settings.spreadsheetPlaceholder")}
                  value={sheetIdInput}
                  onChange={(e) => onSheetIdChange(e.target.value)}
                  className="min-w-0"
                />
                <Button
                  variant="outline"
                  onClick={onSetSheetId}
                  className="h-11 shrink-0 w-full sm:w-auto"
                >
                  {t("settings.set")}
                </Button>
              </div>
              {spreadsheetId && (
                <p
                  className="text-xs text-muted-foreground break-all font-mono"
                  title={spreadsheetId}
                >
                  {t("settings.using")}: {spreadsheetId}
                </p>
              )}
            </div>
            {spreadsheetId && (
              <>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    onClick={() => setRestoreConfirmOpen(true)}
                    disabled={syncStatus === "syncing"}
                    variant="outline"
                    className="h-11 w-full"
                  >
                    {syncStatus === "syncing"
                      ? t("settings.syncing")
                      : t("settings.restoreFromSheet")}
                  </Button>
                  <Button
                    onClick={() => setSyncConfirmOpen(true)}
                    disabled={syncStatus === "syncing"}
                    className="h-11 w-full"
                  >
                    {syncStatus === "syncing"
                      ? t("settings.syncing")
                      : t("settings.syncToGoogleSheets")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onRepairDates}
                    title={t("settings.repairCorruptedDatesTitle")}
                    className="h-11 w-full sm:col-span-2"
                  >
                    {t("settings.repairCorruptedDates")}
                  </Button>
                </div>
                {repairResult && (
                  <span className="text-sm text-muted-foreground">
                    {repairResult}
                  </span>
                )}

                <Dialog
                  open={syncConfirmOpen}
                  onOpenChange={setSyncConfirmOpen}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("settings.syncConfirmTitle")}</DialogTitle>
                      <DialogDescription>
                        {t("settings.syncConfirmDesc")}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setSyncConfirmOpen(false)}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        onClick={() => {
                          setSyncConfirmOpen(false);
                          syncToSheets();
                        }}
                      >
                        {t("settings.syncToGoogleSheets")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={restoreConfirmOpen}
                  onOpenChange={setRestoreConfirmOpen}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("settings.restoreConfirmTitle")}</DialogTitle>
                      <DialogDescription>
                        {t("settings.restoreConfirmDesc")}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setRestoreConfirmOpen(false)}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        onClick={() => {
                          setRestoreConfirmOpen(false);
                          pullFromSheet();
                        }}
                      >
                        {t("settings.restoreFromSheet")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("settings.restoreSyncNote")}
                </p>
              </>
            )}
            {syncStatus === "success" && (
              <p className="text-sm text-green-600 dark:text-green-400">
                {t("settings.syncComplete")}
              </p>
            )}
            {syncStatus === "error" && (
              <p className="text-sm text-destructive">
                {syncErrorMessage ?? t("settings.syncFailed")}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
