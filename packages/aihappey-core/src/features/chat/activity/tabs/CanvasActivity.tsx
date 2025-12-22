import { CanvasCard } from "../content/CanvasCard";

export const CanvasActivity: React.FC<{ groups?: { uri: string; versions: any[] }[] }> = ({ groups }) => {
  if (!groups?.length) return null;

  return (
    <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 12 }}>
      {groups.map((g) => (
        <CanvasCard key={g.uri} uri={g.uri} versions={g.versions} />
      ))}
    </div>
  );
};
