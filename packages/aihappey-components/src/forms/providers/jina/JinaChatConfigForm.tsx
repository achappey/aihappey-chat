import { useTheme } from "../../../theme/ThemeContext";

const EFFORTS = ["low", "medium", "high"] as const;
type Effort = (typeof EFFORTS)[number];

export type JinaChatConfigFormTranslations = {
  reasoning?: string;
  reasoningEffort?: string;
  low?: string;
  medium?: string;
  high?: string;

  max_returned_urls?: string;
  team_size?: string;

  goodDomains?: string;
  badDomains?: string;
  onlyDomains?: string;

  search_provider?: string;
};

export const JinaChatConfigForm = ({
  config,
  updateConfig,
  translations,
}: {
  config: any;
  updateConfig: (val: any) => void;
  translations?: JinaChatConfigFormTranslations;
}) => {
  const theme = useTheme();

  const effortToIndex = (e?: Effort) =>
    Math.max(0, EFFORTS.indexOf((e ?? "medium") as Effort));

  const indexToEffort = (i: number): Effort =>
    EFFORTS[Math.min(EFFORTS.length - 1, Math.max(0, i))];

  const tEffort = (e: string) => (translations as any)?.[e] ?? e;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={translations?.reasoning ?? "reasoning"}>
        <div>
          <theme.Slider
            label={`${translations?.reasoningEffort ?? "reasoningEffort"} (${tEffort(
              config?.reasoning_effort ?? "medium"
            )})`}
            min={0}
            max={EFFORTS.length - 1}
            step={1}
            style={{ flex: "1 1 0" }}
            value={effortToIndex(config?.reasoning_effort as Effort)}
            onChange={(i: number) =>
              updateConfig({
                ...config,
                reasoning_effort: indexToEffort(i),
              })
            }
          />

          <theme.Input
            label={translations?.max_returned_urls ?? "max_returned_urls"}
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
            label={translations?.team_size ?? "team_size"}
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
            label={translations?.goodDomains ?? "goodDomains"}
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
            label={translations?.badDomains ?? "badDomains"}
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
            label={translations?.onlyDomains ?? "onlyDomains"}
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
            label={translations?.search_provider ?? "search_provider"}
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
