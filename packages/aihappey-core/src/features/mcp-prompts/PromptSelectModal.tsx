import { useTranslation } from "aihappey-i18n";
import { useMemo, useState, useEffect } from "react";
import { useTheme } from "aihappey-components";

import { CancelButton } from "../../ui/buttons/CancelButton";
import { PromptCard } from "./PromptCard";
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

  const serverNames = useMemo(() => {
    const seen = new Set<string>();
    return prompts
      .map((p) => p._serverName)
      .filter((name): name is string => !!name && !seen.has(name) && (seen.add(name), true));
  }, [prompts]);

  const defaultTab = serverNames[0] ?? "";
  const [activeTab, setActiveTab] = useState<string>("");

  // 👇 ensure a tab is selected once serverNames arrives
  useEffect(() => {
    if (!open) {
      setActiveTab("");
      return;
    }

    if (!activeTab && defaultTab) {
      setActiveTab(defaultTab);
      return;
    }

    if (activeTab && !serverNames.includes(activeTab) && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab, serverNames, activeTab]);

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
        {serverNames.map((name) => (
          <Tab key={name} eventKey={name} title={name}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 8 }}>
              {prompts
                .filter((p) => p._serverName === name)
                .map((prompt, idx) => (
                  <PromptCard
                    key={prompt.name + idx}
                    prompt={prompt}
                    onSelect={() => onPromptClick(prompt)}
                  />
                ))}

              {prompts.filter((p) => p._serverName === name).length === 0 && (
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
