import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

const DEFAULT_TIME_ZONE = "Europe/Amsterdam";

type MicrosoftFileResource = {
  uri?: string;
};

type MicrosoftAdditionalContext = {
  text?: string;
};

const parseOptionalNumber = (value: unknown) => {
  const text = String(value ?? "").trim();
  if (!text) return undefined;

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const cleanString = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || undefined;
};

const cleanFiles = (files: MicrosoftFileResource[]) =>
  files
    .map((file) => ({ uri: cleanString(file?.uri) }))
    .filter((file) => !!file.uri);

const cleanAdditionalContext = (additionalContext: MicrosoftAdditionalContext[]) =>
  additionalContext
    .map((entry) => ({ text: cleanString(entry?.text) }))
    .filter((entry) => !!entry.text);

export const MicrosoftChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const locationHint = config?.locationHint ?? {};
  const contextualResources = config?.contextualResources ?? {};
  const files = Array.isArray(contextualResources?.files)
    ? contextualResources.files
    : [];
  const additionalContext = Array.isArray(config?.additionalContext)
    ? config.additionalContext
    : [];

  const webEnabledValue =
    typeof contextualResources?.webContext?.isWebEnabled === "boolean"
      ? String(contextualResources.webContext.isWebEnabled)
      : "unset";

  const submitConfig = (nextConfig: any) => {
    const nextLocationHint = nextConfig?.locationHint ?? {};
    const nextFiles = cleanFiles(nextConfig?.contextualResources?.files ?? []);
    const nextAdditionalContext = cleanAdditionalContext(
      nextConfig?.additionalContext ?? []
    );
    const nextWebEnabled = nextConfig?.contextualResources?.webContext?.isWebEnabled;

    const normalizedContextualResources = {
      ...(nextFiles.length > 0 ? { files: nextFiles } : {}),
      ...(typeof nextWebEnabled === "boolean"
        ? { webContext: { isWebEnabled: nextWebEnabled } }
        : {}),
    };

    updateConfig({
      ...nextConfig,
      locationHint: {
        timeZone: cleanString(nextLocationHint.timeZone) ?? DEFAULT_TIME_ZONE,
        ...(cleanString(nextLocationHint.countryOrRegion)
          ? { countryOrRegion: cleanString(nextLocationHint.countryOrRegion) }
          : {}),
        ...(parseOptionalNumber(nextLocationHint.countryOrRegionConfidence) !== undefined
          ? {
              countryOrRegionConfidence: parseOptionalNumber(
                nextLocationHint.countryOrRegionConfidence
              ),
            }
          : {}),
        ...(parseOptionalNumber(nextLocationHint.latitude) !== undefined
          ? { latitude: parseOptionalNumber(nextLocationHint.latitude) }
          : {}),
        ...(parseOptionalNumber(nextLocationHint.longitude) !== undefined
          ? { longitude: parseOptionalNumber(nextLocationHint.longitude) }
          : {}),
      },
      contextualResources:
        Object.keys(normalizedContextualResources).length > 0
          ? normalizedContextualResources
          : undefined,
      additionalContext:
        nextAdditionalContext.length > 0 ? nextAdditionalContext : undefined,
    });
  };

  const updateLocationHint = (patch: Record<string, unknown>) =>
    submitConfig({
      ...config,
      locationHint: {
        ...locationHint,
        ...patch,
      },
    });

  const updateWebContext = (value: string) =>
    submitConfig({
      ...config,
      contextualResources: {
        ...contextualResources,
        webContext:
          value === "unset"
            ? undefined
            : {
                isWebEnabled: value === "true",
              },
      },
    });

  const updateFiles = (nextFiles: MicrosoftFileResource[]) =>
    submitConfig({
      ...config,
      contextualResources: {
        ...contextualResources,
        files: nextFiles,
      },
    });

  const updateAdditionalContext = (
    nextAdditionalContext: MicrosoftAdditionalContext[]
  ) =>
    submitConfig({
      ...config,
      additionalContext: nextAdditionalContext,
    });

  const webContextOptions = [
    { value: "unset", label: t("providers:microsoft.webContextUnset") },
    { value: "true", label: t("providers:microsoft.webContextEnabled") },
    { value: "false", label: t("providers:microsoft.webContextDisabled") },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("providers:microsoft.locationTitle")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            label={t("providers:microsoft.timeZone")}
            required
            value={locationHint.timeZone ?? DEFAULT_TIME_ZONE}
            placeholder="America/New_York"
            onChange={(e: any) => updateLocationHint({ timeZone: e.target.value })}
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <theme.Input
              label={t("providers:microsoft.countryOrRegion")}
              style={{ flex: 1, minWidth: 160 }}
              value={locationHint.countryOrRegion ?? ""}
              placeholder="US"
              onChange={(e: any) =>
                updateLocationHint({ countryOrRegion: e.target.value })
              }
            />
            <theme.Input
              label={t("providers:microsoft.countryOrRegionConfidence")}
              type="number"
              min={0}
              max={1}
              step="0.01"
              style={{ flex: 1, minWidth: 160 }}
              value={locationHint.countryOrRegionConfidence ?? ""}
              placeholder="0.95"
              onChange={(e: any) =>
                updateLocationHint({ countryOrRegionConfidence: e.target.value })
              }
            />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <theme.Input
              label={t("providers:microsoft.latitude")}
              type="number"
              step="any"
              style={{ flex: 1, minWidth: 160 }}
              value={locationHint.latitude ?? ""}
              placeholder="40.7128"
              onChange={(e: any) => updateLocationHint({ latitude: e.target.value })}
            />
            <theme.Input
              label={t("providers:microsoft.longitude")}
              type="number"
              step="any"
              style={{ flex: 1, minWidth: 160 }}
              value={locationHint.longitude ?? ""}
              placeholder="-74.0060"
              onChange={(e: any) =>
                updateLocationHint({ longitude: e.target.value })
              }
            />
          </div>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:microsoft.contextualResourcesTitle")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:microsoft.webContext")}
            values={[webEnabledValue]}
            valueTitle={
              webContextOptions.find((option) => option.value === webEnabledValue)
                ?.label
            }
            options={webContextOptions}
            onChange={(value: string) => updateWebContext(String(value ?? "unset"))}
          >
            {webContextOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </theme.Select>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, opacity: 0.78 }}>
              {t("providers:microsoft.filesDescription")}
            </div>

            {files.map((file: MicrosoftFileResource, index: number) => (
              <div
                key={`microsoft-file-${index}`}
                style={{ display: "flex", gap: 8, alignItems: "flex-end" }}
              >
                <theme.Input
                  label={t("providers:microsoft.fileUri", { index: index + 1 })}
                  style={{ flex: 1 }}
                  value={file?.uri ?? ""}
                  placeholder="https://contoso.sharepoint.com/sites/Engineering/Shared%20Documents/Specs/Business-Model.docx"
                  onChange={(e: any) => {
                    const nextFiles = [...files];
                    nextFiles[index] = { uri: e.target.value };
                    updateFiles(nextFiles);
                  }}
                />
                <theme.Button
                  icon="delete"
                  variant="danger"
                  size="small"
                  title={t("delete")}
                  onClick={() =>
                    updateFiles(files.filter((_: unknown, i: number) => i !== index))
                  }
                />
              </div>
            ))}

            <div>
              <theme.Button
                icon="add"
                size="small"
                variant="subtle"
                title={t("providers:microsoft.addFile")}
                onClick={() => updateFiles([...files, { uri: "" }])}
              >
                {t("providers:microsoft.addFile")}
              </theme.Button>
            </div>
          </div>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:microsoft.additionalContextTitle")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.78 }}>
            {t("providers:microsoft.additionalContextDescription")}
          </div>

          {additionalContext.map(
            (entry: MicrosoftAdditionalContext, index: number) => (
              <div
                key={`microsoft-additional-context-${index}`}
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                <theme.TextArea
                  label={t("providers:microsoft.additionalContextEntry", {
                    index: index + 1,
                  })}
                  rows={3}
                  value={entry?.text ?? ""}
                  placeholder="John Doe's birthday is on January 1st."
                  onChange={(value: string) => {
                    const nextAdditionalContext = [...additionalContext];
                    nextAdditionalContext[index] = { text: value };
                    updateAdditionalContext(nextAdditionalContext);
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <theme.Button
                    icon="delete"
                    variant="danger"
                    size="small"
                    title={t("delete")}
                    onClick={() =>
                      updateAdditionalContext(
                        additionalContext.filter(
                          (_: unknown, i: number) => i !== index
                        )
                      )
                    }
                  >
                    {t("delete")}
                  </theme.Button>
                </div>
              </div>
            )
          )}

          <div>
            <theme.Button
              icon="add"
              size="small"
              variant="subtle"
              title={t("providers:microsoft.addAdditionalContext")}
              onClick={() =>
                updateAdditionalContext([...additionalContext, { text: "" }])
              }
            >
              {t("providers:microsoft.addAdditionalContext")}
            </theme.Button>
          </div>
        </div>
      </theme.Card>
    </div>
  );
};

