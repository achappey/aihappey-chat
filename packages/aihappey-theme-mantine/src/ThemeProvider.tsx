import * as React from "react";
import { MantineProvider, type MantineThemeOverride } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { useDarkMode } from "usehooks-ts";
import { ThemeContext } from "aihappey-components";
import { mantineTheme } from "./primitives";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";

export type MantineThemeProviderProps = {
  children: React.ReactNode;
  theme?: MantineThemeOverride;
  defaultColorScheme?: "light" | "dark" | "auto";
};

export const ThemeProvider = ({ children, theme, defaultColorScheme = "auto" }: MantineThemeProviderProps) => {
  const { isDarkMode } = useDarkMode();
  const colorScheme = defaultColorScheme === "auto" ? (isDarkMode ? "dark" : "light") : defaultColorScheme;

  return (
    <ThemeContext.Provider value={mantineTheme}>
      <MantineProvider theme={theme} defaultColorScheme={colorScheme} forceColorScheme={colorScheme}>
        <ModalsProvider>
          <Notifications />
          {children}
        </ModalsProvider>
      </MantineProvider>
    </ThemeContext.Provider>
  );
};

