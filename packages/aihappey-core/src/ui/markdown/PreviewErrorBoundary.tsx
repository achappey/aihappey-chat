import React, { } from "react";
import { ErrorBoundary } from "react-error-boundary";

function PreviewErrorFallback({ error }: { error: any }) {
  return (
    <div
      style={{
        background: "#1a1a1a",
        color: "#fff",
        padding: 16,
        borderRadius: 8,
        margin: 8,
        fontSize: 14,
      }}
    >
      <b>Preview error</b>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
        {error?.message || String(error)}
      </pre>
    </div>
  );
}

// Convenience wrapper, optional
export function PreviewErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary FallbackComponent={PreviewErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}