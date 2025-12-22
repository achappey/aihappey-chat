import React from "react";
import { useTranslation } from "aihappey-i18n";
import { McpPolicySettings as McpPolicySettingsComponent } from "aihappey-components";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types";

export interface McpPolicySettingsProps {
  policySettings?: any;
  toggle: (meta: keyof ToolAnnotations) => void;
}

export const McpPolicySettings: React.FC<McpPolicySettingsProps> = ({
  policySettings,
  toggle
}) => {
  const { t } = useTranslation();

  return <McpPolicySettingsComponent
    policySettings={policySettings}
    cardTitle={t("mcpPage.policy")}
    translations={{
      readOnly: t("annotations.readOnly"),
      destructive: t("annotations.destructive"),
      idempotent: t("annotations.idempotent"),
      openWorld: t("annotations.openWorld")
    }}
    toggle={toggle} />
};
