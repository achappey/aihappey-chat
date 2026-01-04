import { useTranslation } from "aihappey-i18n";
import { useMemo, useState, useEffect } from "react";
import { PromptCard, useTheme } from "aihappey-components";
import { PromptWithSource } from "./PromptSelectButton";

type PromptSelectModalProps = {
  prompts: PromptWithSource[];
  open: boolean;
  onPromptClick: (p: PromptWithSource) => void;
  onHide: () => void;
};

export const PromptSelectModal = ({
  prompts,
  open,
  onPromptClick,
  onHide,
}: PromptSelectModalProps) => {
  const { Modal, Tabs, Tab, Button } = useTheme();
  const { t } = useTranslation();

  const getPromptUrl = (prompt: PromptWithSource) => {
    const rootUrl = window.location.origin;
    const params = new URLSearchParams({
      mcpServer: encodeURI(prompt._url!),
      promptName: prompt.name,
    }).toString();
    return `${rootUrl}/?${params}`;
  };

  const servers = useMemo(() => {
    const map = new Map<string, string>();

    for (const p of prompts) {
      if (!p._serverName) continue;
      if (!map.has(p._serverName)) {
        map.set(p._serverName, p._serverTitle ?? p._serverName);
      }
    }

    return Array.from(map.entries()).map(([key, title]) => ({
      key,
      title,
    }));
  }, [prompts]);

  const defaultTab = servers[0]?.key ?? "";
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setActiveTab("");
      return;
    }

    if (!activeTab && defaultTab) {
      setActiveTab(defaultTab);
      return;
    }

    if (activeTab && !servers.some(s => s.key === activeTab) && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab, servers, activeTab]);


  const close = () => {
    onHide();
    // optional: reset immediately (or keep it and let effect handle it)
    setActiveTab("");
  };

  return (
    <Modal
      show={open}
      onHide={close}
      actions={<Button variant="secondary"
        onClick={close}>
        {t("close")}
      </Button>}
      title={t("mcp.prompts")}
    >
      <Tabs
        activeKey={activeTab}
        onSelect={(k: string | null) => {
          if (k) setActiveTab(k);
        }}
      >
        {servers.map(({ key, title }) => (
          <Tab key={key} eventKey={key} title={title}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 8 }}>
              {prompts
                .filter(p => p._serverName === key)
                .map((prompt, idx) => (
                  <PromptCard
                    key={prompt.name + idx}
                    prompt={prompt}
                    onSelect={() => onPromptClick(prompt)}
                    getPromptUrl={getPromptUrl}
                  />
                ))}

              {prompts.filter(p => p._serverName === key).length === 0 && (
                <div style={{ opacity: 0.6, fontStyle: "italic" }}>
                  {t("mcp.noPrompts")}
                </div>
              )}
            </div>
          </Tab>
        ))}
      </Tabs>

    </Modal>
  );
};
