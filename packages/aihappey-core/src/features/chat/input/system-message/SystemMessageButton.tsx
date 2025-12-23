
import { useCallback, useState } from "react";
import { SystemMessageModal } from "./SystemMessageModal";
import { useTranslation } from "aihappey-i18n";
import { McpServerDetails } from "./McpServerDetails";
import { useSystemMessage } from "../../messages/useSystemMessage";
import { useTools } from "../../../tools/useTools";
import { useTheme } from "aihappey-components";

import { useChatContext } from "../../context/ChatContext";
import { Markdown } from "../../../../ui/markdown/Markdown";
import { chatAppInstructions } from "../../../../runtime/chat-app/chatAppInstructions";

/**
 * Opens a modal showing system message parts.
 * You can optionally override how each part is rendered (JSON, user context, etc.)
 */
export const SystemMessageButton = () => {
  const { Button, JsonViewer, TextArea, Card } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { config } = useChatContext();
  // const [activeMcpTab, setActiveMcpTab] = useState("0");
  const systemMsg = useSystemMessage();
  const appName = config.appName ?? "";
  // Optional override renderer (plug-and-play)
  const renderPart = useCallback((part: any, idx: number, active: boolean) => {
    if (!active) return null;

    // Detect JSON payloads
    try {
      const parsed = JSON.parse(part.text);
      if (parsed.systemInformation)
        return (
          <Card title={t("systemContext")}>

            <pre>{JSON.stringify(parsed.systemInformation, null, 2)}</pre>
          </Card>
        );
      if (parsed.username)
        return (
          <Card title={parsed.username}>
            <pre>{JSON.stringify(parsed, null, 2)}</pre>
          </Card>
        );

      if (parsed.chatBotInstructions)
        return (
          <Card title={appName}>
            <Markdown text={parsed.chatBotInstructions} />
          </Card>
        );

      if (parsed.modelContextProtocolServer)
        return <McpServerDetails parsed={parsed} />;

      // Fallback: generic JSON
      return <JsonViewer value={part.text} />;
    } catch {
      // Non-JSON fallback
      return <TextArea value={part.text} readOnly />;
    }
  }, [config, t]);

  return (
    <>
      <Button
        type="button"
        icon="eye"
        size="large"
        variant="transparent"
        onClick={() => setOpen(true)}
        title={t("context")}
      />
      <SystemMessageModal
        open={open}
        appName={appName}
        systemMsg={systemMsg}
        onClose={() => {
          setOpen(false);
        }}
        renderPart={renderPart}
      />
    </>
  );
};
