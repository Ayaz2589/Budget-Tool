import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
      <CardHeader className="px-4 md:px-0">
        <CardTitle>{t("settings.googleSheets")}</CardTitle>
        <CardDescription>{t("settings.googleSheetsDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 px-4 md:px-0">
        {!isSignedIn ? (
          <div className="flex flex-col gap-3">
            <Button onClick={signIn} className="h-11 w-full sm:w-auto">
              Connect Google
            </Button>
            <p className="text-xs text-muted-foreground">
              We’ll only use this to sync your data to a spreadsheet you choose.
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
                    Auto sync changes
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically syncs after edits with a short delay.
                  </p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <span>
                  Health:{" "}
                  {syncHealth === "healthy"
                    ? "Healthy"
                    : syncHealth === "warning"
                      ? "Pending changes"
                      : "Needs attention"}
                </span>
                {lastSyncAt && (
                  <span className="ml-3">
                    Last sync: {new Date(lastSyncAt).toLocaleString()}
                  </span>
                )}
                {hasUnsyncedChanges && (
                  <span className="ml-3">Unsynced updates detected</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Status
                </span>
                <span className="rounded-full border border-border/60 bg-muted/30 px-2 py-1 text-xs">
                  Connected
                </span>
              </div>
              <Button
                variant="outline"
                onClick={signOut}
                className="h-11"
              >
                Disconnect
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Spreadsheet ID or URL</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  placeholder="Paste spreadsheet URL or ID"
                  value={sheetIdInput}
                  onChange={(e) => onSheetIdChange(e.target.value)}
                  className="min-w-0"
                />
                <Button
                  variant="outline"
                  onClick={onSetSheetId}
                  className="h-11 shrink-0 w-full sm:w-auto"
                >
                  Set
                </Button>
              </div>
              {spreadsheetId && (
                <p
                  className="text-xs text-muted-foreground break-all font-mono"
                  title={spreadsheetId}
                >
                  Using: {spreadsheetId}
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
                      ? "Syncing..."
                      : "Restore from Sheet"}
                  </Button>
                  <Button
                    onClick={() => setSyncConfirmOpen(true)}
                    disabled={syncStatus === "syncing"}
                    className="h-11 w-full"
                  >
                    {syncStatus === "syncing"
                      ? "Syncing..."
                      : "Sync to Google Sheets"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onRepairDates}
                    title="Fix dates that were corrupted (e.g. from Google Sheets formatting)"
                    className="h-11 w-full sm:col-span-2"
                  >
                    Repair corrupted dates
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
                      <DialogTitle>Sync to Google Sheets?</DialogTitle>
                      <DialogDescription>
                        This will overwrite your spreadsheet with the app&apos;s
                        current expenses, income, and totals. Your sheet data
                        will be replaced. This cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setSyncConfirmOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          setSyncConfirmOpen(false);
                          syncToSheets();
                        }}
                      >
                        Sync to Google Sheets
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
                      <DialogTitle>Restore from Sheet?</DialogTitle>
                      <DialogDescription>
                        This will load data from the spreadsheet into the app
                        and merge with existing transactions and income. Any
                        matching rows will be skipped; new rows from the sheet
                        will be added.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setRestoreConfirmOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          setRestoreConfirmOpen(false);
                          pullFromSheet();
                        }}
                      >
                        Restore from Sheet
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Restore from Sheet: load data from the spreadsheet into the
                  app (e.g. after clearing local storage). Sync to Google
                  Sheets: pull then push so app and sheet stay in sync.
                </p>
              </>
            )}
            {syncStatus === "success" && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Sync complete.
              </p>
            )}
            {syncStatus === "error" && (
              <p className="text-sm text-destructive">
                {syncErrorMessage ?? "Sync failed."}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
