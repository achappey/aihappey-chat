import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

const VERSION_HEADER = "anthropic-version";
const API_VERSIONS = ["2026-10-21", "2023-06-01"];

export const AnthropicVersionCard = ({
  headers,
  updateHeaders,
}: {
  headers?: Record<string, string>;
  updateHeaders?: (headers: Record<string, string>) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const selected = Object.entries(headers ?? {}).find(
    ([name]) => name.toLowerCase() === VERSION_HEADER,
  )?.[1]?.trim() || "2023-06-01";
  // Preserve an explicit future version when opening saved settings.
  const versions = Array.from(new Set([...API_VERSIONS, selected]));

  return (
    <theme.Card size="small" title={t("version")}>
      <theme.Select
        label={t("providers:anthropic.apiVersion")}
        values={[selected]}
        valueTitle={selected}
        options={versions.map((value) => ({ value, label: value }))}
        disabled={!updateHeaders}
        onChange={(value: string) => {
          const next = Object.fromEntries(
            Object.entries(headers ?? {}).filter(([name]) => name.toLowerCase() !== VERSION_HEADER),
          );
          updateHeaders?.({ ...next, [VERSION_HEADER]: value });
        }}
      >
        {versions.map((version) => <option key={version} value={version}>{version}</option>)}
      </theme.Select>
    </theme.Card>
  );
};
