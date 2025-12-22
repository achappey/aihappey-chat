import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";


export const JinaTab = ({
  jina,
  updateJina,
}: {
  jina: any;
  updateJina: (val: any) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const EFFORTS = ["low", "medium", "high"] as const;
  type Effort = (typeof EFFORTS)[number];
  const effortToIndex = (e?: Effort) =>
    Math.max(0, EFFORTS.indexOf((e ?? "medium") as Effort));
  const indexToEffort = (i: number): Effort =>
    EFFORTS[Math.min(EFFORTS.length - 1, Math.max(0, i))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("reasoning")}>
        <div>
          <theme.Slider
            label={`${t("reasoningEffort")} (${t(
              jina.reasoning_effort ?? "medium"
            )})`}
            min={0}
            max={EFFORTS.length - 1}
            step={1}
            style={{ flex: "1 1 0" }}
            value={effortToIndex(jina.reasoning_effort as Effort)}
            onChange={(i: number) =>
              updateJina({
                ...jina,
                reasoning_effort: indexToEffort(i),
              })
            }
          />

          <theme.Input
            label={t("jina.max_returned_urls")}     
            value={jina?.max_returned_urls || ""}
            style={{ minWidth: 70 }}
            onChange={(e: any) =>
              updateJina({
                ...jina,
                max_returned_urls: e.target.value,
              })
            }
          />

          <theme.Input
            label={t("jina.team_size")}
            type="number"
            value={jina?.team_size || ""}
            style={{ minWidth: 70 }}
            onChange={(e: any) =>
              updateJina({
                ...jina,
                team_size: parseInt(e.target.value, 10),
              })
            }
          />

          <theme.Input
            label={t("jina.goodDomains")}
            placeholder="domain1.com, domain2.com"
            value={(jina.boost_hostnames || []).join(", ")}
            onChange={(e: any) =>
              updateJina({
                ...jina,
                boost_hostnames: e.target.value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean)
              })
            }
          />
          {/* Blocked domains */}
          <theme.Input
            label={t("jina.badDomains")}
            placeholder="domain1.com, domain2.com"
            value={(jina.bad_hostnames || []).join(", ")}
            onChange={(e: any) =>
              updateJina({
                ...jina,
                bad_hostnames: e.target.value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean)
              })
            }
          />

          <theme.Input
            label={t("jina.onlyDomains")}
            placeholder="domain1.com, domain2.com"
            value={(jina.only_hostnames || []).join(", ")}
            onChange={(e: any) =>
              updateJina({
                ...jina,
                only_hostnames: e.target.value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean)
              })
            }
          />

          <theme.Switch
            id="search_provider"
            checked={jina?.search_provider == "arxiv"}
            label={t("jina.search_provider")}
            onChange={(value) => {
              updateJina({
                ...jina,
                search_provider: value ? "arxiv" : undefined,
              });
            }}
          />
        </div>
      </theme.Card>
    </div>
  );
};
