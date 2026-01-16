import { extractTextFromFile } from "../chat/files/file";
import { extractTextFromZip } from "../chat/files/fileConverters";

export type SpeechFileToTextFailure = {
  fileName: string;
  reason: string;
};

/**
 * Speech page behavior: convert selected files into plain text for the prompt.
 * - Supports the same formats as chat file extraction.
 * - For ZIP: extracts supported files inside and concatenates them.
 * - Returns concatenated text (joined with "\n\n") and a list of failures.
 */
export async function speechFilesToPromptText(files: File[]): Promise<{
  text?: string;
  failures: SpeechFileToTextFailure[];
}> {
  const parts: string[] = [];
  const failures: SpeechFileToTextFailure[] = [];

  for (const file of files) {
    try {
      const isZip = file.type === "application/zip" || /\.zip$/i.test(file.name);
      if (isZip) {
        const zipParts = await extractTextFromZip({ file });
        const combined = (zipParts ?? [])
          .map((p: any) => p?.text)
          .filter(Boolean)
          .join("\n\n")
          .trim();

        if (combined) parts.push(combined);
        else failures.push({ fileName: file.name, reason: "No text could be extracted" });

        continue;
      }

      const text = await extractTextFromFile(file);
      const trimmed = text?.trim();
      if (trimmed) parts.push(trimmed);
      else failures.push({
        fileName: file.name,
        reason: "Unsupported file type or empty content",
      });

    } catch {
      failures.push({ fileName: file.name, reason: "Failed to extract text" });
    }
  }

  const text = parts.join("\n\n").trim();
  return { text: text.length ? text : undefined, failures };
}

