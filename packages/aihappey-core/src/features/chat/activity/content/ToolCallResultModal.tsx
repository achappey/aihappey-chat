import { useState } from "react";
import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";
import { ContentBlockView } from "./ContentBlockView";
import { ToolCallResult } from "aihappey-types";
import { StructuredOutputView } from "./StructuredOutputView";

export interface ToolCallResultModalProps {
  open: boolean;
  onClose: () => void;
  result: ToolCallResult;
}

export const ToolCallResultModal = ({
  open,
  onClose,
  result,
}: ToolCallResultModalProps) => {
  const { Modal, Button, Tabs, Tab } = useTheme();
  const { t } = useTranslation();

  // Try to get content array
  const contentArr = Array.isArray(result?.content) ? result.content : [];
  const [activeTab, setActiveTab] = useState("0");
  if (!open) return null;

  return (
    <Modal
      show={open}
      onHide={onClose}
      actions={<Button onClick={onClose}>{t("close")}</Button>}
      title={t("mcp.toolCallResult")}
    >
      <div>
        {result.structuredContent ? (
          <StructuredOutputView result={result} />
        ) : null}
        {!result.structuredContent && contentArr.length > 0 ? (
          <Tabs activeKey={activeTab} onSelect={(k: string) => setActiveTab(k)}>
            {contentArr.map((block: any, i: number) => (
              <Tab
                key={String(i)}
                eventKey={String(i)}
                title={t(`mcp.${block.type}`)}
              >
                <div style={{ padding: 8 }}>
                  <ContentBlockView block={block} />
                </div>
              </Tab>
            ))}
          </Tabs>
        ) : null}
      </div>
    </Modal>
  );
};
