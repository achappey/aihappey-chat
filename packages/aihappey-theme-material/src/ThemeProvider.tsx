import * as React from "react";
import { ThemeContext } from "aihappey-components";
import { Box, ScopedCssBaseline, ThemeProvider as MuiThemeProvider, createTheme, type ThemeOptions } from "@mui/material";
import { useDarkMode } from "usehooks-ts";
import { materialTheme } from "./primitives";

export type MaterialThemeProviderProps = {
  children: React.ReactNode;
  theme?: ThemeOptions;
  defaultColorScheme?: "light" | "dark" | "auto";
};

export const ThemeProvider = ({ children, theme, defaultColorScheme = "auto" }: MaterialThemeProviderProps) => {
  const { isDarkMode } = useDarkMode();
  const mode = defaultColorScheme === "auto" ? (isDarkMode ? "dark" : "light") : defaultColorScheme;
  const muiTheme = React.useMemo(() => createTheme({ palette: { mode }, ...theme }), [mode, theme]);

  React.useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.getAttribute("data-material-theme");
    root.setAttribute("data-material-theme", mode);
    return () => {
      if (previousTheme) root.setAttribute("data-material-theme", previousTheme);
      else root.removeAttribute("data-material-theme");
    };
  }, [mode]);

  return (
    <ThemeContext.Provider value={materialTheme}>
      <MuiThemeProvider theme={muiTheme}>
        <ScopedCssBaseline enableColorScheme>
          <Box className="aih-material-theme" sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
            {children}
          </Box>
        </ScopedCssBaseline>
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

