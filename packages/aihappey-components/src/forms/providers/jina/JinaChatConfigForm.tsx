import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const EFFORTS = ["low", "medium", "high"] as const;
type Effort = (typeof EFFORTS)[number];

export const JinaChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const effortToIndex = (e?: Effort) =>
    Math.max(0, EFFORTS.indexOf((e ?? "medium") as Effort));

  const indexToEffort = (i: number): Effort =>
    EFFORTS[Math.min(EFFORTS.length - 1, Math.max(0, i))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("reasoning")}>
        <div>
          <theme.Slider
            label={`${t("reasoningEffort", {
              reasoningEffort: t(config?.reasoning_effort ?? "none")
            })}`}
            min={0}
            max={EFFORTS.length - 1}
            step={1}
            value={effortToIndex(config?.reasoning_effort)}
            onChange={(i: number) =>
              updateConfig({
                ...config,
                reasoning_effort: indexToEffort(i),
              })
            }
          />

          <theme.Input
            label={t("providers:jina.max_returned_urls")}
            value={config?.max_returned_urls || ""}
            style={{ minWidth: 70 }}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                max_returned_urls: e.target.value,
              })
            }
          />

          <theme.Input
            label={t("providers:jina.team_size")}
            type="number"
            value={config?.team_size || ""}
            style={{ minWidth: 70 }}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                team_size: parseInt(e.target.value, 10),
              })
            }
          />

          <theme.Input
            label={t("providers:jina.goodDomains")}
            placeholder="domain1.com, domain2.com"
            value={(config?.boost_hostnames || []).join(", ")}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                boost_hostnames: e.target.value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              })
            }
          />

          <theme.Input
            label={t("providers:jina.badDomains")}
            placeholder="domain1.com, domain2.com"
            value={(config?.bad_hostnames || []).join(", ")}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                bad_hostnames: e.target.value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              })
            }
          />

          <theme.Input
            label={t("providers:jina.onlyDomains")}
            placeholder="domain1.com, domain2.com"
            value={(config?.only_hostnames || []).join(", ")}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                only_hostnames: e.target.value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              })
            }
          />

          <theme.Switch
            id="search_provider"
            checked={config?.search_provider === "arxiv"}
            label={t("providers:jina.search_provider")}
            onChange={(value) =>
              updateConfig({
                ...config,
                search_provider: value ? "arxiv" : undefined,
              })
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};
