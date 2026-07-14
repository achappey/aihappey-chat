import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AppInsightsErrorBoundary from "./AppInsightsErrorBoundary";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(
    <AppInsightsErrorBoundary>
      <App />
    </AppInsightsErrorBoundary>
  );
}
