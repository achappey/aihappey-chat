/**
 * Converts a URI and text into a smart markdown link, with optional collapsing and formatting
 * based on mime type and content length.
 */
export const toMarkdownLinkSmart = (
  uri: string,
  text: string,
  mimeType: string = "text/plain"
): string => {
  const linkBack = uri?.startsWith("http") ? `\n\n[${uri}](${uri})` : "";
  const wrapInDetails = (link: string, body: string) =>
    `<details><summary>${link}</summary>\n\n${body}\n\n</details>${linkBack}`;
  const shouldCollapse = text.length > 500 || text.split("\n").length > 15;

  switch (true) {
    case mimeType === "application/json": {
      try {
        const pretty = JSON.stringify(JSON.parse(text), null, 2);
        return wrapInDetails(uri, `\`\`\`json\n${pretty}\n\`\`\``);
      } catch {
        // Invalid JSON, so continue to next checks
      }
      // Note: No break; will fall through!
    }
    case mimeType === "application/xml":
    case mimeType === "text/xml":
      return wrapInDetails(uri, `\`\`\`xml\n${text}\n\`\`\``);

    case mimeType === "text/markdown":
      return shouldCollapse ? wrapInDetails(uri, text) : `${uri}\n\n${text}`;

    case mimeType.startsWith("text/"):
    case mimeType === "text/plain":
      return shouldCollapse
        ? wrapInDetails(uri, `\`\`\`\n${text}\n\`\`\``)
        : `${uri}\n\n${text}`;

    default:
      return wrapInDetails(uri, `\`\`\`\n${text}\n\`\`\``);
  }
};
