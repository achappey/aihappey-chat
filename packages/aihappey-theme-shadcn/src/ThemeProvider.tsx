import * as React from "react";
import { ThemeContext } from "aihappey-components";
import { useDarkMode } from "usehooks-ts";
import { shadcnTheme } from "./primitives";
import { shadcnThemeStyles } from "./styles";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { isDarkMode } = useDarkMode();
  const colorMode = isDarkMode ? "dark" : "light";

  React.useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.getAttribute("data-theme");
    root.setAttribute("data-theme", colorMode);

    return () => {
      if (previousTheme) root.setAttribute("data-theme", previousTheme);
      else root.removeAttribute("data-theme");
    };
  }, [colorMode]);

  return (
    <ThemeContext.Provider value={shadcnTheme}>
      <style>{shadcnThemeStyles}</style>
      <div className={`aih-shadcn-theme ${colorMode}`}>{children}</div>
    </ThemeContext.Provider>
  );
};

