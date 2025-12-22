import { JsonViewerProps } from "aihappey-types";

// Helper to safely parse JSON (from string or object)
function parseJson(input: unknown): any | null {
  if (typeof input === "object") return input;
  try {
    return JSON.parse(String(input));
  } catch {
    return null;
  }
}

export function JsonViewer({ value }: JsonViewerProps): JSX.Element {
  const json = parseJson(value);

  if (json === null) {
    return <div style={{ color: "red" }}>Invalid JSON</div>;
  }

  // Recursive pretty print
  const Pretty = ({ data }: { data: any }) => {
    if (typeof data === "object" && data !== null) {
      if (Array.isArray(data)) {
        return (
          <details open>
            <summary>[Array] ({data.length} items)</summary>
            <ul style={{ marginLeft: 16 }}>
              {data.map((item, idx) => (
                <li key={idx}>
                  <Pretty data={item} />
                </li>
              ))}
            </ul>
          </details>
        );
      }
      return (
        <details open>
          <summary>{`{Object}`}</summary>
          <ul style={{ marginLeft: 16 }}>
            {Object.entries(data).map(([k, v]) => (
              <li key={k}>
                <strong>{k}: </strong>
                <Pretty data={v} />
              </li>
            ))}
          </ul>
        </details>
      );
    }
    return <span style={{ color: "#66c" }}>{JSON.stringify(data)}</span>;
  };

  return (
    <div
      style={{ fontFamily: "monospace", fontSize: 14, whiteSpace: "pre-wrap" }}
    >
      <Pretty data={json} />
    </div>
  );
};
