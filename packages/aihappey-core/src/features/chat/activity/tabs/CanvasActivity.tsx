import { CanvasCard } from "../content/CanvasCard";
import { useAppStore } from "aihappey-state";
import { ActionProvider, DataProvider, VisibilityProvider } from "@json-render/react";
import { ErrorBoundary } from "react-error-boundary";
import { Renderer } from "../../../json-render/Renderer";
import { componentRegistry } from "../../../json-render/ComponentRegistry";

export const CanvasActivity: React.FC<{
  groups?: { uri: string; versions: any[] }[];
  uiTree?: any;
}> = ({ groups, uiTree }) => {
  const activeData = useAppStore(s => s.activeData);
  
  return (
    <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 12 }}>
     <ErrorBoundary fallbackRender={(er) => "Something went wrong:" + er.error}>
          <DataProvider initialData={activeData ?? {}}>
            <VisibilityProvider>
              <ActionProvider>
                <Renderer tree={uiTree} registry={componentRegistry} />
              </ActionProvider>
            </VisibilityProvider>
          </DataProvider>
        </ErrorBoundary>

      {(groups ?? []).map((g) => (
        <CanvasCard key={g.uri} uri={g.uri} versions={g.versions} />
      ))}
    </div>
  );
};
