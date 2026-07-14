import type { CSSProperties } from "react";
import { useMultiTheme } from "../theme/MultiThemeContext";
import { useDocsTheme } from "../theme/useDocsTheme";

export type ThemeSelectorProps = {
  label?: string;
  style?: CSSProperties;
};

export const ThemeSelector = ({ label = "Theme", style }: ThemeSelectorProps) => {
  const multiTheme = useMultiTheme();
  const { Select } = useDocsTheme();

  if (!multiTheme || multiTheme.themes.length <= 1) return null;

  return (
    <Select
      aria-label={label}
      value={multiTheme.selectedThemeId}
      valueTitle={multiTheme.selectedTheme?.label}
      onChange={multiTheme.setSelectedThemeId}
      size="small"
      style={{ minWidth: 144, ...style }}
    >
      {multiTheme.themes.map((theme) => (
        <option key={theme.id} value={theme.id}>
          {theme.label}
        </option>
      ))}
    </Select>
  );
};

