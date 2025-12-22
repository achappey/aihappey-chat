import { useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { ElicitationField } from "../fields";
import type { ElicitRequest, ElicitResult } from "@modelcontextprotocol/sdk/types";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

type Props = {
  params: ElicitRequest["params"];
  onRespond: (r: ElicitResult) => void;
  translations?: any
};

function coerceValueBySchema(schema: any, value: any) {
  if (value === undefined || value === null) return value;

  switch (schema.type) {
    case "boolean":
      if (typeof value === "boolean") return value;
      if (typeof value === "string")
        return value === "true" || value === "1";
      return Boolean(value);

    case "integer":
      if (typeof value === "number") return Math.trunc(value);
      if (typeof value === "string" && value !== "")
        return parseInt(value, 10);
      return value;

    case "number":
      if (typeof value === "number") return value;
      if (typeof value === "string" && value !== "")
        return Number(value);
      return value;

    case "string":
    default:
      return String(value);
  }
}


export const ElicitationForm = ({
  params,
  onRespond,
  translations
}: Props) => {
  const { Card, Button } = useTheme();
  const { requestedSchema, message }: any = params;
  const { properties, required }: any = requestedSchema;

  const [values, setValues] = useState<Record<string, any>>(() => {
    const v: Record<string, any> = {};

    Object.entries(properties).forEach(([k, s]: any) => {
      if (s.default !== undefined || s.defaultValue !== undefined) {
        v[k] = coerceValueBySchema(s, s.default ?? s.defaultValue);
        return;
      }

      switch (s.type) {
        case "boolean":
          v[k] = false;
          break;
        case "number":
        case "integer":
          v[k] = undefined;
          break;
        default:
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

      if (field?.format === "email") {
        return typeof value === "string" && isValidEmail(value);
      }

      return true;
    }) ?? true;


  const submit = (action: "cancel" | "accept" | "decline") =>
    onRespond(
      action === "accept"
        ? { action, content: values }
        : { action }
    );



  const actions = (
    <>
      <Button
        type="button"
        variant="primary"
        disabled={!isValid}
        onClick={() => submit("accept")}

      >
        {translations?.accept ?? "accept"}
      </Button>
      <Button
        type="button"
        variant="informative"
        onClick={() => submit("decline")}
      >
        {translations?.decline ?? "decline"}
      </Button>
      <Button
        type="button"
        variant="subtle"
        onClick={() => submit("cancel")}

      >
        {translations?.cancel ?? "cancel"}
      </Button>
    </>
  );

  return (
    <Card
      title=""
      style={{ backgroundColor: "transparent" }}
      actions={actions}
    >
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
    </Card>
  );
};