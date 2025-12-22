import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";

const EFFORTS = ["minimal", "low", "medium", "high"] as const;
type Effort = (typeof EFFORTS)[number];

export const PollinationsTab = ({
  pollinations,
  updatePollinations,
}: {
  pollinations: any;
  updatePollinations: (val: any) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // Reasoning block on/off
  const effortToIndex = (e?: Effort) =>
    Math.max(0, EFFORTS.indexOf((e ?? "minimal") as Effort));

  const indexToEffort = (i: number): Effort =>
    EFFORTS[Math.min(EFFORTS.length - 1, Math.max(0, i))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("reasoning")}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <theme.Slider
            label={`${t("reasoningEffort")} (${t(
              pollinations.reasoning_effort ?? "minimal"
            )})`}
            min={0}
            max={EFFORTS.length - 1}
            step={1}
            style={{ flex: "1 1 0" }}
            value={effortToIndex(pollinations.reasoning_effort as Effort)}
            onChange={(i: number) =>
              updatePollinations({
                ...pollinations,
                reasoning_effort: indexToEffort(i),
              })
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};
