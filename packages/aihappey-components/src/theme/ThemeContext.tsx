import { createContext, useContext } from "react";
import type { AihUiTheme } from "aihappey-types";

export const ThemeContext = createContext<AihUiTheme | undefined>(undefined);

export const useTheme = (): AihUiTheme => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("No ThemeProvider found");
  return ctx;
};
