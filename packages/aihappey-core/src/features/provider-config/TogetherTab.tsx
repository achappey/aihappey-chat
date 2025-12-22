import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";


export const TogetherTab = ({
  together,
  updateTogether,
}: {
  together: any;
  updateTogether: (val: any) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const reasoningOptions = [
    { value: "low", label: t("low") },
    { value: "medium", label: t("medium") },
    { value: "high", label: t("high") },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("reasoning")}
      >
        <div>
          <theme.Select
            label={t("reasoningEffort")}
            values={[together.reasoning_effort || ""]}
            valueTitle={
              reasoningOptions.find((a) => a.value === together.reasoning_effort)
                ?.label
            }
            options={reasoningOptions}
            onChange={(val: string) =>
              updateTogether({ ...together, reasoning_effort: val })
            }
          >
            {reasoningOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

        </div>
      </theme.Card>

    </div>
  );
};
