import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../../theme/ThemeContext";

const omitSeed = (config: any) => {
  const nextConfig = { ...(config ?? {}) };
  delete nextConfig.seed;
  return nextConfig;
};

export const CerebrasOtherCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (config: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <theme.Card size="small" title={t("other")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Input
          id="cerebras-seed"
          type="number"
          step={1}
          label={"Seed"}
          value={config?.seed ?? ""}
          onChange={(event: any) => {
            const value = event?.target?.value;
            if (value === "" || value === undefined) {
              updateConfig(omitSeed(config));
              return;
            }

            const seed = Number(value);
            if (Number.isInteger(seed)) {
              updateConfig({ ...(config ?? {}), seed });
            }
          }}
        />

        <theme.Switch
          id="cerebras-parallel-tool-calls"
          checked={!!config?.parallel_tool_calls}
          label={t("parallelToolCalls")}
          onChange={(value) =>
            updateConfig({
              ...(config ?? {}),
              parallel_tool_calls: value,
            })
          }
        />
      </div>
    </theme.Card>
  );
};
