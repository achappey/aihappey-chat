import { useState } from "react";
import { useAppStore } from "aihappey-state";
import type { Resource, ResourceTemplate } from "@modelcontextprotocol/sdk/types";

export type SelectedResource = {
  serverKey: string;
  resource: Resource;
};

export type SelectedResourceTemplate = {
  serverKey: string;
  resourceTemplate: ResourceTemplate;
};

export function useResourceSelect() {
  const [open, setOpen] = useState(false);
  const mcpServerContent = useAppStore((s) => s.mcpServerContent);
  const index = Object.entries(mcpServerContent).flatMap(
    ([serverKey, content]) =>
      (content.resources ?? []).map((resource) => ({
        resource,
        serverKey,
      }))
  );

  const templateIndex = Object.entries(mcpServerContent).flatMap(
    ([serverKey, content]) =>
      (content.resourceTemplates ?? []).map((resourceTemplate) => ({
        resourceTemplate,
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

  const resourceTemplates = templateIndex
    .map((x) => x.resourceTemplate)
    .filter(
      (r) =>
        !r.annotations ||
        (r.annotations as any)?.audience?.includes("user")
    );


  return {
    open,
    setOpen,
    resources,
    resourceTemplates,
    hasResources: resources.length > 0 || resourceTemplates.length > 0,
    resolve(uri: string): SelectedResource | undefined {
      return index.find((x) => x.resource.uri === uri);
    },
    resolveTemplate(uriTemplate: string): SelectedResourceTemplate | undefined {
      return templateIndex.find((x) => x.resourceTemplate.uriTemplate === uriTemplate);
    },
  };
}
