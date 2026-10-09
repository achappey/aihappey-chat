import { isInlineDecisionImage, MAX_DECISION_IMAGES, type DecisionInput } from "aihappey-decisions";
import { extractTextFromFile } from "../chat/files/file";
import { extractTextFromZip } from "../chat/files/fileConverters";

export type DecisionImage = { id: string; name: string; image_url: string };
export type DecisionDocument = { id: string; name: string; text: string };
type AttachmentFailure = {
  name: string;
  reason: "imageLimit" | "unsupportedImage" | "imageReadFailed" | "unsupportedDocument" | "documentEmpty" | "documentReadFailed";
};

function readInlineImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" && isInlineDecisionImage(reader.result) ? resolve(reader.result) : reject(new Error("Invalid image"));
    reader.onerror = () => reject(reader.error);
    reader.onabort = () => reject(new Error("Image read aborted"));
    reader.readAsDataURL(file);
  });
}

/** Documents are evidence only after successful text extraction; never fall back to native files. */
export async function prepareDecisionAttachments(files: File[], imageCount: number) {
  const images: DecisionImage[] = [];
  const documents: DecisionDocument[] = [];
  const failures: AttachmentFailure[] = [];
  for (const file of files) {
    if (file.type.startsWith("image/")) {
      if (!/^image\/(png|jpeg|webp|gif)$/i.test(file.type)) {
        failures.push({ name: file.name, reason: "unsupportedImage" });
        continue;
      }
      if (imageCount + images.length >= MAX_DECISION_IMAGES) {
        failures.push({ name: file.name, reason: "imageLimit" });
        continue;
      }
      try { images.push({ id: crypto.randomUUID(), name: file.name, image_url: await readInlineImage(file) }); }
      catch { failures.push({ name: file.name, reason: "imageReadFailed" }); }
      continue;
    }
    try {
      const text = file.type === "application/zip" || /\.zip$/i.test(file.name)
        ? (await extractTextFromZip(file)).map(part => typeof part.text === "string" ? part.text : "").filter(text => text.trim()).join("\n\n")
        : await extractTextFromFile(file);
      if (text === undefined) failures.push({ name: file.name, reason: "unsupportedDocument" });
      else if (!text.trim()) failures.push({ name: file.name, reason: "documentEmpty" });
      else documents.push({ id: crypto.randomUUID(), name: file.name, text });
    } catch { failures.push({ name: file.name, reason: "documentReadFailed" }); }
  }
  return { images, documents, failures };
}

export function composeDecisionInput(prompt: string, images: DecisionImage[], documents: DecisionDocument[]): DecisionInput {
  if (!images.length && !documents.length) return prompt;
  return [{ role: "user", content: [
    ...(prompt.trim() ? [{ type: "input_text", text: prompt }] : []),
    ...documents.map(document => ({ type: "input_text", text: `Document: ${document.name}\n\n${document.text}` })),
    ...images.map(image => ({ type: "input_image", image_url: image.image_url, detail: "auto" })),
  ] }];
}
