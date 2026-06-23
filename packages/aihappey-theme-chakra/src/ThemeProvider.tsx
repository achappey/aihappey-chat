import * as React from "react";
import { ChakraProvider, defaultSystem, type SystemContext } from "@chakra-ui/react";
import { useDarkMode } from "usehooks-ts";
import { ThemeContext } from "aihappey-components";
import { chakraTheme } from "./primitives";

export type ChakraThemeProviderProps = {
  children: React.ReactNode;
  system?: SystemContext;
  defaultColorScheme?: "light" | "dark" | "auto";
};

export const ThemeProvider = ({ children, system = defaultSystem, defaultColorScheme = "auto" }: ChakraThemeProviderProps) => {
  const { isDarkMode } = useDarkMode();
  const colorScheme = defaultColorScheme === "auto" ? (isDarkMode ? "dark" : "light") : defaultColorScheme;

  React.useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousTheme = root.getAttribute("data-theme");
    const previousColorMode = root.getAttribute("data-color-mode");
    const previousRootClassName = root.className;
    const previousBodyBackground = body.style.backgroundColor;
    const previousBodyColor = body.style.color;
    root.setAttribute("data-theme", colorScheme);
    root.setAttribute("data-color-mode", colorScheme);
    root.classList.toggle("dark", colorScheme === "dark");
    root.classList.toggle("light", colorScheme === "light");
    body.style.backgroundColor = colorScheme === "dark" ? "var(--chakra-colors-bg)" : previousBodyBackground;
    body.style.color = colorScheme === "dark" ? "var(--chakra-colors-fg)" : previousBodyColor;

    return () => {
      if (previousTheme) root.setAttribute("data-theme", previousTheme);
      else root.removeAttribute("data-theme");
      if (previousColorMode) root.setAttribute("data-color-mode", previousColorMode);
      else root.removeAttribute("data-color-mode");
      root.className = previousRootClassName;
      body.style.backgroundColor = previousBodyBackground;
      body.style.color = previousBodyColor;
    };
  }, [colorScheme]);

  return (
    <ThemeContext.Provider value={chakraTheme}>
      <ChakraProvider value={system}>
        <div className={`chakra-theme ${colorScheme}`} style={{ minHeight: "100vh", background: "var(--chakra-colors-bg)", color: "var(--chakra-colors-fg)" }}>
          {children}
        </div>
      </ChakraProvider>
    </ThemeContext.Provider>
  );
};
