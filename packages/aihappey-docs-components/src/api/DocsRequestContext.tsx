import { createContext, useContext, useMemo, type ReactNode } from "react";

export type DocsRequestConfig = {
  headers?: Record<string, string>;
  getAccessToken?: () => Promise<string | null | undefined>;
  fetch?: typeof globalThis.fetch;
};

const DocsRequestContext = createContext<DocsRequestConfig>({});

export type DocsRequestProviderProps = DocsRequestConfig & {
  children: ReactNode;
};

export const DocsRequestProvider = ({ children, headers, getAccessToken, fetch }: DocsRequestProviderProps) => {
  const value = useMemo(() => ({ headers, getAccessToken, fetch }), [headers, getAccessToken, fetch]);
  return <DocsRequestContext.Provider value={value}>{children}</DocsRequestContext.Provider>;
};

export const useDocsRequest = () => useContext(DocsRequestContext);

