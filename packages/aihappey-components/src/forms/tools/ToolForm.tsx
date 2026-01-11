import React, { useEffect, useMemo } from "react";
import { useTheme } from "../../theme/ThemeContext";

type ToolInputSchema = {
  type?: string;
  title?: string;
  description?: string;
  properties?: Record<string, any>;
  required?: string[];
};

type ToolFormValidation = {
  isValid: boolean;
  missingRequired: string[];
};

export type ToolFormProps = {
  /** Tool JSON Schema (object with properties). */
  inputSchema: ToolInputSchema;

  /** Controlled values (state is held outside this component). */
  values: Record<string, any>;
  /** Called with the next values object (copy-on-write). */
  onChange: (nextValues: Record<string, any>) => void;

  /** Optional: disable all inputs. */
  disabled?: boolean;

  /** If true, apply `default`/`defaultValue` into missing keys via `onChange` once. */
  applyDefaults?: boolean;

  /** Optional callback to observe validity derived from `required`. */
  onValidationChange?: (v: ToolFormValidation) => void;
};

function coerceValueBySchema(schema: any, value: any) {
  if (value === undefined || value === null) return value;

  switch (schema?.type) {
    case "boolean":
      return value === true || value === "true" || value === "1";
    case "integer":
      return value === "" ? value : Math.trunc(Number(value));
    case "number":
      return value === "" ? value : Number(value);
    default:
      return String(value);
  }
}

function isEmptyRequiredValue(value: any) {
  // boolean false is a valid explicit value
  if (value === false) return false;
  if (value === 0) return false;
  if (value === "") return true;
  return value === undefined || value === null;
}

function extractSelectValue(eOrValue: any) {
  return eOrValue?.target?.value ?? eOrValue?.currentTarget?.value ?? eOrValue;
}

type ToolFormFieldProps = {
  name: string;
  schema: any;
  value: any;
  required: boolean;
  disabled?: boolean;
  onChange: (nextValue: any) => void;
};

const ToolFormField: React.FC<ToolFormFieldProps> = ({
  name,
  schema,
  value,
  required,
  disabled,
  onChange,
}) => {
  const { Input, Select, Switch } = useTheme();
  const SelectComponent = Select || "select";

  const label = schema?.title || name;
  const hint = schema?.description;

  if (schema?.type === "boolean") {
    return (
      <div style={{ marginBottom: 12 }}>
        <Switch
          id={name}
          label={label}
          hint={hint}
          required={required}
          disabled={disabled}
          checked={!!value}
          onChange={(checked) => onChange(checked)}
        />
      </div>
    );
  }

  if (schema?.type === "string" && Array.isArray(schema?.oneOf) && schema.oneOf.length > 0) {
    const current = schema.oneOf.find((o: any) => o?.const === value);
    const options = schema.oneOf.map((o: any) => ({
      value: o?.const,
      label: o?.title ?? String(o?.const ?? ""),
    }));

    return (
      <div style={{ marginBottom: 12 }}>
        <SelectComponent
          values={[value ?? ""]}
          valueTitle={current?.title ?? (value != null ? String(value) : "")}
          label={label}
          hint={hint}
          required={required}
          disabled={disabled}
          options={options}
          onChange={(eOrValue: any) => onChange(extractSelectValue(eOrValue))}
          aria-label={label}
        >
          {schema.oneOf.map((opt: any, i: number) => (
            <option key={i} value={opt.const}>
              {opt.title ?? String(opt.const)}
            </option>
          ))}
        </SelectComponent>
      </div>
    );
  }

  const isNumber = schema?.type === "number" || schema?.type === "integer";

  return (
    <div style={{ marginBottom: 12 }}>
      <Input
        type={isNumber ? "number" : "text"}
        label={label}
        hint={hint}
        required={required}
        disabled={disabled}
        value={value ?? ""}
        onChange={(e: any) => {
          const raw = e?.target?.value;
          if (isNumber && raw === "") return onChange("");
          onChange(coerceValueBySchema(schema, raw));
        }}
        min={schema?.minimum}
        max={schema?.maximum}
        step={schema?.type === "integer" ? 1 : 0.1}
        minLength={schema?.minLength}
        maxLength={schema?.maxLength}
      />
    </div>
  );
};

export const ToolForm: React.FC<ToolFormProps> = ({
  inputSchema,
  values,
  onChange,
  disabled,
  applyDefaults = true,
  onValidationChange,
}) => {
  const { Alert } = useTheme();

  const properties = (inputSchema as any)?.properties ?? {};
  const required: string[] = (inputSchema as any)?.required ?? [];

  // Apply defaults once into missing keys (still controlled via `onChange`).
  useEffect(() => {
    if (!applyDefaults) return;

    const next: Record<string, any> = { ...(values ?? {}) };
    let changed = false;

    for (const [key, schema] of Object.entries(properties)) {
      if (next[key] !== undefined) continue;

      const d = (schema as any)?.default ?? (schema as any)?.defaultValue;
      if (d === undefined) continue;

      next[key] = coerceValueBySchema(schema, d);
      changed = true;
    }

    if (changed) onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyDefaults, inputSchema, onChange]);

  const validation: ToolFormValidation = useMemo(() => {
    const missingRequired = required.filter((k) => isEmptyRequiredValue(values?.[k]));
    return { missingRequired, isValid: missingRequired.length === 0 };
  }, [required, values]);

  useEffect(() => {
    onValidationChange?.(validation);
  }, [onValidationChange, validation]);

  if ((inputSchema as any)?.type && (inputSchema as any).type !== "object") {
    return (
      <Alert variant="warning">
        Unsupported schema: expected <code>type: "object"</code>
      </Alert>
    );
  }

  return (
    <div>
      {Object.entries(properties).map(([name, schema]) => (
        <ToolFormField
          key={name}
          name={name}
          schema={schema}
          value={values?.[name]}
          required={required.includes(name)}
          disabled={disabled}
          onChange={(nextValue) => onChange({ ...(values ?? {}), [name]: nextValue })}
        />
      ))}
    </div>
  );
};

