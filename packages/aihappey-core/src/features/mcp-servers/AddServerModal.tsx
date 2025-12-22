import { useState, useMemo } from "react";
import { useAppStore } from "aihappey-state";
import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";

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


export const AddServerModal = ({ show, onHide }: Props) => {
  const { Modal, Button, Input, TextArea } = useTheme();
  const { t } = useTranslation();
  const addMcpServer = useAppStore((s) => s.addMcpServer);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState("");
  const nameExists = url && Object.keys(mcpServers).includes(transformUrl(url))

  // Memoised header validation (avoids state updates during render)
  const { error: headersError, parsedHeaders } = useMemo(() => {
    if (headers.trim() === "") {
      return { error: null, parsedHeaders: undefined };
    }
    try {
      const parsed = JSON.parse(headers);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed) &&
        Object.values(parsed).every((v) => typeof v === "string")
      ) {
        return {
          error: null,
          parsedHeaders: parsed as Record<string, string>,
        };
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


  const handleAdd = () => {
    const withoutProtocol = transformUrl(url);
    const cfg: any = {
      url,
      disabled: true,
      type: "http",
      headers: {},
    };

    if (parsedHeaders) {
      cfg.headers = parsedHeaders;
    }
    addMcpServer(withoutProtocol, {
      config: cfg
    });
    setUrl("");
    setHeaders("");
    onHide();
  };

  const hide = () => {
    setUrl("");
    setHeaders("");
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
          <Button onClick={handleAdd} type="button">
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
        <div style={{ marginBottom: 8 }}>
          <TextArea
            rows={3}
            label={t("manageServersModal.headers")}
            placeholder='{ "X-My-Header": "value" }'
            value={headers}
            style={{ width: "100%" }}
            onChange={(v: any) => {
              setHeaders(typeof v === "string" ? v : v?.target?.value ?? "");
            }}
          />
          {headersError && (
            <div style={{ color: "#c00", fontSize: 12, marginTop: 2 }}>
              {headersError}
            </div>
          )}
          {!headersError && headers.trim() !== "" && (
            <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
              {t("manageServersModal.headersInfo") ||
                "JSON object of extra headers"}
            </div>
          )}
        </div>

        {nameExists && (
          <div style={{ color: "#c00", fontSize: 12, marginBottom: 8 }}>
            {t("manageServersModal.nameExists")}
          </div>
        )}
      </div>
    </Modal>
  );
};
