import { ThemeContext } from "aihappey-components";
import { fluentTheme } from "./primitives";
import {
  FluentProvider,
  webLightTheme,
  createDarkTheme,
  createLightTheme,
  webDarkTheme,
  BrandVariants,
  Theme
} from "@fluentui/react-components";
import { useDarkMode } from "usehooks-ts";

export const ThemeProvider = ({ children, brandVariants }:
  { children: React.ReactNode, brandVariants?: BrandVariants }) => {
  const { isDarkMode } = useDarkMode();

  const lightTheme: Theme = brandVariants ? {
    ...createLightTheme(brandVariants),
  } : webLightTheme;

  const darkTheme: Theme = brandVariants ? {
    ...createDarkTheme(brandVariants),
  } : webDarkTheme;

  return (
    <ThemeContext.Provider value={fluentTheme}>
      <FluentProvider theme={isDarkMode ? darkTheme : lightTheme}>
        {children}
      </FluentProvider>
    </ThemeContext.Provider>
  );
};
