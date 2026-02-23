const DRIVE_API = "https://www.googleapis.com/drive/v3/files";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

export const ORTHO_FOLDER_NAME = "Ortho";
export const ORTHO_SHEET_NAME = "Ortho Budget";

export type DriveFolder = { id: string; name: string };
export type DriveSheetFile = { id: string; name: string; modifiedTime?: string };

async function driveRequest<T>(
  accessToken: string,
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive API failed: ${res.status} ${body}`);
  }
  return (await res.json()) as T;
}

type DriveListResponse = {
  files?: Array<{ id?: string; name?: string; modifiedTime?: string }>;
};

export async function findOrthoFolder(
  accessToken: string,
): Promise<DriveFolder | null> {
  const params = new URLSearchParams({
    q: `mimeType='application/vnd.google-apps.folder' and name='${ORTHO_FOLDER_NAME}' and trashed=false`,
    fields: "files(id,name,modifiedTime)",
    orderBy: "modifiedTime desc",
    pageSize: "20",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const data = await driveRequest<DriveListResponse>(
    accessToken,
    `${DRIVE_API}?${params.toString()}`,
  );
  const folder = data.files?.find((f) => f.id && f.name);
  if (!folder?.id || !folder.name) return null;
  return { id: folder.id, name: folder.name };
}

export async function createOrthoFolder(
  accessToken: string,
): Promise<DriveFolder> {
  const data = await driveRequest<{ id?: string; name?: string }>(
    accessToken,
    DRIVE_API,
    {
      method: "POST",
      body: JSON.stringify({
        name: ORTHO_FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder",
      }),
    },
  );
  if (!data.id || !data.name) {
    throw new Error("Drive API failed: could not create Ortho folder");
  }
  return { id: data.id, name: data.name };
}

export async function listSheetsInFolder(
  accessToken: string,
  folderId: string,
): Promise<DriveSheetFile[]> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: "files(id,name,modifiedTime)",
    orderBy: "modifiedTime desc",
    pageSize: "100",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const data = await driveRequest<DriveListResponse>(
    accessToken,
    `${DRIVE_API}?${params.toString()}`,
  );
  return (data.files ?? [])
    .filter((f): f is { id: string; name: string; modifiedTime?: string } =>
      Boolean(f.id && f.name),
    )
    .map((f) => ({ id: f.id, name: f.name, modifiedTime: f.modifiedTime }));
}

async function getDriveParents(
  accessToken: string,
  fileId: string,
): Promise<string[]> {
  const params = new URLSearchParams({
    fields: "parents",
    supportsAllDrives: "true",
  });
  const data = await driveRequest<{ parents?: string[] }>(
    accessToken,
    `${DRIVE_API}/${fileId}?${params.toString()}`,
  );
  return Array.isArray(data.parents) ? data.parents : [];
}

async function moveFileToFolder(
  accessToken: string,
  fileId: string,
  folderId: string,
): Promise<void> {
  const parents = await getDriveParents(accessToken, fileId);
  const params = new URLSearchParams({
    addParents: folderId,
    removeParents: parents.join(","),
    fields: "id,parents",
    supportsAllDrives: "true",
  });
  await driveRequest(
    accessToken,
    `${DRIVE_API}/${fileId}?${params.toString()}`,
    { method: "PATCH", body: JSON.stringify({}) },
  );
}

export async function createSheetInFolder(
  accessToken: string,
  folderId: string,
  sheetName: string,
): Promise<{ id: string; name: string }> {
  const createRes = await fetch(SHEETS_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { title: sheetName },
    }),
  });
  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(`Sheets API failed: ${createRes.status} ${body}`);
  }
  const data = (await createRes.json()) as {
    spreadsheetId?: string;
    properties?: { title?: string };
  };
  if (!data.spreadsheetId) {
    throw new Error("Sheets API failed: spreadsheet id missing");
  }
  await moveFileToFolder(accessToken, data.spreadsheetId, folderId);
  return {
    id: data.spreadsheetId,
    name: data.properties?.title || sheetName,
  };
}

export async function findOrCreateOrthoSheet(
  accessToken: string,
): Promise<{
  folderId: string;
  sheets: DriveSheetFile[];
  created?: boolean;
  sheetId?: string;
}> {
  let folder = await findOrthoFolder(accessToken);
  if (!folder) {
    folder = await createOrthoFolder(accessToken);
  }
  const sheets = await listSheetsInFolder(accessToken, folder.id);
  if (sheets.length > 0) {
    return { folderId: folder.id, sheets };
  }
  const createdSheet = await createSheetInFolder(
    accessToken,
    folder.id,
    ORTHO_SHEET_NAME,
  );
  return {
    folderId: folder.id,
    sheets: [{ id: createdSheet.id, name: createdSheet.name }],
    created: true,
    sheetId: createdSheet.id,
  };
}

export async function isSpreadsheetActive(
  accessToken: string,
  spreadsheetId: string,
): Promise<boolean> {
  const params = new URLSearchParams({
    fields: "id,mimeType,trashed",
    supportsAllDrives: "true",
  });
  try {
    const data = await driveRequest<{
      id?: string;
      mimeType?: string;
      trashed?: boolean;
    }>(accessToken, `${DRIVE_API}/${spreadsheetId}?${params.toString()}`);
    return (
      Boolean(data.id) &&
      data.mimeType === "application/vnd.google-apps.spreadsheet" &&
      data.trashed !== true
    );
  } catch {
    return false;
  }
}
