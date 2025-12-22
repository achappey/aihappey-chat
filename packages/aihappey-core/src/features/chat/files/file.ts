import { marked } from "marked";
import {
  docxFileToText, emlToPlainText, epubFileToTextBrute,
  excelFileToText, msgFileToPlainText, pdfFileToText, pptxFileToText
} from "./fileConverters";

/**
 * Converts a File to a Data URL string.
 * @param file File object
 * @returns Promise<string> Data URL
 */
export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Utility to extract text from supported file types
export const extractTextFromFile = async (a: File): Promise<string | undefined> => {
  //const file = a.file as File;
  const name = a.name || "";
  const type = a.type || "";

  // Prefer mimetype, fallback to extension
  if (type === "application/pdf" || /\.pdf$/i.test(name)) {
    return await pdfFileToText(a);
  }
  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    /\.docx$/i.test(name)
  ) {
    return await docxFileToText(a);
  }
  if (
    type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    type === "application/vnd.ms-excel" ||
    /\.xlsx$/i.test(name) || /\.xls$/i.test(name) || /\.csv$/i.test(name)
  ) {
    return await excelFileToText(a);
  }
  if (
    type === "application/epub+zip" || /\.epub$/i.test(name)
  ) {
    return await epubFileToTextBrute(a);
  }

  if (
    type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    /\.pptx$/i.test(name)
  ) {
    return await pptxFileToText(a); // this function uses PptxParser as shown previously
  }

  if (type === "text/plain" || /\.txt$/i.test(name)) {
    // Plain text file, just read as string
    return await a.text();
  }

  if (type === "message/rfc822" || (!type && name.toLowerCase().endsWith(".eml"))) {
    // Plain text file, just read as string
    var text = await a.text();
    return emlToPlainText(text);
  }

  if (type === "application/vnd.ms-outlook" || (!type && name.toLowerCase().endsWith(".msg"))) {
    return await msgFileToPlainText(a);
  }

  // Other: not supported, return undefined
  return undefined;
};


export function downloadBase64Image(base64Data: string, filename: string = "image.png") {
  // Create a link element
  const link = document.createElement("a");
  // Set the download attribute with the desired filename
  link.download = filename;
  // Set the href to the base64 image data
  link.href = base64Data;
  // Append, click, and remove the link
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const copyMarkdownToClipboard = async (markdown: string) => {
  if (markdown) {
    const html = await marked(markdown);
    const blob = new Blob([html], { type: "text/html" });
    const textBlob = new Blob([markdown], { type: "text/plain" });
    const data = [
      new ClipboardItem({ "text/html": blob, "text/plain": textBlob }),
    ];
    await navigator.clipboard.write(data);
  }
}
