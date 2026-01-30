import React, { useMemo } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../theme/ThemeContext";
import { ToolForm } from "../tools/ToolForm";

export type DataSourceType =
  | "url"
  | "resource"
  | "resourceTemplate"
  | "tool"
  | "structuredOutput";

export type DataSourceFormValue =
  | {
      type: "url";
      config: { url: string; params?: Record<string, string> };
    }
  | {
      type: "resource";
      config: { serverKey: string; uri: string };
    }
  | {
      type: "resourceTemplate";
      config: { serverKey: string; uriTemplate: string; params?: Record<string, string> };
    }
  | {
      type: "tool";
      config: { name: string; params?: Record<string, any> };
    }
  | {
      type: "structuredOutput";
      config: { schema: any; prompt: string; model?: string };
    };

export type DataSourceOption = { key: string; label: string };
export type DataSourceResourceOption = DataSourceOption & {
  serverKey: string;
  uri: string;
};
export type DataSourceResourceTemplateOption = DataSourceOption & {
  serverKey: string;
  uriTemplate: string;
};
export type DataSourceToolOption = DataSourceOption & {
  name: string;
  inputSchema?: any;
};
export type DataSourceStructuredOutputOption = DataSourceOption & {
  schema: any;
};

export type DataSourceModelOption = DataSourceOption;

export type DataSourceFormProps = {
  value?: DataSourceFormValue | null;
  onChange: (next: DataSourceFormValue | null) => void;
  disabled?: boolean;
  typeOptions?: Array<{ value: "" | DataSourceType; label: string }>;
  resourceOptions?: DataSourceResourceOption[];
  resourceTemplateOptions?: DataSourceResourceTemplateOption[];
  toolOptions?: DataSourceToolOption[];
  structuredOutputOptions?: DataSourceStructuredOutputOption[];
  modelOptions?: DataSourceModelOption[];
};

const templateParamRegex = /{([^{}]+)}/g;

const extractTemplateParams = (template: string) => {
  const raw = String(template ?? "");
  const params = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = templateParamRegex.exec(raw))) {
    const key = match[1]?.trim();
    if (key) params.add(key);
  }
  return Array.from(params.values());
};

const buildParamsSchema = (names: string[]) => ({
  type: "object",
  properties: names.reduce<Record<string, any>>((acc, name) => {
    acc[name] = { type: "string", title: name };
    return acc;
  }, {}),
  required: [],
});

const pickParams = (params: Record<string, any> | undefined, names: string[]) =>
  names.reduce<Record<string, any>>((acc, name) => {
    if (params && params[name] !== undefined) acc[name] = params[name];
    return acc;
  }, {});

export const DataSourceForm: React.FC<DataSourceFormProps> = ({
  value,
  onChange,
  disabled,
  typeOptions,
  resourceOptions = [],
  resourceTemplateOptions = [],
  toolOptions = [],
  structuredOutputOptions = [],
  modelOptions = [],
}) => {
  const { t } = useTranslation();
  const { Input, TextArea, Select, Alert } = useTheme();
  const SelectComponent = Select || "select";

  const typeSelectOptions = useMemo(
    () =>
      typeOptions ?? [
        { value: "", label: t("dataSource.none") },
        { value: "url", label: t("dataSource.types.url") },
        { value: "resource", label: t("dataSource.types.resource") },
        { value: "resourceTemplate", label: t("dataSource.types.resourceTemplate") },
        { value: "tool", label: t("dataSource.types.tool") },
        { value: "structuredOutput", label: t("dataSource.types.structuredOutput") },
      ],
    [typeOptions, t]
  );

  const selectedType = value?.type ?? "";

  const onTypeChange = (nextType: "" | DataSourceType) => {
    if (!nextType) {
      onChange(null);
      return;
    }
    if (value?.type === nextType) return;

    switch (nextType) {
      case "url":
        onChange({ type: "url", config: { url: "", params: {} } });
        return;
      case "resource":
        onChange({ type: "resource", config: { serverKey: "", uri: "" } });
        return;
      case "resourceTemplate":
        onChange({
          type: "resourceTemplate",
          config: { serverKey: "", uriTemplate: "", params: {} },
        });
        return;
      case "tool":
        onChange({ type: "tool", config: { name: "", params: {} } });
        return;
      case "structuredOutput":
        onChange({ type: "structuredOutput", config: { schema: {}, prompt: "", model: "" } });
        return;
      default:
        return;
    }
  };

  const urlParamNames = useMemo(
    () => (value?.type === "url" ? extractTemplateParams(value.config.url) : []),
    [value]
  );

  const templateParamNames = useMemo(
    () =>
      value?.type === "resourceTemplate"
        ? extractTemplateParams(value.config.uriTemplate)
        : [],
    [value]
  );

  const selectedTool = useMemo(
    () => (value?.type === "tool" ? toolOptions.find((t) => t.name === value.config.name) : undefined),
    [toolOptions, value]
  );

  const selectedSchemaId = useMemo(() => {
    if (value?.type !== "structuredOutput") return "";
    const current = JSON.stringify(value.config.schema ?? {});
    const hit = structuredOutputOptions.find((opt) => JSON.stringify(opt.schema ?? {}) === current);
    return hit?.key ?? "";
  }, [structuredOutputOptions, value]);

  const selectedResourceKey = useMemo(() => {
    if (value?.type !== "resource") return "";
    return (
      resourceOptions.find(
        (opt) => opt.uri === value.config.uri && opt.serverKey === value.config.serverKey
      )?.key ?? ""
    );
  }, [resourceOptions, value]);

  const selectedResourceTemplateKey = useMemo(() => {
    if (value?.type !== "resourceTemplate") return "";
    return (
      resourceTemplateOptions.find(
        (opt) =>
          opt.uriTemplate === value.config.uriTemplate && opt.serverKey === value.config.serverKey
      )?.key ?? ""
    );
  }, [resourceTemplateOptions, value]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SelectComponent
        values={[selectedType || ""]}
        label={t("dataSource.type")}
        options={typeSelectOptions}
        valueTitle={
          typeSelectOptions.find((opt) => opt.value === selectedType)?.label ?? t("dataSource.none")
        }
        disabled={disabled}
        onChange={(e: any) =>
          onTypeChange((e?.target?.value ?? e?.currentTarget?.value ?? e) as any)
        }
        aria-label={t("dataSource.type")}
      >
        {typeSelectOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </SelectComponent>

      {value?.type === "url" && (
        <>
          <Input
            label={t("dataSource.url")}
            value={value.config.url}
            disabled={disabled}
            onChange={(e: any) => {
              const url = String(e?.target?.value ?? e ?? "");
              const paramNames = extractTemplateParams(url);
              const nextParams = pickParams(value.config.params, paramNames);
              onChange({
                type: "url",
                config: {
                  ...value.config,
                  url,
                  params: nextParams,
                },
              });
            }}
          />
          {urlParamNames.length > 0 && (
            <ToolForm
              inputSchema={buildParamsSchema(urlParamNames)}
              values={pickParams(value.config.params, urlParamNames)}
              onChange={(params) =>
                onChange({
                  type: "url",
                  config: { ...value.config, params },
                })
              }
              disabled={disabled}
            />
          )}
        </>
      )}

      {value?.type === "resource" && (
        <SelectComponent
          values={[selectedResourceKey || ""]}
          label={t("dataSource.resource")}
          options={resourceOptions}
          valueTitle={
            resourceOptions.find((opt) => opt.uri === value.config.uri)?.label ?? t("select")
          }
          disabled={disabled}
          onChange={(e: any) => {
            const nextKey = e?.target?.value ?? e?.currentTarget?.value ?? e;
            const next = resourceOptions.find((opt) => opt.uri === nextKey || opt.key === nextKey);
            if (!next) return;
            onChange({
              type: "resource",
              config: { serverKey: next.serverKey, uri: next.uri },
            });
          }}
          aria-label={t("dataSource.resource")}
        >
          <option value="">{t("select")}</option>
          {resourceOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </SelectComponent>
      )}

      {value?.type === "resourceTemplate" && (
        <>
          <SelectComponent
            values={[selectedResourceTemplateKey || ""]}
            label={t("dataSource.resourceTemplate")}
            options={resourceTemplateOptions}
            valueTitle={
              resourceTemplateOptions.find((opt) => opt.uriTemplate === value.config.uriTemplate)?.label ??
              t("select")
            }
            disabled={disabled}
            onChange={(e: any) => {
              const nextKey = e?.target?.value ?? e?.currentTarget?.value ?? e;
              const next = resourceTemplateOptions.find(
                (opt) => opt.uriTemplate === nextKey || opt.key === nextKey
              );
              if (!next) return;
              const paramNames = extractTemplateParams(next.uriTemplate);
              const nextParams = pickParams(value.config.params, paramNames);
              onChange({
                type: "resourceTemplate",
                config: {
                  serverKey: next.serverKey,
                  uriTemplate: next.uriTemplate,
                  params: nextParams,
                },
              });
            }}
            aria-label={t("dataSource.resourceTemplate")}
          >
            <option value="">{t("select")}</option>
            {resourceTemplateOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </SelectComponent>
          {templateParamNames.length > 0 && (
            <ToolForm
              inputSchema={buildParamsSchema(templateParamNames)}
              values={pickParams(value.config.params, templateParamNames)}
              onChange={(params) =>
                onChange({
                  type: "resourceTemplate",
                  config: { ...value.config, params },
                })
              }
              disabled={disabled}
            />
          )}
        </>
      )}

      {value?.type === "tool" && (
        <>
          <SelectComponent
            values={[value.config.name || ""]}
            label={t("dataSource.tool")}
            options={toolOptions}
            valueTitle={toolOptions.find((opt) => opt.name === value.config.name)?.label ?? t("select")}
            disabled={disabled}
            onChange={(e: any) => {
              const nextKey = e?.target?.value ?? e?.currentTarget?.value ?? e;
              const next = toolOptions.find((opt) => opt.name === nextKey || opt.key === nextKey);
              if (!next) return;
              onChange({
                type: "tool",
                config: { name: next.name, params: value.config.params ?? {} },
              });
            }}
            aria-label={t("dataSource.tool")}
          >
            <option value="">{t("select")}</option>
            {toolOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </SelectComponent>
          {selectedTool && (
            <ToolForm
              inputSchema={selectedTool.inputSchema ?? { type: "object", properties: {} }}
              values={value.config.params ?? {}}
              onChange={(params) =>
                onChange({
                  type: "tool",
                  config: { ...value.config, params },
                })
              }
              disabled={disabled}
            />
          )}
        </>
      )}

      {value?.type === "structuredOutput" && (
        <>
          <SelectComponent
            values={[selectedSchemaId || ""]}
            label={t("structuredOutput")}
            options={structuredOutputOptions}
            valueTitle={
              structuredOutputOptions.find((opt) => opt.key === selectedSchemaId)?.label ?? t("select")
            }
            disabled={disabled}
            onChange={(e: any) => {
              const nextKey = e?.target?.value ?? e?.currentTarget?.value ?? e;
              const next = structuredOutputOptions.find((opt) => opt.key === nextKey);
              if (!next) return;
              const schemaCopy = JSON.parse(JSON.stringify(next.schema ?? {}));
              onChange({
                type: "structuredOutput",
                config: { ...value.config, schema: schemaCopy },
              });
            }}
            aria-label={t("dataSource.structuredOutput")}
          >
            <option value="">{t("select")}</option>
            {structuredOutputOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </SelectComponent>

          {!selectedSchemaId && (
            <Alert variant="warning">{t("dataSource.structuredOutputMissingSchema")}</Alert>
          )}

          <TextArea
            label={t("dataSource.prompt")}
            value={value.config.prompt}
            readOnly={disabled}
            onChange={(next: string) =>
              onChange({
                type: "structuredOutput",
                config: { ...value.config, prompt: String(next ?? "") },
              })
            }
          />

          {modelOptions.length > 0 ? (
            <SelectComponent
              values={[value.config.model || ""]}
              label={t("dataSource.model")}
              options={modelOptions}
              valueTitle={modelOptions.find((opt) => opt.key === value.config.model)?.label ?? t("optional")}
              disabled={disabled}
              onChange={(e: any) =>
                onChange({
                  type: "structuredOutput",
                  config: {
                    ...value.config,
                    model: String(e?.target?.value ?? e ?? ""),
                  },
                })
              }
              aria-label={t("dataSource.model")}
            >
              <option value="">{t("optional")}</option>
              {modelOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </SelectComponent>
          ) : (
            <Input
              label={t("dataSource.model")}
              value={value.config.model ?? ""}
              disabled={disabled}
              onChange={(e: any) =>
                onChange({
                  type: "structuredOutput",
                  config: { ...value.config, model: String(e?.target?.value ?? e ?? "") },
                })
              }
            />
          )}
        </>
      )}
    </div>
  );
};
