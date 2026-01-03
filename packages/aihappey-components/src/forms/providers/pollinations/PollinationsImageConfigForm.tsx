import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type PollinationsImageConfig = {
  enhance?: boolean;
  private?: boolean;
};

export const PollinationsImageConfigForm: React.FC<{
  config: PollinationsImageConfig;
  updateConfig: (val: PollinationsImageConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 18
    }}>
      <theme.Card size="small"
        title={t("general")}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>
          <theme.Switch
            id="pollinations-enhance"
            checked={!!config?.enhance}
            label={t("providers:pollinations.enhance")}
            hint={t("providers:pollinations.enhanceHint")}
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
            label={t("providers:pollinations.private")}
            hint={t("providers:pollinations.privateHint")}
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
