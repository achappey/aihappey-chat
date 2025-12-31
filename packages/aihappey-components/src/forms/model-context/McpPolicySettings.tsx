import React from "react";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types";
import { useTheme } from "../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export interface McpPolicySettingsProps {
  policySettings?: Partial<ToolAnnotations>;
  toggle: (meta: keyof ToolAnnotations) => void;
}

export const McpPolicySettings: React.FC<
  McpPolicySettingsProps
> = ({ policySettings, toggle }) => {
  const { Card, Switch } = useTheme();
  const { t } = useTranslation();

  return (
    <Card size="small" title={t("mcpPage.policy")}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          alignItems: "center",
        }}
      >
        <Switch
          id="openWorld"
          label={t("annotations.openWorld")}
          checked={!!policySettings?.openWorldHint}
          onChange={() => toggle("openWorldHint")}
        />

        <Switch
          id="destructive"
          label={t("annotations.destructive")}
          checked={!!policySettings?.destructiveHint}
          onChange={() => toggle("destructiveHint")}
        />

        <Switch
          id="readOnly"
          label={t("annotations.readOnly")}
          checked={!!policySettings?.readOnlyHint}
          onChange={() => toggle("readOnlyHint")}
        />

        <Switch
          id="idempotent"
          label={t("annotations.idempotent")}
          checked={!!policySettings?.idempotentHint}
          onChange={() => toggle("idempotentHint")}
        />
      </div>
    </Card>
  );
};
