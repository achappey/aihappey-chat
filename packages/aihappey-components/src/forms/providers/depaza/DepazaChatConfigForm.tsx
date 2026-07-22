import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../theme/ThemeContext";

const DEPAZA_MODES = ["standard", "document", "expert"] as const;
const DEPAZA_LOCALES = ["en", "da"] as const;

type DepazaMode = (typeof DEPAZA_MODES)[number];
type DepazaLocale = (typeof DEPAZA_LOCALES)[number];

export type DepazaChatConfig = {
  mode: DepazaMode;
  depaza_events: boolean;
  locale?: DepazaLocale;
  document_intake?: boolean;
};

const isDepazaMode = (value: unknown): value is DepazaMode =>
  typeof value === "string" && DEPAZA_MODES.includes(value as DepazaMode);

const isDepazaLocale = (value: unknown): value is DepazaLocale =>
  typeof value === "string" && DEPAZA_LOCALES.includes(value as DepazaLocale);

/**
 * Returns only request properties supported by Depaza, removing fields which
 * are invalid for the selected orchestration mode.
 */
export const normalizeDepazaChatConfig = (config: Partial<DepazaChatConfig> = {}): DepazaChatConfig => {
  const mode = isDepazaMode(config.mode) ? config.mode : "standard";
  const normalized: DepazaChatConfig = {
    mode,
    depaza_events: typeof config.depaza_events === "boolean" ? config.depaza_events : true,
  };

  if (mode === "document" || mode === "expert") {
    normalized.locale = isDepazaLocale(config.locale) ? config.locale : "en";
  }

  if (mode === "document") {
    normalized.document_intake = typeof config.document_intake === "boolean"
      ? config.document_intake
      : false;
  }

  return normalized;
};

export const DepazaChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: Partial<DepazaChatConfig>;
  updateConfig: (config: DepazaChatConfig) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const normalizedConfig = normalizeDepazaChatConfig(config);
  const supportsLocale = normalizedConfig.mode === "document" || normalizedConfig.mode === "expert";
  const supportsDocumentIntake = normalizedConfig.mode === "document";
  const selectedLocale = normalizedConfig.locale ?? "en";

  const modeOptions = DEPAZA_MODES.map((value) => ({
    value,
    label: t(value, value === "standard" ? "Standard" : value[0].toUpperCase() + value.slice(1)),
  }));
  const localeOptions = [
    { value: "en", label: t("english", "English") },
    { value: "da", label: t("danish", "Danish") },
  ];

  const update = (nextConfig: Partial<DepazaChatConfig>) =>
    updateConfig(normalizeDepazaChatConfig(nextConfig));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("mode")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("mode")}
            values={[normalizedConfig.mode]}
            valueTitle={modeOptions.find((option) => option.value === normalizedConfig.mode)?.label}
            options={modeOptions}
            onChange={(mode: string) => update({ ...normalizedConfig, mode: mode as DepazaMode })}
          >
            {modeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("locale", "Locale")}
            disabled={!supportsLocale}
            values={[selectedLocale]}
            valueTitle={localeOptions.find((option) => option.value === selectedLocale)?.label}
            options={localeOptions}
            onChange={(locale: string) => update({ ...normalizedConfig, locale: locale as DepazaLocale })}
          >
            {localeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </theme.Select>

          <theme.Switch
            id="depaza_document_intake"
            label={t("documentIntake", "Document intake")}
            disabled={!supportsDocumentIntake}
            checked={normalizedConfig.document_intake ?? false}
            onChange={(document_intake) => update({ ...normalizedConfig, document_intake })}
          />
        </div>
      </theme.Card>
  
    </div>
  );
};
