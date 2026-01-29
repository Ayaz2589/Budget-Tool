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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type GoogleSheetsCardProps = {
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
  spreadsheetId: string | undefined;
  sheetIdInput: string;
  onSheetIdChange: (value: string) => void;
  onSetSheetId: () => void;
  syncToSheets: () => void;
  pullFromSheet: () => void;
  syncStatus: "idle" | "syncing" | "success" | "error";
  syncErrorMessage: string | undefined;
  onRepairDates: () => void;
  repairResult: string | null;
  syncConfirmOpen: boolean;
  setSyncConfirmOpen: (open: boolean) => void;
  restoreConfirmOpen: boolean;
  setRestoreConfirmOpen: (open: boolean) => void;
  t: (key: string) => string;
};

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
  onRepairDates,
  repairResult,
  syncConfirmOpen,
  setSyncConfirmOpen,
  restoreConfirmOpen,
  setRestoreConfirmOpen,
  t,
}: GoogleSheetsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.googleSheets")}</CardTitle>
        <CardDescription>{t("settings.googleSheetsDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSignedIn ? (
          <Button onClick={signIn}>Connect Google</Button>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Signed in</span>
              <Button variant="outline" size="sm" onClick={signOut}>
                Disconnect
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Spreadsheet ID or URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste spreadsheet URL or ID"
                  value={sheetIdInput}
                  onChange={(e) => onSheetIdChange(e.target.value)}
                />
                <Button variant="outline" onClick={onSetSheetId}>
                  Set
                </Button>
              </div>
              {spreadsheetId && (
                <p className="text-xs text-muted-foreground">
                  Using: {spreadsheetId.slice(0, 20)}...
                </p>
              )}
            </div>
            {spreadsheetId && (
              <>
                <div className="flex flex-wrap gap-2 items-center">
                  <Button
                    onClick={() => setRestoreConfirmOpen(true)}
                    disabled={syncStatus === "syncing"}
                    variant="outline"
                  >
                    {syncStatus === "syncing"
                      ? "Syncing..."
                      : "Restore from Sheet"}
                  </Button>
                  <Button
                    onClick={() => setSyncConfirmOpen(true)}
                    disabled={syncStatus === "syncing"}
                  >
                    {syncStatus === "syncing"
                      ? "Syncing..."
                      : "Sync to Google Sheets"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onRepairDates}
                    title="Fix dates that were corrupted (e.g. from Google Sheets formatting)"
                  >
                    Repair corrupted dates
                  </Button>
                  {repairResult && (
                    <span className="text-sm text-muted-foreground">
                      {repairResult}
                    </span>
                  )}
                </div>

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
                <p className="text-xs text-muted-foreground">
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
