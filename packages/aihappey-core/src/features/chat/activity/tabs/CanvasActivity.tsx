import { CanvasCard } from "../content/CanvasCard";
import { VercelAppCanvasBlock } from "../content/VercelAppCanvasBlock";
import { useAppStore } from "aihappey-state";
import { ActionProvider, DataProvider, VisibilityProvider } from "@json-render/react";
import { ErrorBoundary } from "react-error-boundary";
import { Renderer } from "../../../json-render/Renderer";
import { useMemo } from "react";
import { useCombinedComponentRegistryForIds } from "../../../json-render/ComponentRegistry";
import { useJsonRenderRegistry } from "aihappey-json-render-registry";

export const CanvasActivity: React.FC<{
  groups?: { uri: string; versions: any[] }[];
  vercelGroups?: { uri: string; versions: any[] }[];
  uiTree?: any;
}> = ({ groups, vercelGroups, uiTree }) => {
  const activeData = useAppStore(s => s.activeData);
  const defaultRegistries = useAppStore((s) => (s as any).defaultRegistries as string | undefined);
  const jsonRenderRegistry = useJsonRenderRegistry();

  const availableRegistryIds = useMemo(() => {
    const ids = new Set<string>();
    ids.add("app");
    for (const item of jsonRenderRegistry.items ?? []) {
      if (item?.registryId) ids.add(item.registryId);
    }
    return Array.from(ids);
  }, [jsonRenderRegistry.items]);

  const registryIds = useMemo(() => {
    const raw = String(defaultRegistries ?? "").trim();
    if (!raw) return availableRegistryIds;
    const tokens = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const includeAll = tokens.some((t) => t.toLowerCase() === "all");
    if (includeAll) return availableRegistryIds;
    const allowed = tokens.filter((t) => availableRegistryIds.includes(t));
    return allowed.length ? allowed : availableRegistryIds;
  }, [defaultRegistries, availableRegistryIds]);

  const { registry, actionHandlers } = useCombinedComponentRegistryForIds(registryIds);

  return (


    <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 12 }}>
      <ErrorBoundary fallbackRender={(er) => "Something went wrong:" + er.error}>
        <DataProvider initialData={activeData ?? {}}>
          <VisibilityProvider>
            <ActionProvider handlers={actionHandlers}>
              <Renderer tree={uiTree} registry={registry} />
            </ActionProvider>
          </VisibilityProvider>
        </DataProvider>
      </ErrorBoundary>


      {(groups ?? []).map((g) => (
        <CanvasCard key={g.uri} uri={g.uri} versions={g.versions} />
      ))}

      {uiTree == undefined && (vercelGroups ?? []).map((g) => (
        <VercelAppCanvasBlock key={g.uri} uri={g.uri} versions={g.versions} />
      ))}
    </div>

  );
};
