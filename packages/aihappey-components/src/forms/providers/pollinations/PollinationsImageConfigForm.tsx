import React from "react";
import { useTheme } from "../../../theme/ThemeContext";

export type PollinationsImageConfig = {
  enhance?: boolean;
  private?: boolean;
};

export type PollinationsImageConfigFormTranslations = {
  formTitle?: string;
  enhance?: string;
  enhanceHint?: string;
  private?: string;
  privateHint?: string;
};

export const PollinationsImageConfigForm: React.FC<{
  config: PollinationsImageConfig;
  updateConfig: (val: PollinationsImageConfig) => void;
  translations?: PollinationsImageConfigFormTranslations;
  formTitle?: string;
}> = ({ config, updateConfig, translations, formTitle }) => {
  const theme = useTheme();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={formTitle ?? translations?.formTitle ?? "Pollinations image config"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Switch
            id="pollinations-enhance"
            checked={!!config?.enhance}
            hint={translations?.enhanceHint}
            label={translations?.enhance ?? "enhance"}
            onChange={(val: boolean) =>
              updateConfig({
                ...config,
                enhance: val,
              })
            }
          />

          <theme.Switch
            id="pollinations-private"
            checked={!!config?.private}
            hint={translations?.privateHint}
            label={translations?.private ?? "private"}
            onChange={(val: boolean) =>
              updateConfig({
                ...config,
                private: val,
              })
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};

