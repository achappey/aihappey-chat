import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import type { DocsEndpointDoc, DocsEndpointTestConfig, DocsEndpointTestField, DocsEndpointTestHeader, DocsEndpointTestResponseType } from "../navigation/types";
import { docsBorderStyle, docsCodeStyle, docsMutedTextStyle, docsSubtleSurfaceStyle } from "../theme/docsThemeStyles";
import { useDocsTheme } from "../theme/useDocsTheme";
import { useDocsTranslation } from "aihappey-docs-i18n";

type HeaderRow = DocsEndpointTestHeader & {
  id: string;
};

type FieldRow = DocsEndpointTestField & {
  id: string;
};

type TestResult = {
  status: number;
  statusText: string;
  ok: boolean;
  elapsedMs: number;
  contentType: string;
  headers: Array<{ name: string; value: string }>;
  bodyText: string;
  blobUrl?: string;
  blobType?: string;
  blobSize?: number;
  isAudio?: boolean;
};

export type EndpointTestModalProps = {
  endpoint: DocsEndpointDoc;
  show: boolean;
  onHide: () => void;
};

const noBodyMethods = new Set(["GET", "HEAD"]);

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  padding: 14,
  border: docsBorderStyle,
  borderRadius: 16,
  ...docsSubtleSurfaceStyle,
};

const twoColumnStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(7rem, 0.35fr) minmax(12rem, 1fr)",
  gap: 10,
};

const responsePreStyle: CSSProperties = {
  ...docsCodeStyle,
  margin: 0,
  padding: 12,
  borderRadius: 12,
  overflow: "auto",
  maxHeight: 280,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const createHeaderId = () => `header-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const createFieldId = () => `field-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const stringifyBody = (body: unknown) => {
  if (body === undefined || body === null) return "";
  if (typeof body === "string") return body;
  return JSON.stringify(body, null, 2);
};

const createInitialHeaders = (headers: DocsEndpointTestHeader[] = []): HeaderRow[] =>
  headers.length
    ? headers.map((header, index) => ({ ...header, id: `${header.name || "header"}-${index}` }))
    : [
      { id: "content-type", name: "Content-Type", value: "application/json" },
      { id: "authorization", name: "Authorization", value: "Bearer ", placeholder: "Bearer your-token" },
    ];

const createInitialFields = (fields: DocsEndpointTestField[] = []): FieldRow[] =>
  fields.map((field, index) => ({ ...field, id: `${field.name || "field"}-${index}` }));

const formatHeaderValue = (headers: Headers) => Array.from(headers.entries()).map(([name, value]) => ({ name, value }));

const shouldReadBlob = (responseType: DocsEndpointTestResponseType, contentType: string) => {
  const normalizedContentType = contentType.toLowerCase();
  if (responseType === "blob" || responseType === "audio") return true;
  if (responseType !== "auto") return false;
  return normalizedContentType.startsWith("audio/") || normalizedContentType.includes("octet-stream");
};

const looksLikeJson = (value: string) => {
  const trimmed = value.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
};

const formatResponseText = (text: string, contentType: string) => {
  if (!text) return "";
  if (contentType.toLowerCase().includes("json") || looksLikeJson(text)) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }
  return text;
};

const formatBytes = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const EndpointTestModal = ({ endpoint, show, onHide }: EndpointTestModalProps) => {
  const { Badge, Button, Input, Modal, TextArea } = useDocsTheme();
  const { t } = useDocsTranslation();
  const config: DocsEndpointTestConfig = endpoint.test ?? {};
  const [method, setMethod] = useState(config.method ?? endpoint.method);
  const [url, setUrl] = useState(config.url ?? endpoint.url ?? endpoint.path);
  const [headers, setHeaders] = useState<HeaderRow[]>(() => createInitialHeaders(config.headers));
  const [body, setBody] = useState(() => stringifyBody(config.body));
  const [fields, setFields] = useState<FieldRow[]>(() => createInitialFields(config.fields));
  const [fileValues, setFileValues] = useState<Record<string, FileList | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [isSending, setIsSending] = useState(false);

  const responseType = config.responseType ?? "auto";
  const bodyType = config.bodyType ?? "json";
  const canSendBody = !noBodyMethods.has(method.trim().toUpperCase());
  const usesFormData = bodyType === "form-data";

  useEffect(() => {
    if (!show) return;
    setMethod(config.method ?? endpoint.method);
    setUrl(config.url ?? endpoint.url ?? endpoint.path);
    setHeaders(createInitialHeaders(config.headers));
    setBody(stringifyBody(config.body));
    setFields(createInitialFields(config.fields));
    setFileValues({});
    setError(null);
    setResult(null);
  }, [config.body, config.fields, config.headers, config.method, config.url, endpoint.method, endpoint.path, endpoint.url, show]);

  useEffect(() => () => {
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
  }, [result?.blobUrl]);

  const headersRecord = useMemo(() => headers.reduce<Record<string, string>>((acc, header) => {
    const name = header.name.trim();
    if (!name) return acc;
    acc[name] = header.value ?? "";
    return acc;
  }, {}), [headers]);

  const requestHeadersRecord = useMemo(() => {
    if (!usesFormData) return headersRecord;
    return Object.fromEntries(Object.entries(headersRecord).filter(([name]) => name.toLowerCase() !== "content-type"));
  }, [headersRecord, usesFormData]);

  const updateHeader = useCallback((id: string, patch: Partial<HeaderRow>) => {
    setHeaders((current) => current.map((header) => header.id === id ? { ...header, ...patch } : header));
  }, []);

  const updateField = useCallback((id: string, patch: Partial<FieldRow>) => {
    setFields((current) => current.map((field) => field.id === id ? { ...field, ...patch } : field));
  }, []);

  const updateFieldFiles = useCallback((id: string, files: FileList | null) => {
    setFileValues((current) => ({ ...current, [id]: files }));
  }, []);

  const addHeader = useCallback(() => {
    setHeaders((current) => [...current, { id: createHeaderId(), name: "", value: "" }]);
  }, []);

  const removeHeader = useCallback((id: string) => {
    setHeaders((current) => current.filter((header) => header.id !== id));
  }, []);

  const resetForm = useCallback(() => {
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setMethod(config.method ?? endpoint.method);
    setUrl(config.url ?? endpoint.url ?? endpoint.path);
    setHeaders(createInitialHeaders(config.headers));
    setBody(stringifyBody(config.body));
    setFields(createInitialFields(config.fields));
    setFileValues({});
    setError(null);
    setResult(null);
  }, [config.body, config.fields, config.headers, config.method, config.url, endpoint.method, endpoint.path, endpoint.url, result?.blobUrl]);

  const formatRequestBody = useCallback(() => {
    if (!body.trim()) return;
    try {
      setBody(JSON.stringify(JSON.parse(body), null, 2));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("api.test.invalidJsonBody"));
    }
  }, [body, t]);

  const sendRequest = useCallback(async (event?: FormEvent) => {
    event?.preventDefault();
    setError(null);
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setResult(null);

    const trimmedMethod = method.trim().toUpperCase() || "GET";
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError(t("api.test.missingUrl"));
      return;
    }

    const contentType = Object.entries(headersRecord).find(([name]) => name.toLowerCase() === "content-type")?.[1] ?? "";
    const shouldValidateJsonBody = canSendBody && !usesFormData && body.trim() && contentType.toLowerCase().includes("json");
    if (shouldValidateJsonBody) {
      try {
        JSON.parse(body);
      } catch (err) {
        setError(err instanceof Error ? t("api.test.invalidRequestBodyJson", { message: err.message }) : t("api.test.invalidRequestBodyJsonFallback"));
        return;
      }
    }

    setIsSending(true);
    const startedAt = performance.now();
    try {
      let requestBody: BodyInit | undefined;
      if (canSendBody && usesFormData) {
        const formData = new FormData();
        for (const field of fields) {
          const name = field.name.trim();
          if (!name) continue;

          if (field.type === "file") {
            const files = fileValues[field.id];
            if (field.required && (!files || files.length === 0)) {
              setError(t("api.test.missingRequiredFile", { name }));
              setIsSending(false);
              return;
            }

            Array.from(files ?? []).forEach((file) => formData.append(name, file));
            continue;
          }

          if (field.required && !field.value?.trim()) {
            setError(t("api.test.missingRequiredField", { name }));
            setIsSending(false);
            return;
          }

          if (field.value !== undefined && field.value !== "") formData.append(name, field.value);
        }
        requestBody = formData;
      } else {
        requestBody = canSendBody && body.trim() ? body : undefined;
      }

      const response = await fetch(trimmedUrl, {
        method: trimmedMethod,
        headers: requestHeadersRecord,
        body: requestBody,
      });
      const elapsedMs = Math.round(performance.now() - startedAt);
      const responseContentType = response.headers.get("content-type") ?? "";
      const readAsBlob = shouldReadBlob(responseType, responseContentType);

      if (readAsBlob) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const blobType = blob.type || responseContentType || "application/octet-stream";
        const isAudio = responseType === "audio" || blobType.toLowerCase().startsWith("audio/");
        setResult({
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          elapsedMs,
          contentType: responseContentType,
          headers: formatHeaderValue(response.headers),
          bodyText: blobType ? t("api.test.receivedBlob", { size: formatBytes(blob.size), type: blobType }) : t("api.test.receivedBinary", { size: formatBytes(blob.size) }),
          blobUrl,
          blobType,
          blobSize: blob.size,
          isAudio,
        });
        return;
      }

      const text = await response.text();
      setResult({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        elapsedMs,
        contentType: responseContentType,
        headers: formatHeaderValue(response.headers),
        bodyText: formatResponseText(text, responseContentType),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("api.test.requestFailed"));
    } finally {
      setIsSending(false);
    }
  }, [body, canSendBody, fields, fileValues, headersRecord, method, requestHeadersRecord, responseType, result?.blobUrl, t, url, usesFormData]);

  const modalTitle = config.modalTitle ?? `Test ${endpoint.title}`;
  const downloadFileName = config.downloadFileName ?? `${endpoint.id}-response.bin`;

  return (
    <Modal
      title={modalTitle}
      show={show}
      onHide={onHide}
      centered
      size="large"
      actions={(
        <>
          <Button variant="secondary" type="button" onClick={resetForm} disabled={isSending}>{t("api.test.reset")}</Button>
          <Button variant="secondary" type="button" onClick={onHide} disabled={isSending}>{t("api.test.close")}</Button>
          <Button type="submit" form="endpoint-test-form" disabled={isSending}>{isSending ? t("api.test.sending") : t("api.test.sendRequest")}</Button>
        </>
      )}
    >
      <form id="endpoint-test-form" onSubmit={sendRequest} style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gap: 8 }}>
          {config.description ? <div style={docsMutedTextStyle}>{config.description}</div> : null}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Badge appearance="primary">{method || endpoint.method}</Badge>
            <Badge appearance="secondary">{t("api.test.responseType", { responseType })}</Badge>
            {usesFormData ? <Badge appearance="secondary">multipart/form-data</Badge> : null}
          </div>
        </div>

        <section style={sectionStyle}>
          <strong>{t("api.test.endpoint")}</strong>
          <div style={twoColumnStyle}>
            <Input label={t("api.test.method")} value={method} onChange={(event) => setMethod(event.currentTarget.value)} />
            <Input label={t("api.test.url")} value={url} onChange={(event) => setUrl(event.currentTarget.value)} />
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <strong>{t("api.test.headers")}</strong>
            <Button type="button" variant="secondary" size="small" onClick={addHeader}>{t("api.test.addHeader")}</Button>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {headers.map((header) => (
              <div key={header.id} style={{ display: "grid", gridTemplateColumns: "minmax(8rem, 0.42fr) minmax(10rem, 1fr) auto", gap: 10, alignItems: "end" }}>
                <Input label={t("api.test.name")} value={header.name} placeholder={t("api.test.headerNamePlaceholder")} onChange={(event) => updateHeader(header.id, { name: event.currentTarget.value })} />
                <Input label={t("api.test.value")} value={header.value ?? ""} placeholder={header.placeholder ?? t("api.test.headerValuePlaceholder")} onChange={(event) => updateHeader(header.id, { value: event.currentTarget.value })} />
                <Button type="button" variant="secondary" size="small" onClick={() => removeHeader(header.id)} disabled={headers.length <= 1}>{t("api.test.remove")}</Button>
              </div>
            ))}
          </div>
        </section>

        {usesFormData ? (
          <section style={sectionStyle}>
            <strong>{t("api.test.formData")}</strong>
            {!canSendBody ? <p style={{ ...docsMutedTextStyle, margin: 0 }}>{t("api.test.noRequestBody")}</p> : null}
            <div style={{ display: "grid", gap: 10 }}>
              {fields.map((field) => field.type === "file" ? (
                <Input
                  key={field.id}
                  label={field.label ?? field.name}
                  type="file"
                  accept={field.accept}
                  multiple={field.multiple}
                  required={field.required}
                  onChange={(event) => updateFieldFiles(field.id, event.currentTarget.files)}
                />
              ) : (
                <Input
                  key={field.id}
                  label={field.label ?? field.name}
                  value={field.value ?? ""}
                  placeholder={field.placeholder}
                  required={field.required}
                  onChange={(event) => updateField(field.id, { value: event.currentTarget.value })}
                />
              ))}
            </div>
          </section>
        ) : (
          <section style={sectionStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <strong>{t("api.test.body")}</strong>
              <Button type="button" variant="secondary" size="small" onClick={formatRequestBody} disabled={!body.trim()}>{t("api.test.formatJson")}</Button>
            </div>
            {!canSendBody ? <p style={{ ...docsMutedTextStyle, margin: 0 }}>{t("api.test.noRequestBody")}</p> : null}
            <TextArea
              label={t("api.test.requestBody")}
              rows={10}
              value={body}
              readOnly={!canSendBody}
              onChange={setBody}
              placeholder={`{\n  "key": "value"\n}`}
            />
          </section>
        )}

        {error ? (
          <div role="alert" style={{ padding: 12, borderRadius: 12, border: "1px solid #ef4444", color: "#fecaca", background: "color-mix(in srgb, #ef4444 18%, transparent)" }}>
            {error}
          </div>
        ) : null}

        {result ? (
          <section style={sectionStyle}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <strong>{t("api.test.response")}</strong>
              <Badge appearance={result.ok ? "primary" : "secondary"}>{result.status} {result.statusText}</Badge>
              <Badge appearance="secondary">{result.elapsedMs} ms</Badge>
              {result.contentType ? <Badge appearance="secondary">{result.contentType}</Badge> : null}
            </div>

            {result.isAudio && result.blobUrl ? (
              <div style={{ display: "grid", gap: 10 }}>
                <audio controls src={result.blobUrl} style={{ width: "100%" }} />
                <a href={result.blobUrl} download={downloadFileName} style={{ color: "inherit", fontWeight: 700 }}>{t("api.test.downloadAudio")}</a>
              </div>
            ) : result.blobUrl ? (
              <a href={result.blobUrl} download={downloadFileName} style={{ color: "inherit", fontWeight: 700 }}>{t("api.test.downloadResponseFile")}</a>
            ) : null}

            <div style={{ display: "grid", gap: 8 }}>
              <strong>{t("api.test.responseBody")}</strong>
              <pre style={responsePreStyle}>{result.bodyText || t("api.test.emptyResponse")}</pre>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <strong>{t("api.test.responseHeaders")}</strong>
              <pre style={responsePreStyle}>{result.headers.map((header) => `${header.name}: ${header.value}`).join("\n") || t("api.test.noResponseHeaders")}</pre>
            </div>
          </section>
        ) : null}
      </form>
    </Modal>
  );
};
