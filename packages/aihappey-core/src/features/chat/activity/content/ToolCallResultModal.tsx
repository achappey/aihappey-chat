import { useState } from "react";
import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";
import { ContentBlockView } from "./ContentBlockView";
import { ToolCallResult } from "aihappey-types";
import { StructuredOutputView } from "./StructuredOutputView";
import { Markdown } from "../../../../ui/markdown/Markdown";

export interface ToolCallResultModalProps {
  open: boolean;
  onClose: () => void;
  result: ToolCallResult;
}

const tryParseJson: any = (input: any) => {
  if (typeof input !== "string") return null;

  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
};

export const ToolCallResultModal = ({
  open,
  onClose,
  result,
}: ToolCallResultModalProps) => {
  const { Modal, Button, Tabs, Tab, JsonViewer } = useTheme();
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
        {result.structuredContent && contentArr.length == 0 ? (
          <StructuredOutputView result={result} />
        ) : null}
        {contentArr.length > 0 ? (
          <Tabs activeKey={activeTab} onSelect={(k: string) => setActiveTab(k)}>

            {result.structuredContent && <Tab
              eventKey={"structuredContent"}
              title={t(`mcp.structuredContent`)}
            >
              <StructuredOutputView result={result} />
            </Tab>
            }
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

        {/* 3. Fallback */}
        {!result.structuredContent && contentArr.length === 0 && (() => {
          const raw = result as any;

          // Try JSON
          const parsed = tryParseJson(raw);
          if (parsed) {
            return <JsonViewer value={parsed} />;
          }

          // Try string fallback
          if (typeof raw === "string") {
            return <Markdown text={raw} />
          }

          // Last resort: stringify safely
          return (
            <JsonViewer value={raw} />
          );
        })()}

      </div>
    </Modal>
  );
};
