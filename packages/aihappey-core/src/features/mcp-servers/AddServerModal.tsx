import { useState } from "react";
import { useAppStore } from "aihappey-state";
import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";
import { useMcpHeadersEditor } from "./useMcpHeadersEditor";

type Props = {
  show: boolean;
  onHide: () => void;
};

export function transformUrl(url: string): string {
  try {
    const u = new URL(url);

    const host = u.hostname;
    const reversedHost = host.split(".").reverse().join(".");
    const path = u.pathname.startsWith("/") ? u.pathname : "/" + u.pathname;

    const isLocal = host === "localhost" || host === "127.0.0.1";
    return isLocal ? `${host}${path}` : `${reversedHost}${path}`;
  } catch {
    return "";
  }
}


export const AddServerModal = (props: Props) => props.show ? <AddServerForm {...props} /> : null;

const AddServerForm = ({ show, onHide }: Props) => {
  const { Modal, Button, Input } = useTheme();
  const { t } = useTranslation();
  const addMcpServer = useAppStore((s) => s.addMcpServer);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const [url, setUrl] = useState("");
  const editor = useMcpHeadersEditor();
  const nameExists = Object.keys(mcpServers).includes(transformUrl(url).toLowerCase());
  let validUrl = false;
  try { validUrl = ["https:", "http:"].includes(new URL(url).protocol); } catch { /* Incomplete URL. */ }

  const handleAdd = () => {
    if (!validUrl || nameExists || editor.error) return;
    const withoutProtocol = transformUrl(url);
    const cfg: any = {
      url,
      disabled: true,
      type: "http",
      headers: editor.headers,
    };

    addMcpServer(withoutProtocol, {
      config: cfg
    });
    setUrl("");
    onHide();
  };

  const hide = () => {
    setUrl("");
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      title={t("manageServersModal.add")}
      actions={
        <>
          <Button onClick={hide} variant="subtle" type="button">
            {t("cancel")}
          </Button>
          <Button onClick={handleAdd} disabled={!validUrl || nameExists || !!editor.error} type="button">
            {t("ok")}
          </Button>
        </>
      }
    >
      <div>
        <Input
          placeholder={t("manageServersModal.url")}
          value={url}
          required
          label={t("manageServersModal.url")}
          onChange={(e: any) => {
            setUrl(e.target.value);
          }}
          style={{ flex: 2 }}
        />
        {editor.content}

        {nameExists && (
          <div style={{ color: "#c00", fontSize: 12, marginBottom: 8 }}>
            {t("manageServersModal.nameExists")}
          </div>
        )}
      </div>
    </Modal>
  );
};
