import React, { createContext, useContext, useMemo, type ComponentType, type ReactNode } from "react";

export type AihThemeProviderComponent = ComponentType<{ children: ReactNode }>;

export type AihThemeEntry = {
  id: string;
  label: string;
  Provider: AihThemeProviderComponent;
};

export type MultiThemeContextValue = {
  themes: AihThemeEntry[];
  selectedThemeId: string;
  selectedTheme?: AihThemeEntry;
  setSelectedThemeId: (themeId: string) => void;
};

const MultiThemeContext = createContext<MultiThemeContextValue | undefined>(undefined);

export const useMultiTheme = () => useContext(MultiThemeContext);

export type MultiThemeProviderProps = {
  children: ReactNode;
  themes: AihThemeEntry[];
  selectedThemeId?: string;
  defaultThemeId?: string;
  onThemeChange?: (themeId: string) => void;
};

export const MultiThemeProvider = ({
  children,
  themes,
  selectedThemeId,
  defaultThemeId,
  onThemeChange,
}: MultiThemeProviderProps) => {
  const normalizedThemes = useMemo(
    () => themes.filter((theme) => theme?.id && theme.Provider),
    [themes]
  );

  if (normalizedThemes.length === 0) {
    throw new Error("MultiThemeProvider requires at least one theme entry");
  }

  const fallbackTheme =
    normalizedThemes.find((theme) => theme.id === defaultThemeId) ?? normalizedThemes[0];
  const selectedTheme =
    normalizedThemes.find((theme) => theme.id === selectedThemeId) ?? fallbackTheme;

  const contextValue = useMemo<MultiThemeContextValue>(
    () => ({
      themes: normalizedThemes,
      selectedThemeId: selectedTheme.id,
      selectedTheme,
      setSelectedThemeId: onThemeChange ?? (() => undefined),
    }),
    [normalizedThemes, onThemeChange, selectedTheme]
  );

  const ActiveProvider = selectedTheme.Provider;

  return (
    <MultiThemeContext.Provider value={contextValue}>
      <ActiveProvider>{children}</ActiveProvider>
    </MultiThemeContext.Provider>
  );
};

