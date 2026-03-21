import { useEffect, useState } from "react";
import { ElicitationField } from "../../fields";
import type { ElicitRequest } from "@modelcontextprotocol/sdk/types";

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
