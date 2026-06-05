import { ThemeContext } from "aihappey-components";
import { bootstrapTheme } from "./primitives";
import { bootstrapThemeStyles } from "./styles";
import { useEffect, type ReactNode } from "react";
import { useDarkMode } from "usehooks-ts";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { isDarkMode } = useDarkMode();
  const colorMode = isDarkMode ? "dark" : "light";

  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.getAttribute("data-bs-theme");

    root.setAttribute("data-bs-theme", colorMode);

    return () => {
      if (previousTheme) {
        root.setAttribute("data-bs-theme", previousTheme);
      } else {
        root.removeAttribute("data-bs-theme");
      }
    };
  }, [colorMode]);
   
  return (
    <ThemeContext.Provider value={bootstrapTheme}>
      <div data-bs-theme={colorMode} className="min-vh-100 bg-body text-body">
        <style>{bootstrapThemeStyles}</style>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
