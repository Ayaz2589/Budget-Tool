import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createOrthoFolder,
  createSheetInFolder,
  findOrthoFolder,
  listSheetsInFolder,
  ORTHO_SHEET_NAME,
} from "@/lib/google/googleDrive";
import { extractSpreadsheetId } from "genjutsu-db";
import { storage, STORAGE_KEYS } from "@/lib/platform/storage";
import type { GoogleAuthContextValue } from "@/types/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SheetSetupState = GoogleAuthContextValue["sheetSetupState"];
export type DriveSheetEntry = { id: string; name: string; modifiedTime?: string };

export interface SheetSetupContextValue {
  spreadsheetId: string | null;
  setSpreadsheetId: (id: string | null) => void;
  sheetSetupState: SheetSetupState;
  availableDriveSheets: DriveSheetEntry[];
  runSheetAutoSetup: () => Promise<void>;
  linkDriveSheet: (id: string) => void;
  createOrthoDriveSheet: () => Promise<void>;
  dismissSheetSetupPrompt: () => void;
  /** True when a sheet was just created and an initial sync should fire. */
  consumeInitialSyncFlag: () => boolean;
}

const SheetSetupContext = createContext<SheetSetupContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SheetSetupProvider({
  children,
  accessToken,
  onSessionClear,
}: {
  children: ReactNode;
  accessToken: string | null;
  /** Called when the provider resets sheet-related state (e.g. linked sheet
   *  turns out to be in trash).  The parent auth provider can react to this. */
  onSessionClear?: () => void;
}) {
  const [spreadsheetId, setSpreadsheetIdState] = useState<string | null>(
    () => storage.getItem(STORAGE_KEYS.SPREADSHEET_ID),
  );
  const [sheetSetupState, setSheetSetupState] =
    useState<SheetSetupState>("idle");
  const [availableDriveSheets, setAvailableDriveSheets] = useState<
    DriveSheetEntry[]
  >([]);
  const [sheetSetupDismissed, setSheetSetupDismissed] = useState(false);
  const sheetSetupRanForSessionRef = useRef(false);
  const orthoFolderIdRef = useRef<string | null>(null);
  const initialSyncAfterCreateRef = useRef(false);

  // Persist spreadsheet ID
  useEffect(() => {
    if (spreadsheetId) {
      storage.setItem(STORAGE_KEYS.SPREADSHEET_ID, spreadsheetId);
    } else {
      storage.removeItem(STORAGE_KEYS.SPREADSHEET_ID);
    }
  }, [spreadsheetId]);

  const setSpreadsheetId = useCallback((id: string | null) => {
    if (id) {
      const extracted = id.includes("/") ? extractSpreadsheetId(id) : id;
      setSpreadsheetIdState(extracted || id);
      setSheetSetupState("done");
      setAvailableDriveSheets([]);
      setSheetSetupDismissed(false);
      sheetSetupRanForSessionRef.current = true;
    } else {
      setSpreadsheetIdState(null);
      setSheetSetupState("idle");
      setAvailableDriveSheets([]);
      setSheetSetupDismissed(false);
      sheetSetupRanForSessionRef.current = false;
      orthoFolderIdRef.current = null;
      initialSyncAfterCreateRef.current = false;
    }
  }, []);

  const dismissSheetSetupPrompt = useCallback(() => {
    setSheetSetupDismissed(true);
    setSheetSetupState("idle");
    setAvailableDriveSheets([]);
  }, []);

  const linkDriveSheet = useCallback(
    (id: string) => {
      setSpreadsheetId(id);
      setSheetSetupState("done");
      setSheetSetupDismissed(false);
    },
    [setSpreadsheetId],
  );

  const runSheetAutoSetup = useCallback(async () => {
    if (!accessToken || spreadsheetId) return;
    setSheetSetupState("loading");
    setAvailableDriveSheets([]);
    try {
      const folder = await findOrthoFolder(accessToken);
      if (!folder) {
        orthoFolderIdRef.current = null;
        setSheetSetupState("needs-create");
        return;
      }
      orthoFolderIdRef.current = folder.id;
      const sheets = await listSheetsInFolder(accessToken, folder.id);
      if (sheets.length > 0) {
        setAvailableDriveSheets(sheets);
        setSheetSetupState("needs-selection");
      } else {
        setSheetSetupState("needs-create");
      }
    } catch {
      setSheetSetupState("error");
    }
  }, [accessToken, spreadsheetId]);

  const createOrthoDriveSheet = useCallback(async () => {
    if (!accessToken || spreadsheetId) return;
    setSheetSetupState("creating");
    try {
      let folderId = orthoFolderIdRef.current;
      if (!folderId) {
        const folder = await createOrthoFolder(accessToken);
        folderId = folder.id;
        orthoFolderIdRef.current = folder.id;
      }
      const created = await createSheetInFolder(
        accessToken,
        folderId,
        ORTHO_SHEET_NAME,
      );
      initialSyncAfterCreateRef.current = true;
      setSpreadsheetId(created.id);
      setSheetSetupState("done");
      setSheetSetupDismissed(false);
    } catch {
      setSheetSetupState("error");
    }
  }, [accessToken, spreadsheetId, setSpreadsheetId]);

  // Auto-run sheet setup on sign-in when no sheet is linked
  useEffect(() => {
    if (!accessToken) {
      sheetSetupRanForSessionRef.current = false;
      return;
    }
    if (spreadsheetId) return;
    if (sheetSetupDismissed) return;
    if (sheetSetupRanForSessionRef.current) return;
    sheetSetupRanForSessionRef.current = true;
    void runSheetAutoSetup();
  }, [accessToken, spreadsheetId, sheetSetupDismissed, runSheetAutoSetup]);

  const consumeInitialSyncFlag = useCallback(() => {
    if (initialSyncAfterCreateRef.current) {
      initialSyncAfterCreateRef.current = false;
      return true;
    }
    return false;
  }, []);

  /** Reset all sheet-setup state (called by parent on sign-out). */
  const resetOnSignOut = useCallback(() => {
    setSheetSetupState("idle");
    setAvailableDriveSheets([]);
    setSheetSetupDismissed(false);
    sheetSetupRanForSessionRef.current = false;
    orthoFolderIdRef.current = null;
    initialSyncAfterCreateRef.current = false;
  }, []);

  // Expose reset for parent via ref (not part of public context value)
  const _resetRef = useRef(resetOnSignOut);
  _resetRef.current = resetOnSignOut;

  // If onSessionClear changes, we don't need to do anything with it directly
  // It's used by the parent component, not by this provider
  void onSessionClear;

  const value = useMemo<SheetSetupContextValue>(
    () => ({
      spreadsheetId,
      setSpreadsheetId,
      sheetSetupState,
      availableDriveSheets,
      runSheetAutoSetup,
      linkDriveSheet,
      createOrthoDriveSheet,
      dismissSheetSetupPrompt,
      consumeInitialSyncFlag,
    }),
    [
      spreadsheetId,
      setSpreadsheetId,
      sheetSetupState,
      availableDriveSheets,
      runSheetAutoSetup,
      linkDriveSheet,
      createOrthoDriveSheet,
      dismissSheetSetupPrompt,
      consumeInitialSyncFlag,
    ],
  );

  return (
    <SheetSetupContext.Provider value={value}>
      {children}
    </SheetSetupContext.Provider>
  );
}

export function useSheetSetup() {
  const ctx = useContext(SheetSetupContext);
  if (!ctx)
    throw new Error("useSheetSetup must be used within SheetSetupProvider");
  return ctx;
}
