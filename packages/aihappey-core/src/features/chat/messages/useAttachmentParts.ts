import { fileAttachmentRuntime, useFileAttachments } from "../../../runtime/files/fileAttachmentRuntime";
import { extractTextFromFile } from "../files/file";
import { extractTextFromZip } from "../files/fileConverters";
import { toMarkdownLinkSmart } from "../files/markdown";

export const useAttachmentParts = () => {
  const attachments = useFileAttachments(fileAttachmentRuntime)
  const getItems = async () => {
    const textAttachments: any[] = [];
    for (const a of attachments) {
      if (a.type === "application/zip" || /\.zip$/i.test(a.name)) {
        textAttachments.push(...(await extractTextFromZip(a)));
      } else {
        const text = await extractTextFromFile(a);
        if (text) {
          textAttachments.push({
            type: "text",
            text: toMarkdownLinkSmart(a.name, text, a.type),
          });
        }
      }
    }
    return textAttachments;
  };

  return getItems
};
