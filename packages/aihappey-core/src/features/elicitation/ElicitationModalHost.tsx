import { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";
import type { ElicitResult } from "@modelcontextprotocol/sdk/types";

import { ElicitationForm, useElicitMeta } from "./ElicitationForm";
import { elicitRuntime, useOpenElicits } from "../../runtime/mcp/elicitRuntime";

export const ElicitationModalHost = () => {
  const { Modal, Button } = useTheme();
  const { t } = useTranslation();
  const { withMeta } = useElicitMeta();

  const openElicits = useOpenElicits(elicitRuntime);
  const active = openElicits[0];
  const open = !!active;

  const [values, setValues] = useState<Record<string, any>>({});
  const [isValid, setIsValid] = useState(false);

  const respond = (action: "accept" | "decline" | "cancel") => {
    if (!active) return;

    const payload: ElicitResult =
      action === "accept"
        ? { action, content: values }
        : { action };

    elicitRuntime.respond(active.id, withMeta(payload));
  };

  return (
    <Modal
      show={open}
      onHide={() => {}}
      title={t("input") ?? "Input required"}
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="primary"
            disabled={!isValid}
            onClick={() => respond("accept")}
          >
            {t("mcp.accept")}
          </Button>

          <Button
            variant="informative"
            onClick={() => respond("decline")}
          >
            {t("mcp.decline")}
          </Button>

          <Button
            variant="subtle"
            onClick={() => respond("cancel")}
          >
            {t("mcp.cancel")}
          </Button>
        </div>
      }
    >
      {active && (
        <ElicitationForm
          params={active.request.params}
          onChange={({ values, isValid }) => {
            setValues(values);
            setIsValid(isValid);
          }}
        />
      )}
    </Modal>
  );
};
