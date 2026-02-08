import type { FormEvent } from "react";

import {
  AttachmentButton,
  RerankingSettingsButton,
  ResourceSelectButton,
  ResourceSelectModal,
  useTheme,
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { defaultProviderRerankingMetadata, useAppStore } from "aihappey-state";

import { ServerSelectButton } from "../mcp-servers/ServerSelectButton";
import { useResourceSelect } from "../chat/input/useResourceSelect";
import { readResource } from "../../runtime/mcp/readResource";
import { errorRuntime } from "../../runtime/chat-app/errorRuntime";

export const RerankingInput = ({
  value,
  onChange,
  onSend,
  onFilesSelected,
  onClearFiles,
  docsCount,
  processing,
  canSend,
}: {
  value: string;
  onChange: (next: string) => void;
  onSend: () => Promise<void>;
  onFilesSelected: (files: File[]) => void;
  onClearFiles: () => void;
  docsCount: number;
  processing: boolean;
  canSend: boolean;
}) => {
  const { t } = useTranslation();
  const { Button, TextArea } = useTheme();
  const resourceSelect = useResourceSelect();

  const providerRerankingMetadata = useAppStore((s) => s.providerRerankingMetadata);
  const enabledProviders = useAppStore((s) => s.enabledProvidersByType?.reranking ?? []);
  const setProviderRerankingMetadata = useAppStore((s) => s.setProviderRerankingMetadata);
  const topN = useAppStore((s) => s.topN);
  const setTopN = useAppStore((s) => s.setTopN);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    await onSend();
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h1>{t("reranking")}</h1>

      <TextArea
        value={value}
        autoFocus
        onChange={onChange}
        placeholder={t('rerankingPlaceholder')}
        style={styles.textArea}
      />

      <div style={styles.buttonRow}>
        <div style={styles.leftGroup}>
          <ServerSelectButton />

          <ResourceSelectButton
            disabled={resourceSelect.resources.length === 0}
            onClick={() => resourceSelect.setOpen(true)}
          />

          <RerankingSettingsButton
            topN={topN}
            setTopN={setTopN}
            enabledProviders={enabledProviders ?? []}
            providerMetadata={providerRerankingMetadata ?? {}}
            setProviderMetadata={setProviderRerankingMetadata}
            resetDefaults={() => {
              setTopN(undefined);
              setProviderRerankingMetadata(defaultProviderRerankingMetadata);
            }}
          />

          <ResourceSelectModal
            open={resourceSelect.open}
            resources={resourceSelect.resources}
            onHide={() => resourceSelect.setOpen(false)}
            onSelect={async (uri) => {
              resourceSelect.setOpen(false);

              const hit = resourceSelect.resolve(uri);
              if (!hit) return;

              try {
                const result = (await readResource(hit.serverKey, uri)) as any;
                const contents = Array.isArray(result?.contents)
                  ? (result.contents as any[])
                  : [];

                // Reranking-specific behavior:
                // - take only { uri, text } items
                // - ignore blob items
                // - each content item becomes a separate file
                const files: File[] = contents
                  .filter((c) => typeof c?.text === "string" && c.text.trim().length > 0)
                  .map((c) => {
                    const fileName = String(c?.uri ?? uri);
                    const text = String(c?.text ?? "");
                    const mimeType = typeof c?.mimeType === "string" ? c.mimeType : "text/plain";
                    return new File([text], fileName, { type: mimeType });
                  });

                if (files.length > 0) {
                  onFilesSelected(files);
                }
              } catch (e: any) {
                // Don't crash the reranking page on MCP errors.
                const message = e?.message ? String(e.message) : "Failed to read MCP resource";
                console.error("readResource() failed", e);
                errorRuntime.push({
                  type: "fetch",
                  severity: "error",
                  source: "mcp.readResource",
                  message,
                });
              }
            }}
          />

          <AttachmentButton icon="attachment" onFilesSelected={onFilesSelected} />

          <Button
            type="button"
            size="large"
            icon="dismiss"
            variant="subtle"
            disabled={processing || docsCount === 0}
            onClick={onClearFiles}
          />
        </div>

        <Button
          type="submit"
          size="large"
          disabled={!canSend}
          icon="send"
          title={processing ? "Reranking..." : "Send"}
        />
      </div>

      <div style={{ marginTop: 44 }}>
        <h2>{t('rerankings')}</h2>
      </div>
    </form>
  );
};

const styles: Record<string, React.CSSProperties> = {
  form: {
    maxWidth: 1056,
    margin: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "100%",
  },
  textArea: {
    resize: "vertical",
    maxHeight: 120,
    flex: 1,
  },
  buttonRow: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  leftGroup: {
    display: "flex",
    gap: 8,
    flex: 1,
    alignItems: "center",
  },
};

