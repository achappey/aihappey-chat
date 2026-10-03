import { useEffect, useState } from "react";
import type { FileUIPart } from "aihappey-ai";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { createUrlAttachment, createUrlFilePart, isHttpUrl, resolveUrlMediaType, validMediaType, type UrlAttachment } from "./urlAttachment";

type Props = { open: boolean; onHide: () => void } & (
  | { mode?: "file"; onAdd: (part: FileUIPart) => void }
  | { mode: "url"; onAdd: (part: UrlAttachment) => void }
);

/** Chat requires a media type; image/video URL inputs deliberately do not. */
export const UrlAttachmentModal = (props: Props) => {
  const { open, onHide } = props;
  const requiresMediaType = props.mode !== "url";
  const { Modal, Button, Input, Select, Alert, Spinner } = useTheme();
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [detected, setDetected] = useState<string>();
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!requiresMediaType || !open || !isHttpUrl(url.trim())) {
      setDetected(undefined);
      setPending(false);
      return;
    }
    let current = true;
    setPending(true);
    setDetected(undefined);
    const timer = setTimeout(() => {
      void resolveUrlMediaType(url.trim()).then((type) => {
        if (current) setDetected(type);
      }).finally(() => {
        if (current) setPending(false);
      });
    }, 400);
    return () => { current = false; clearTimeout(timer); };
  }, [open, url, requiresMediaType]);

  const close = () => {
    setUrl(""); setDetected(undefined); setSelected(""); setCustom(""); setPending(false); setError("");
    onHide();
  };
  const mediaType = selected === "custom" ? validMediaType(custom) : selected || detected;
  const submit = () => {
    if (!isHttpUrl(url.trim())) { setError(t("urlAttachment.invalidUrl")); return; }
    if (props.mode === "url") {
      props.onAdd(createUrlAttachment(url));
    } else {
      if (!mediaType || pending) { setError(t("urlAttachment.selectMediaType")); return; }
      props.onAdd(createUrlFilePart(url, mediaType));
    }
    close();
  };
  const common = ["text/html", "text/plain", "application/pdf", "application/json", "image/png", "image/jpeg", "image/webp", "audio/mpeg", "video/mp4"];

  return <Modal show={open} onHide={close} title={t("urlAttachment.title")}
    actions={<>
      <Button type="button" variant="secondary" onClick={close}>{t("cancel")}</Button>
      <Button type="button" onClick={submit} disabled={!isHttpUrl(url.trim()) || (requiresMediaType && (pending || !mediaType))}>{t("add")}</Button>
    </>}>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input label={t("urlAttachment.url")} type="url" value={url} onChange={(e: any) => { setUrl(e.target.value); setError(""); }} />
      {requiresMediaType && <>
      {pending && <div><Spinner size="sm" /> {t("urlAttachment.detecting")}</div>}
      {detected && <div>{t("urlAttachment.detected", { mediaType: detected })}</div>}
      <Select value={selected} label={t("urlAttachment.mediaType")}
        onChange={(value: any) => { setSelected(typeof value === "string" ? value : value?.target?.value ?? ""); setError(""); }}>
        <option value="">{detected ? t("urlAttachment.useDetected") : t("urlAttachment.chooseMediaType")}</option>
        {common.map(type => <option value={type} key={type}>{type}</option>)}
        <option value="custom">{t("urlAttachment.custom")}</option>
      </Select>
      {selected === "custom" && <Input label={t("urlAttachment.customMediaType")} value={custom}
        onChange={(e: any) => { setCustom(e.target.value); setError(""); }} />}
      {!detected && !pending && isHttpUrl(url.trim()) && <div>{t("urlAttachment.selectMediaType")}</div>}
      {selected === "custom" && custom && !validMediaType(custom) && <Alert variant="danger">{t("urlAttachment.invalidMediaType")}</Alert>}
      </>}
      {error && <Alert variant="danger">{error}</Alert>}
    </div>
  </Modal>;
};
