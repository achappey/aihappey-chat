import { createContext, useContext, type ReactNode } from "react";

/**
 * Selects the authentication story rendered by a consuming documentation app.
 * Modes are intentionally exclusive so provider-key and identity-platform
 * credentials are never presented as alternatives in the same app.
 */
export type DocsAuthMode = "provider-key" | "azure-ad";

const DocsAuthContext = createContext<DocsAuthMode>("provider-key");

export const DocsAuthProvider = ({ mode, children }: { mode: DocsAuthMode; children: ReactNode }) => (
  <DocsAuthContext.Provider value={mode}>{children}</DocsAuthContext.Provider>
);

export const useDocsAuthMode = () => useContext(DocsAuthContext);
