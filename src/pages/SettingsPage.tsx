import { useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import { extractSpreadsheetId } from "@/lib/googleSheets";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsPage() {
  const {
    expenseCategories,
    incomeCategories,
    setExpenseCategories,
    setIncomeCategories,
    repairCorruptedDates,
  } = useBudget();
  const {
    isSignedIn,
    signIn,
    signOut,
    spreadsheetId,
    setSpreadsheetId,
    syncToSheets,
    pullFromSheet,
    syncStatus,
    syncErrorMessage,
  } = useGoogleAuth();

  const [expenseList, setExpenseList] = useState(expenseCategories.join(", "));
  const [incomeList, setIncomeList] = useState(incomeCategories.join(", "));
  const [sheetIdInput, setSheetIdInput] = useState(spreadsheetId ?? "");
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [repairResult, setRepairResult] = useState<string | null>(null);

  const handleRepairDates = () => {
    const { fixedExpenses, fixedIncome } = repairCorruptedDates();
    setRepairResult(
      fixedExpenses > 0 || fixedIncome > 0
        ? `Repaired ${fixedExpenses} expense(s) and ${fixedIncome} income entry(ies).`
        : "No corrupted dates found.",
    );
    setTimeout(() => setRepairResult(null), 5000);
  };

  const saveExpenseCategories = () => {
    const list = expenseList
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length > 0) setExpenseCategories(list);
  };

  const saveIncomeCategories = () => {
    const list = incomeList
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length > 0) setIncomeCategories(list);
  };

  const handleSetSpreadsheetId = () => {
    const trimmed = sheetIdInput.trim();
    if (trimmed) {
      const id = trimmed.includes("/")
        ? extractSpreadsheetId(trimmed)
        : trimmed;
      if (id) setSpreadsheetId(id);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Google Sheets</CardTitle>
          <CardDescription>
            Connect your Google account and sync expenses, income, and totals to
            a spreadsheet.
          </CardDescription>
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
                    onChange={(e) => setSheetIdInput(e.target.value)}
                  />
                  <Button variant="outline" onClick={handleSetSpreadsheetId}>
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
                      onClick={handleRepairDates}
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
                          This will overwrite your spreadsheet with the
                          app&apos;s current expenses, income, and totals. Your
                          sheet data will be replaced. This cannot be undone.
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

      <Card>
        <CardHeader>
          <CardTitle>Expense categories</CardTitle>
          <CardDescription>
            Comma-separated list. Used in dropdowns and rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            value={expenseList}
            onChange={(e) => setExpenseList(e.target.value)}
            placeholder="My Purchase, Tasnuva's Purchases, 50/50, Mortgage"
          />
          <Button variant="outline" size="sm" onClick={saveExpenseCategories}>
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income categories</CardTitle>
          <CardDescription>
            Comma-separated list for income entries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            value={incomeList}
            onChange={(e) => setIncomeList(e.target.value)}
            placeholder="Rent, Paycheck, Bonus, ..."
          />
          <Button variant="outline" size="sm" onClick={saveIncomeCategories}>
            Save
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
