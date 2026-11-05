import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { AttachmentButton } from "../../../../buttons/AttachmentButton";
import { FileTags } from "../../../../fields/FileTags";

export type OpenAIImageMarkup = { file_id?: string; image_url?: string };

export const imageFileToMarkup = async (file: File): Promise<OpenAIImageMarkup> => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return { image_url: `data:${file.type || "image/png"};base64,${btoa(binary)}` };
};

/** Provider-owned overlay: never adds a field to the generic image request contract. */
export const OpenAIImageMarkupField = ({ value, onChange }: {
  value?: OpenAIImageMarkup;
  onChange: (value: OpenAIImageMarkup | undefined) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [filename, setFilename] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const sequence = useRef(0);
  const change = useRef(onChange);
  change.current = onChange;
  useEffect(() => () => { sequence.current++; }, []);

  const select = async (files: File[]) => {
    if (!files.length) return;
    const current = ++sequence.current;
    setLoading(true); setError(undefined);
    try {
      const markup = await imageFileToMarkup(files[0]);
      if (sequence.current !== current) return;
      setFilename(files[0].name); change.current(markup);
    } catch {
      if (sequence.current === current) setError(t("providers:openai.imageMarkupFailed"));
    } finally {
      if (sequence.current === current) setLoading(false);
    }
  };
  const clear = () => {
    sequence.current++; setLoading(false); setFilename(undefined); setError(undefined); change.current(undefined);
  };
  const label = t("providers:openai.imageMarkup");
  const tag = value ? new File([], filename ?? value.file_id ?? "markup.png") : undefined;
  return <div role="group" aria-label={label} style={{ marginTop: 14 }}
    onDragOver={event => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "copy"; }}
    onDrop={event => {
      event.preventDefault(); event.stopPropagation();
      void select(Array.from(event.dataTransfer.files));
    }}>
    <div style={{ marginBottom: 8 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <AttachmentButton disabled={loading} onFilesSelected={files => void select(files)} />
      <theme.Button icon="dismiss" title={t("delete")} disabled={!value && !loading} onClick={clear} />
      {tag && <FileTags files={[tag]} removeFile={clear} />}
    </div>
    {error && <div role="alert">{error}</div>}
    {value?.image_url && <img src={value.image_url} alt={label}
      style={{ width: 96, height: 96, objectFit: "contain", marginTop: 10 }} />}
  </div>;
};
