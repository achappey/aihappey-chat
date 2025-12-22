import { useMemo } from "react";
import { toMarkdownLinkSmart } from "../files/markdown";
import { mcpResourceRuntime, useSelectedResources } from "../../../runtime/mcp/mcpResourceRuntime";

export function useResourceParts() {
  //const resourceResults = useAppStore((s) => s.resourceResults);
  var resourceResults = useSelectedResources(mcpResourceRuntime)
  return useMemo(() => {
    return [
      ...resourceResults.flatMap((r) =>
        r[1].contents.map((z: any) =>
          z.text
            ? {
                type: "text",
                text: toMarkdownLinkSmart(z.uri, z.text as string, z.mimeType),
              }
            : {
                type: "file",
                mediaType: z.mimeType,
                url: `data:${z.mimeType};base64,${z.blob}`,
              }
        )
      ),
    ];
  }, [resourceResults]);
}
