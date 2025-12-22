import { useState, useMemo } from "react";
import { useAppStore } from "aihappey-state";
import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";

type Props = {
  show: boolean;
  onHide: () => void;
  name: string;
};

export const EditServerModal = ({ show, onHide, name }: Props) => {
  const { Modal, Button, Input, TextArea } = useTheme();
  const { t } = useTranslation();
  const addMcpServer = useAppStore((s) => s.addMcpServer);
  const updateMcpServer = useAppStore((s) => s.updateMcpServer);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const server = mcpServers[name].config;
  const [headers, setHeaders] = useState(
    server?.headers ? JSON.stringify(server.headers, null, 2) : ""
  );

  const { error: headersError, parsedHeaders } = useMemo(() => {
    if (headers.trim() === "") return { error: null, parsedHeaders: undefined };
    try {
      const parsed = JSON.parse(headers);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed) &&
        Object.values(parsed).every((v) => typeof v === "string")
      ) {
        return { error: null, parsedHeaders: parsed as Record<string, string> };
      }
      
      return {
        error: 'Invalid JSON object: must be { "Header": "Value" }',
        parsedHeaders: undefined,
      };
    } catch {
      return {
        error: "Invalid JSON: must be a valid object",
        parsedHeaders: undefined,
      };
    }
  }, [headers]);

  const handleSave = () => {
    if (headersError) return;
    updateMcpServer(name, {
      ...server,
      headers: headers.trim() === "" ? undefined : parsedHeaders,
    });
    onHide();
  };
 // const remote = server.remotes?.find(a => a.type == "streamable-http");

  if (!server) return null;

  return (
    <Modal
      show={show}
      onHide={onHide}
      title={t("edit")}
      actions={
        <>
          <Button onClick={onHide} variant="subtle" type="button">
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!!headersError} type="button">
            {t("ok")}
          </Button>
        </>
      }
    >
      <div>
        <Input
          label={t("manageServersModal.name")}
          value={name}
          disabled
          style={{ flex: 1 }}
        />
        <Input
          label={t("manageServersModal.url")}
          value={server?.url}
          disabled
          style={{ flex: 2 }}
        />
        <div style={{ marginBottom: 8 }}>
          <TextArea
            rows={3}
            label={t("manageServersModal.headers")}
            placeholder='{ "X-My-Header": "value" }'
            value={headers}
            style={{ width: "100%" }}
            onChange={(v: any) => setHeaders(typeof v === "string" ? v : v?.target?.value ?? "")}
          />
          {headersError && (
            <div style={{ color: "#c00", fontSize: 12, marginTop: 2 }}>
              {headersError}
            </div>
          )}
          {!headersError && headers.trim() !== "" && (
            <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
              {t("manageServersModal.headersInfo") || "JSON object of extra headers"}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};