import * as React from "react";
import { ThemeContext } from "aihappey-components";
import { htmlTheme } from "./primitives";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider value={htmlTheme}>{children}</ThemeContext.Provider>
);
