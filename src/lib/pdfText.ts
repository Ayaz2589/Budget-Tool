/**
 * Extract plain text from a PDF using PDF.js. Used for Chase statement parsing
 * (Chase provides PDF statements only, no CSV).
 */
import * as pdfjsLib from "pdfjs-dist";

// Configure worker for Vite so the worker file is resolved and copied to output
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
}

export async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = doc.numPages;
  const parts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .filter(Boolean);
    // Join with space to preserve word boundaries; items are often word-by-word
    parts.push(strings.join(" "));
  }

  return parts.join("\n");
}
