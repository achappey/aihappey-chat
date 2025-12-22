import { useState } from "react";
import { useAppStore } from "aihappey-state";
import { useTheme } from "aihappey-components";
import { ResourceSelectModal } from "./ResourceSelectModal";
import { readResource } from "../../runtime/mcp/readResource";
import { mcpResourceRuntime } from "../../runtime/mcp/mcpResourceRuntime";

type ResourceSelectButtonProps = {};

export const ResourceSelectButton = ({ }: ResourceSelectButtonProps) => {
  const { Button } = useTheme();
  const mcpServerContent = useAppStore((s) => s.mcpServerContent);
  const [open, setOpen] = useState(false);
  const allResources = Object.keys(mcpServerContent)
    .flatMap(z => mcpServerContent[z].resources ?? [])
    .filter(z => !z.annotations
      || (z.annotations as any)["audience"]?.includes("user"));

  const resourceIndex = Object.entries(mcpServerContent)
    .flatMap(([serverKey, content]) =>
      (content.resources ?? []).map(r => ({
        resource: r,
        serverKey,
      }))
    );

  if (allResources.length === 0) return null;

  return (
    <>
      <Button
        type="button"
        icon="resources"
        size="large"
        variant="transparent"
        onClick={() => setOpen(true)}
        title="Insert Resource"
      />

      <ResourceSelectModal
        open={open}
        resources={allResources}
        onSelect={async (uri) => {
          setOpen(false);

          const hit = resourceIndex.find(r => r.resource.uri === uri);
          if (!hit) return;

          const result = await readResource(hit.serverKey, uri);

          mcpResourceRuntime.add(hit.resource, result)
        }}

        onHide={() => setOpen(false)}
      />

    </>
  );
};
