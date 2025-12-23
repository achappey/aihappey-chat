import { ThemeContext } from "aihappey-components";
import { bootstrapTheme } from "./primitives";
import { useDarkMode } from "usehooks-ts";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const isDarkMode = useDarkMode()
  
  return (
    <ThemeContext.Provider value={bootstrapTheme}>
      <div data-bs-theme={isDarkMode ? "dark" : "light"}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
