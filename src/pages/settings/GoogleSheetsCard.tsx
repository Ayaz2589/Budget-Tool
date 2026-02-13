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
  useDummyData,
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
          <div className="rounded-xl border border-border/70 bg-card/40 p-4 md:p-5">
            <div className="flex flex-col gap-3">
              <Button onClick={signIn} className="h-11 w-full sm:w-auto">
                {t("settings.connectGoogle")}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t("settings.connectGoogleDesc")}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border/70 bg-card/40 p-4 md:p-5">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/60 p-3">
                  <Checkbox
                    id="auto-sync-toggle"
                    checked={isAutoSyncEnabled}
                    disabled={useDummyData}
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
                {useDummyData && (
                  <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                    {t("settings.dummySyncBlocked")}
                  </p>
                )}

                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("settings.status")}
                    </span>
                    <span className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-xs font-medium">
                      {t("settings.signedIn")}
                    </span>
                    <span className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-xs">
                      {t("settings.syncHealthLabel")}{" "}
                      {syncHealth === "healthy"
                        ? t("settings.syncHealthHealthy")
                        : syncHealth === "warning"
                          ? t("settings.syncHealthWarning")
                          : t("settings.syncHealthError")}
                    </span>
                  </div>
                  <Button variant="outline" onClick={signOut} className="h-11 md:min-w-32">
                    {t("settings.disconnect")}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>{t("settings.spreadsheetIdOrUrl")}</Label>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <Input
                      placeholder={t("settings.spreadsheetPlaceholder")}
                      value={sheetIdInput}
                      onChange={(e) => onSheetIdChange(e.target.value)}
                      className="min-w-0"
                    />
                    <Button
                      variant="outline"
                      onClick={onSetSheetId}
                      className="h-11 shrink-0 w-full md:w-auto md:min-w-24"
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

                {lastSyncAt && (
                  <p className="text-xs text-muted-foreground">
                    {t("settings.lastSyncAt", { date: new Date(lastSyncAt).toLocaleString() })}
                    {hasUnsyncedChanges ? ` • ${t("settings.unsyncedUpdatesDetected")}` : ""}
                  </p>
                )}
              </div>
            </div>

            {spreadsheetId && (
              <div className="rounded-xl border border-border/70 bg-card/40 p-4 md:p-5 space-y-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <Button
                    onClick={() => setSyncConfirmOpen(true)}
                    disabled={syncStatus === "syncing" || useDummyData}
                    className="h-11 w-full"
                  >
                    {syncStatus === "syncing"
                      ? t("settings.syncing")
                      : t("settings.syncToGoogleSheets")}
                  </Button>
                  <Button
                    onClick={() => setRestoreConfirmOpen(true)}
                    disabled={syncStatus === "syncing" || useDummyData}
                    variant="outline"
                    className="h-11 w-full"
                  >
                    {syncStatus === "syncing"
                      ? t("settings.syncing")
                      : t("settings.restoreFromSheet")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onRepairDates}
                    title={t("settings.repairCorruptedDatesTitle")}
                    className="h-11 w-full"
                  >
                    {t("settings.repairCorruptedDates")}
                  </Button>
                </div>
                {repairResult && (
                  <p className="text-sm text-muted-foreground">
                    {repairResult}
                  </p>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("settings.restoreSyncNote")}
                </p>
              </div>
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
                    disabled={useDummyData}
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
                    disabled={useDummyData}
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

            {syncStatus === "success" && (
              <p className="rounded-lg border border-green-300/60 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-700/40 dark:bg-green-950/30 dark:text-green-400">
                {t("settings.syncComplete")}
              </p>
            )}
            {syncStatus === "error" && (
              <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {syncErrorMessage ?? t("settings.syncFailed")}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
