import type { FormEvent } from "react";

import { AttachmentButton, RerankingSettingsButton, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { defaultProviderRerankingMetadata, useAppStore } from "aihappey-state";

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

  const providerRerankingMetadata = useAppStore((s) => s.providerRerankingMetadata);
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
          <RerankingSettingsButton
            topN={topN}
            setTopN={setTopN}
            providerMetadata={providerRerankingMetadata ?? {}}
            setProviderMetadata={setProviderRerankingMetadata}
            resetDefaults={() => {
              setTopN(undefined);
              setProviderRerankingMetadata(defaultProviderRerankingMetadata);
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
        <h2>{t('files')}</h2>
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

