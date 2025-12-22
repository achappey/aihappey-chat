import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { strFromU8, unzipSync } from "fflate";
import { toMarkdownLinkSmart } from "./markdown";
import MSGReaderRaw from "msgreader";

const MSGReader = (MSGReaderRaw as any).MSGReader || MSGReaderRaw;

// Set up the PDF.js worker source
GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.mjs`;

/**
 * Converts a PDF File to plain text.
 * @param file PDF File object
 * @returns Promise<string> containing the extracted text
 */
export const pdfFileToText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  let text = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(" ") + "\n";
  }

  return text;
};

/**
 * Extracts all files from a ZIP File using fflate.
 * @param file ZIP File object
 * @returns Promise<Record<string, Uint8Array>> with filenames as keys and file contents as Uint8Array
 */

export const zipFileToFiles = async (
  file: File
): Promise<Record<string, Uint8Array>> => {
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


export const msgFileToPlainText = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const reader = new MSGReader(buffer);
  const msg = reader.getFileData();

  if (msg.body) return msg.body;
  if (msg.bodyHTML) {
    const div = document.createElement("div");
    div.innerHTML = msg.bodyHTML;
    return div.textContent || div.innerText || "";
  }
  return "";
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
export const extractTextFromZip = async (a: any) => {
  const file = a.file as File;
  const files = await zipFileToFiles(file);
  const textParts: any[] = [];

  for (const [filename, data] of Object.entries(files)) {
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
    if (ext === "pdf") text = await pdfFileToText(f);
    else if (ext === "docx") text = await docxFileToText(f);
    else if (["xlsx", "xls", "csv"].includes(ext || "")) text = await excelFileToText(f);
    else if (["txt", "md", "log"].includes(ext || "")) text = await f.text();

    if (text) {
      textParts.push({
        type: "text",
        text: toMarkdownLinkSmart(filename, text)
      });
    }
  }
  return textParts;
};