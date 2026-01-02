import { useMemo, useState } from "react";
import { useAppStore } from "aihappey-state";
import type { Resource } from "@modelcontextprotocol/sdk/types";

export type SelectedResource = {
  serverKey: string;
  resource: Resource;
};

export function useResourceSelect() {
  const [open, setOpen] = useState(false);
  const mcpServerContent = useAppStore((s) => s.mcpServerContent);

  const { resources, index } = useMemo(() => {
    const index = Object.entries(mcpServerContent).flatMap(
      ([serverKey, content]) =>
        (content.resources ?? []).map((resource) => ({
          resource,
          serverKey,
        }))
    );

    const resources = index
      .map((x) => x.resource)
      .filter(
        (r) =>
          !r.annotations ||
          (r.annotations as any)?.audience?.includes("user")
      );

    return { resources, index };
  }, [mcpServerContent]);

  return {
    open,
    setOpen,
    resources,
    resolve(uri: string): SelectedResource | undefined {
      return index.find((x) => x.resource.uri === uri);
    },
  };
}
