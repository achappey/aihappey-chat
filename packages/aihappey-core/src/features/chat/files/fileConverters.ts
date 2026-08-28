import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { strFromU8, unzipSync } from "fflate";
import { toMarkdownLinkSmart } from "./markdown";
import { msgToPlainText } from "./msgConverter";

// Set up the PDF.js worker source
GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.mjs`;

/**
 * Converts a PDF File to plain text.
 * @param file PDF File object
 * @returns Promise<string> containing the extracted text
 */
export const pdfFileToText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = getDocument({
    data: new Uint8Array(arrayBuffer),
  });

  const pdf = await loadingTask.promise;

  try {
    const textParts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean)
        .join(" ");

      textParts.push(pageText);
    }

    return textParts.join("\n");
  } finally {
    await loadingTask.destroy();
  }
};

/**
 * Extracts all files from a ZIP File using fflate.
 * @param file ZIP File object
 * @returns Promise<Record<string, Uint8Array>> with filenames as keys and file contents as Uint8Array
 */

export const zipFileToFiles = async (
  file: Blob
): Promise<Record<string, Uint8Array>> => {
  if (!file || typeof (file as any).arrayBuffer !== "function") {
    // Keep this explicit: callers sometimes pass the attachment wrapper instead of the actual File/Blob.
    // Returning a clearer error makes the root cause obvious in the console.
    throw new TypeError(
      "zipFileToFiles(file): expected a File/Blob with arrayBuffer(); got " +
      Object.prototype.toString.call(file)
    );
  }
  const arrayBuffer = await file.arrayBuffer();
  const files = unzipSync(new Uint8Array(arrayBuffer));
  return files;
};

/**
 * Converts a DOCX File to plain text using Mammoth.
 * @param file DOCX File object
 * @returns Promise<string> containing the extracted plain text
 */
export const docxFileToText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value;
};

/**
 * Converts an Excel File (XLSX/XLS/CSV) to plain text (CSV).
 * @param file Excel File object
 * @returns Promise<string> containing the extracted text in CSV format
 */
export const excelFileToText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const allText: string[] = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return `--- Sheet: ${sheetName} ---\n${csv.trim()}\n`;
  });

  return allText.join("\n");
};

/**
 * Converts a PPTX PowerPoint file to plain text by extracting all text from slides.
 * @param file PPTX File object
 * @returns Promise<string> containing all slide text
 */
export const pptxFileToText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const files = unzipSync(new Uint8Array(arrayBuffer));
  let text = "";

  // Vind alle slides: 'ppt/slides/slide1.xml', etc.
  const slideFiles = Object.entries(files).filter(([filename]) =>
    /^ppt\/slides\/slide\d+\.xml$/i.test(filename)
  );

  for (const [filename, data] of slideFiles) {
    const xmlString = strFromU8(data);
    // <a:t> bevat tekstfragmenten in een slide
    const matches = Array.from(xmlString.matchAll(/<a:t>(.*?)<\/a:t>/g));
    for (const match of matches) {
      text += match[1].trim() + "\n";
    }
    text += "\n"; // scheiding tussen slides
  }

  return text.trim();
};

export const epubFileToTextBrute = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const files = unzipSync(new Uint8Array(arrayBuffer));
  let text = "";

  // Optionally: parse toc.ncx or content.opf for real order
  // But here: just process all HTML-ish files
  for (const [filename, data] of Object.entries(files)) {
    if (/\.(xhtml|html|htm)$/i.test(filename)) {
      const htmlString = strFromU8(data);
      const doc = new DOMParser().parseFromString(htmlString, "text/html");
      // Pak alle zichtbare tekst uit <p>, <div>, <h1>...<h6>
      const tags = ["p", "div", "span", "h1", "h2", "h3", "h4", "h5", "h6"];
      for (const tag of tags) {
        doc.querySelectorAll(tag).forEach((node) => {
          const t = node.textContent?.trim();
          if (t) text += t + "\n";
        });
      }
    }
  }
  return text.trim();
};


export const emlToPlainText = (emlText: string): string => {
  // Zoek alleen text/plain, negeer alle attachments/images
  const plainMatch = emlText.match(/Content-Type:\s*text\/plain[^]*?\r?\n\r?\n([^]*?)(?=\r?\n--|\r?\nContent-Type:|$)/i);
  if (plainMatch) return plainMatch[1].trim();

  // Anders: probeer text/html en strip tags
  const htmlMatch = emlText.match(/Content-Type:\s*text\/html[^]*?\r?\n\r?\n([^]*?)(?=\r?\n--|\r?\nContent-Type:|$)/i);
  if (htmlMatch) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlMatch[1];
    return tempDiv.textContent || tempDiv.innerText || "";
  }

  // Fallback: alles na de headers
  const parts = emlText.split(/\r?\n\r?\n/);
  return parts.slice(1).join("\n\n").trim();
};



// Extracts all supported files in a ZIP and returns array of text parts
export const extractTextFromZip = async (
  a: any,
) => {
  // Historically some call sites passed `{ file }`, while chat attachments are raw `File` objects.
  // Accept both shapes to avoid runtime crashes.
  const candidate = (a && (a.file ?? a)) as unknown;
  const file =
    typeof Blob !== "undefined" && candidate instanceof Blob
      ? candidate
      : undefined;

  if (!file) {
    console.warn(
      "extractTextFromZip(): expected File/Blob or {file: File/Blob}; got",
      a
    );
    return [];
  }

  let files: Record<string, Uint8Array>;
  try {
    files = await zipFileToFiles(file);
  } catch (e) {
    console.error("extractTextFromZip(): failed to unzip", e);
    return [];
  }
  const textParts: any[] = [];

  for (const [filename, data] of Object.entries(files)) {
    // fflate includes directory entries like "folder/"; skip them.
    if (filename.endsWith("/")) continue;
    const ext = filename.split('.').pop()?.toLowerCase();

    // Maak altijd een echte Uint8Array, zodat File in browser werkt:
    let blobPart: BlobPart;
    if (typeof data === "string") {
      blobPart = data;
    } else {
      blobPart = new Uint8Array(data); // werkt voor alles wat binary is (ook ArrayBufferLike, etc)
    }

    const f = new File([blobPart], filename);

    let text: string | undefined;
    try {
      if (ext === "pdf") text = await pdfFileToText(f);
      else if (ext === "docx") text = await docxFileToText(f);
      else if (["xlsx", "xls", "csv"].includes(ext || "")) text = await excelFileToText(f);
      else if (["txt", "md", "log"].includes(ext || "")) text = await f.text();
      else if (["pptx"].includes(ext || "")) text = await pptxFileToText(f);
      else if (["msg"].includes(ext || "")) text = await msgToPlainText(f)
    } catch (e) {
      console.warn(`extractTextFromZip(): failed to convert ${filename} to text`, e);
      text = undefined;
    }

    if (text) {
      textParts.push({
        name: filename,
        type: "text",
        text: toMarkdownLinkSmart(filename, text)
      });
    }
  }
  return textParts;
};
