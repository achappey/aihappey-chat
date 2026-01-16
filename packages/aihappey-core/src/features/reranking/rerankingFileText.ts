import { extractTextFromFile } from "../chat/files/file";
import { extractTextFromZip, zipFileToFiles } from "../chat/files/fileConverters";
import mime from "mime";

export type ExtractedText = {
  fileName: string;
  text: string;
  file: File;
};

export type ExtractTextResult = {
  extracted: ExtractedText[];
  failedFileNames: string[];
};

export async function extractTextFromFileOrZip(file: File): Promise<ExtractTextResult> {
  const isZip = file.type === "application/zip" || /\.zip$/i.test(file.name);
  if (isZip) {
    // We need both: (a) extracted text and (b) original bytes for download.
    // `extractTextFromZip` only returns text parts, so we also unzip ourselves.
    const [parts, zipEntries] = await Promise.all([
      extractTextFromZip({ file }),
      zipFileToFiles(file),
    ]);

    const extracted: ExtractedText[] = (parts ?? [])
      .map((p: any) => {
        const fileName = String(p?.name ?? file.name);
        const text = String(p?.text ?? "").trim();

        const entry = (zipEntries as any)?.[fileName] as Uint8Array | string | undefined;
        const blobPart: BlobPart | undefined =
          typeof entry === "string" ? entry : entry ? new Uint8Array(entry as any) : undefined;

        const type = (mime.getType(fileName) as string) || "application/octet-stream";
        const f = new File([blobPart ?? ""], fileName, { type });

        return { fileName, text, file: f };
      })
      .filter((p) => p.text.length > 0);

    // Anything in the zip we didn't extract text for is considered failed.
    const extractedNames = new Set(extracted.map((e) => e.fileName));
    const failedFileNames = Object.keys(zipEntries ?? {}).filter(
      (n) => !n.endsWith("/") && !extractedNames.has(n)
    );

    return { extracted, failedFileNames };
  }
 
  const text = await extractTextFromFile(file);
  const trimmed = text?.trim();
  if (!trimmed) return { extracted: [], failedFileNames: [file.name] };
  return { extracted: [{ fileName: file.name, text: trimmed, file }], failedFileNames: [] };
}

