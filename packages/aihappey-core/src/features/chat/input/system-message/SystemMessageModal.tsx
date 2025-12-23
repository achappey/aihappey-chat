
import { useState } from "react";
import { getSystemMessagePartLabel } from "./getSystemMessagePartLabel";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";

import { useChatContext } from "../../context/ChatContext";
import { useTools } from "../../../tools/useTools";

export interface SystemMessageModalProps {
  open: boolean;
  systemMsg: any
  appName: string
  onClose: () => void;
 // tools: any[],
  /** Optional override for rendering each part */
  renderPart?: (part: any, index: number, active: boolean) => React.ReactNode;
}

function isJsonString(str: string) {
  try {
    const val = JSON.parse(str);
    return typeof val === "object" && val !== null;
  } catch {
    return false;
  }
}

export const SystemMessageModal = ({
  open,
  onClose,
  appName,
  systemMsg,
 // tools = [],
  renderPart,
}: SystemMessageModalProps) => {
  const { t } = useTranslation();
    const { tools } = useTools();

  const { Modal, Tabs, Tab, TextArea, JsonViewer, Card, Badge, Button } = useTheme();
  const hasTools = Array.isArray(tools) && tools.length > 0;
  const defaultTab = hasTools ? "tools" : "0";
  const [activeTab, setActiveTab] = useState(defaultTab);
  if (!systemMsg?.parts?.length) return null;

  const close = () => {
    onClose();
    setTimeout(() => {
      setActiveTab(defaultTab);
    }, 200);
  };

  const defaultRenderPart = (part: any, idx: number, active: boolean) => {
    if (!active) return null;
    if (isJsonString(part.text)) return <JsonViewer value={part.text} />;
    return <TextArea value={part.text} readOnly />;
  };

  return (
    <Modal show={open}
      size="large"
      actions={
        <>
          <Button variant="secondary" onClick={close}>
            {t("close")}
          </Button>
        </>
      }
      onHide={close}
      title={t("context")}>
      <Tabs activeKey={activeTab} onSelect={setActiveTab}>
        {hasTools && (
          <Tab eventKey="tools"
            key="tools"
            title={t("mcp.tools") + " (" + tools?.length + ")"}>
            <div style={{ display: "grid", gap: 12 }}>
              {tools.map((tool, i) => {
                const ro = !!tool.annotations?.readOnlyHint;
                const idem = !!tool.annotations?.idempotentHint;
                const des = !!tool.annotations?.destructiveHint;
                const ow = !!tool.annotations?.openWorldHint;

                const hasAnyFlag = ro || idem || des || ow;

                return (
                  <Card
                    key={i}
                    title={tool.title ?? tool.name ?? t("tool")}
                    description={tool.description ?? ""}
                    actions={
                      hasAnyFlag ? (
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          {ow && <Badge >{t("annotations.openWorld")}</Badge>}
                          {des && <Badge >{t("annotations.destructive")}</Badge>}
                          {idem && <Badge >{t("annotations.idempotent")}</Badge>}
                          {ro && <Badge>{t("annotations.readOnly")}</Badge>}
                        </div>
                      ) : <></>
                    }
                  >
                    {tool.inputSchema && !!Object.keys(tool.inputSchema?.properties ?? {}).length && (
                      <details>
                        <summary>{t("input")}</summary>
                        <JsonViewer value={tool.inputSchema} />
                      </details>
                    )}
                  </Card>
                );
              })}

            </div>
          </Tab>
        )}

        {systemMsg.parts
          .map((part: any, idx: number) => {
            return (
              <Tab
                key={idx}
                eventKey={String(idx)}
                title={getSystemMessagePartLabel(
                  appName,
                  t,
                  part,
                  idx
                )}
              >
                {(renderPart ?? defaultRenderPart)(part, idx, activeTab === String(idx))}
              </Tab>
            )
          })
        }

      </Tabs>
    </Modal>
  );
};

