import React from "react";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types";
import { useTheme } from "../theme/ThemeContext";

export type McpPolicyTranslations = {
  openWorld: string;
  destructive: string;
  readOnly: string;
  idempotent: string;
};

export interface McpPolicySettingsProps {
  policySettings?: Partial<ToolAnnotations>;
  toggle: (meta: keyof ToolAnnotations) => void;
  translations?: McpPolicyTranslations;
  cardTitle?: string;
}

export const McpPolicySettings: React.FC<
  McpPolicySettingsProps
> = ({ policySettings, toggle, translations, cardTitle }) => {
  const { Card, Switch } = useTheme();

  return (
    <Card size="small" title={cardTitle ?? "policy"}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          alignItems: "center",
        }}
      >
        <Switch
          id="openWorld"
          label={translations?.openWorld ?? "openWorld"}
          checked={!!policySettings?.openWorldHint}
          onChange={() => toggle("openWorldHint")}
        />

        <Switch
          id="destructive"
          label={translations?.destructive ?? "destructive"}
          checked={!!policySettings?.destructiveHint}
          onChange={() => toggle("destructiveHint")}
        />

        <Switch
          id="readOnly"
          label={translations?.readOnly ?? "readOnly"}
          checked={!!policySettings?.readOnlyHint}
          onChange={() => toggle("readOnlyHint")}
        />

        <Switch
          id="idempotent"
          label={translations?.idempotent ?? "idempotent"}
          checked={!!policySettings?.idempotentHint}
          onChange={() => toggle("idempotentHint")}
        />
      </div>
    </Card>
  );
};
