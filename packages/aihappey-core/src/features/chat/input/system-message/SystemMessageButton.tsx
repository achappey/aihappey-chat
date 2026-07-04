
import { useCallback, useState } from "react";
import { SystemMessageModal } from "./SystemMessageModal";
import { useTranslation } from "aihappey-i18n";
import { McpServerDetails } from "./McpServerDetails";
import { useSystemMessage } from "../../messages/useSystemMessage";
import { useTheme, ViewButton } from "aihappey-components";

import { useChatContext } from "../../context/ChatContext";
import { Markdown } from "../../../../ui/markdown/Markdown";

/**
 * Opens a modal showing system message parts.
 * You can optionally override how each part is rendered (JSON, user context, etc.)
 */
export const SystemMessageButton = () => {
  const { JsonViewer, TextArea, Card } = useTheme();
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
            <JsonViewer value={parsed.systemInformation} />
          </Card>
        );
      if (parsed.username)
        return (
          <Card title={parsed.username}>
            <JsonViewer title={t("user")} value={parsed} />
          </Card>
        );

      if (parsed.chatBotInstructions)
        return (
          <Card title={appName}>
            <Markdown text={parsed.chatBotInstructions} />
          </Card>
        );

      if (parsed.availableSkills)
        return (
          <Card title={t("skills") ?? "Skills"}>
            <div style={{ display: "grid", gap: 12 }}>
              {parsed.availableSkills.instructions ? (
                <Markdown text={parsed.availableSkills.instructions} />
              ) : null}
              {(parsed.availableSkills.skills ?? []).map((skill: any) => (
                <Card
                  key={skill.skill_id ?? skill.id ?? skill.name}
                  title={`${skill.name}${skill.skill_id ? ` (${skill.skill_id})` : ""}`}
                  description={skill.description ?? ""}
                />
              ))}
            </div>
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
      <ViewButton size="large"
        variant="transparent"
        onClick={() => setOpen(true)}
        title={t("context")} />

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
