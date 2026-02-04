import { CanvasCard } from "../content/CanvasCard";
import { VercelAppCanvasBlock } from "../content/VercelAppCanvasBlock";
import { useMemo } from "react";
import { JsonRenderCanvasPanel } from "../content/JsonRenderCanvasPanel";
import { HtmlCanvasCard } from "../content/HtmlCanvasCard";

export const CanvasActivity: React.FC<{
  groups?: { uri: string; versions: any[] }[];
  htmlGroups?: { uri: string; versions: any[] }[];
  vercelGroups?: { uri: string; versions: any[] }[];
  uiTree?: any;
  uiOutput?: any;
}> = ({ groups, vercelGroups, uiTree, htmlGroups, uiOutput }) => {
  return (
    <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 12 }}>
      {uiTree ? (
        <JsonRenderCanvasPanel
          title="Live canvas"
          description="Streaming render"
          tree={uiTree}
          output={uiOutput ?? {}}
          allowSave={true}
        />
      ) : null}

      {(groups ?? []).map((g) => (
        <CanvasCard key={g.uri} uri={g.uri} versions={g.versions} />
      ))}

      {(htmlGroups ?? []).map((g) => (
        <HtmlCanvasCard key={g.uri} uri={g.uri} versions={g.versions} />
      ))}

      {uiTree == undefined && (vercelGroups ?? []).map((g) => (
        <VercelAppCanvasBlock key={g.uri} uri={g.uri} versions={g.versions} />
      ))}
    </div>

  );
};
