import { useEffect, useState } from "react";
import { ElicitationField } from "../../fields";
import type { ElicitRequest } from "@modelcontextprotocol/sdk/types";

function toDateInputValue(value: any): string {
  const s = String(value);
  if (!s) return s;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;

  const pad = (n: number) => String(n).padStart(2, "0");

  return [
    d.getFullYear(),
    "-",
    pad(d.getMonth() + 1),
    "-",
    pad(d.getDate()),
  ].join("");
}

function toDateTimeLocalInputValue(value: any): string {
  const s = String(value);
  if (!s) return s;

  // Already datetime-local-ish, without timezone
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && !/[zZ]|[+-]\d{2}:\d{2}$/.test(s)) {
    return s.slice(0, 16);
  }

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;

  // Convert UTC/default ISO to browser local datetime-local value
  const pad = (n: number) => String(n).padStart(2, "0");

  return [
    d.getFullYear(),
    "-",
    pad(d.getMonth() + 1),
    "-",
    pad(d.getDate()),
    "T",
    pad(d.getHours()),
    ":",
    pad(d.getMinutes()),
  ].join("");
}

const isValidEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function coerceValueBySchema(schema: any, value: any) {
  if (value === undefined || value === null) return value;

  switch (schema.type) {
    case "boolean":
      return value === true || value === "true" || value === "1";
    case "integer":
      return value === "" ? value : Math.trunc(Number(value));
    case "number":
      return value === "" ? value : Number(value);
    case "array":
      return value;
    case "string":
      switch (schema.format) {
        case "date":
          return toDateInputValue(value);
        case "date-time":
          return toDateTimeLocalInputValue(value);
        default:
          return String(value);
      }

    default:
      return String(value);
  }
}

type Props = {
  params: ElicitRequest["params"];
  onChange?: (s: {
    values: Record<string, any>;
    isValid: boolean;
  }) => void;
};

export const ElicitationForm = ({ params, onChange }: Props) => {
  const { requestedSchema, message }: any = params;
  const { properties, required }: any = requestedSchema;

  const [values, setValues] = useState<Record<string, any>>(() => {
    const v: Record<string, any> = {};
    Object.entries(properties).forEach(([k, s]: any) => {
      if (s.default ?? s.defaultValue) {
        v[k] = coerceValueBySchema(s, s.default ?? s.defaultValue);
      } else if (s.type === "boolean") {
        v[k] = false;
      } else {
        v[k] = "";
      }
    });
    return v;
  });

  const isValid =
    required?.every((k: string) => {
      const field = properties[k];
      const value = values[k];
      if (value === "" || value === undefined) return false;
      if (field?.format === "email")
        return isValidEmail(value);
      return true;
    }) ?? true;

  useEffect(() => {
    onChange?.({ values, isValid });
  }, [values, isValid, onChange]);

  return (
    <>
      {message}

      {Object.entries(properties).map(([k, s]: any) => (
        <ElicitationField
          key={k}
          fieldName={k}
          field={s}
          value={values[k]}
          required={required?.includes(k)}
          onChange={(val) =>
            setValues((v) => ({ ...v, [k]: val }))
          }
        />
      ))}
    </>
  );
};
