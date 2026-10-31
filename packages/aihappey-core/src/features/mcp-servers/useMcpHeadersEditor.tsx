import { useMemo, useRef, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { McpRegistryServerResponse } from "aihappey-types";
import { hasOAuthHint, headerForm, managedHeader, parseHeaders, registryHeaders, resolveHeaderForm, validateRegistryHeaders, type HeaderRow } from "./headerConfiguration";

/** Three draft views over the same headers. Incomplete credentials can be saved, but cannot be connected. */
export function useMcpHeadersEditor(initial: Record<string, string> = {}, item?: McpRegistryServerResponse, url?: string) {
  const { Tabs, Tab, Card, Input, Select, Button, TextArea } = useTheme();
  const { t } = useTranslation();
  const definitions = useMemo(() => registryHeaders(item, url), [item, url]);
  const oauth = hasOAuthHint(item);
  const hasForm = definitions.some(header => !managedHeader(header, oauth));
  const [tab, setTab] = useState(hasForm ? "form" : "headers");
  const [form, setForm] = useState(() => headerForm(definitions, oauth, initial));
  const [rows, setRows] = useState<HeaderRow[]>(() => Object.entries(initial).map(([name, value]) => ({ name, value })));
  const [raw, setRaw] = useState(() => JSON.stringify(initial, null, 2));
  const formSnapshot = useRef<string | undefined>(undefined);
  const result = useMemo(() => {
    try {
      const headers = tab === "form" ? resolveHeaderForm(form, definitions, false)
        : tab === "headers" ? resolveHeaderForm({ fields: [], extra: rows }, [], false) : parseHeaders(raw);
      let connectionError: string | undefined;
      try { validateRegistryHeaders(headers, definitions, oauth); }
      catch (error) { connectionError = error instanceof Error ? error.message : "required"; }
      return { headers, error: undefined, connectionError };
    } catch (error) { return { headers: undefined, error: error instanceof Error ? error.message : "headers", connectionError: undefined }; }
  }, [tab, raw, form, rows, definitions, oauth]);
  const changeTab = (next: string) => {
    if (next === tab || !result.headers) return;
    const json = JSON.stringify(result.headers, null, 2);
    if (tab === "form") formSnapshot.current = json;
    if (next === "form" && json !== formSnapshot.current) setForm(headerForm(definitions, oauth, result.headers));
    if (next === "headers") setRows(Object.entries(result.headers).map(([name, value]) => ({ name, value })));
    if (next === "raw") setRaw(json);
    setTab(next);
  };
  const valueOf = (value: any) => typeof value === "string" ? value : value?.target?.value ?? "";
  const errors: Record<string, string> = {
    json: "Enter a JSON object containing string header values.", headers: "Enter valid, unique HTTP header names and values.",
    required: "Complete required header fields before connecting. You can save this configuration now.",
    choice: "Select one of the listed values before connecting.", number: "Enter a valid number before connecting.", boolean: "Select true or false before connecting.",
  };
  const editRows = (values: HeaderRow[], change: (rows: HeaderRow[]) => void) => <div style={{ display: "grid", gap: 12 }}>
    {values.map((row, index) => <div key={index} style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
      <Input label={t("mcpHeaders.name", { defaultValue: "Header name" })} value={row.name}
        onChange={(event: any) => change(values.map((entry, i) => i === index ? { ...entry, name: valueOf(event) } : entry))} />
      <Input label={t("mcpHeaders.value", { defaultValue: "Header value" })} value={row.value} type="password" autoComplete="off"
        onChange={(event: any) => change(values.map((entry, i) => i === index ? { ...entry, value: valueOf(event) } : entry))} />
      <Button type="button" icon="delete" title={t("delete")} aria-label={t("delete")}
        onClick={() => change(values.filter((_, i) => i !== index))} />
    </div>)}
    <Button type="button" icon="add" variant="subtle" onClick={() => change([...values, { name: "", value: "" }])}>
      {t("mcpHeaders.add", { defaultValue: "Add header" })}
    </Button>
  </div>;
  const content = <div style={{ paddingTop: 12 }}>
    {oauth && <p>{t("mcpHeaders.oauth", { defaultValue: "OAuth credentials are managed automatically when you connect." })}</p>}
    <Tabs activeKey={tab} onSelect={changeTab}>
      {hasForm && <Tab eventKey="form" title={t("mcpHeaders.form", { defaultValue: "Form" })}>
        <div style={{ display: "grid", gap: 16, paddingTop: 12 }}>
          {definitions.filter(header => !managedHeader(header, oauth)).map(header => <Card key={header.name} title={header.name} size="small">
            <div style={{ display: "grid", gap: 12 }}>
              {header.description && <div style={{ overflowWrap: "anywhere" }}>{header.description}</div>}
              {form.fields.map((field, index) => {
                if (field.header !== header.name) return null;
                const label = field.variable ? field.label : t("mcpHeaders.value", { defaultValue: "Header value" });
                const change = (value: any) => setForm(previous => ({ ...previous,
                  fields: previous.fields.map((entry, i) => i === index ? { ...entry, value: valueOf(value) } : entry) }));
                const choices = field.input.choices?.length ? field.input.choices : field.input.format === "boolean" ? ["true", "false"] : undefined;
                return <div key={field.id}>
                  {choices && !field.input.isSecret ? <Select label={label} aria-label={label} values={[field.value]} value={field.value}
                    valueTitle={field.value} required={field.input.isRequired} disabled={field.fixed} onChange={change}>
                    <option value="">{t("select", { defaultValue: "Select" })}</option>
                    {choices.map(choice => <option key={choice} value={choice}>{choice}</option>)}
                  </Select> : <Input label={label} value={field.value} required={field.input.isRequired} readOnly={field.fixed}
                    type={field.input.isSecret ? "password" : field.input.format === "number" ? "number" : "text"}
                    autoComplete="off" placeholder={field.input.placeholder} onChange={change} />}
                  {field.input.description && field.input.description !== header.description && <div style={{ fontSize: 12, marginTop: 4 }}>{field.input.description}</div>}
                </div>;
              })}
            </div>
          </Card>)}
          {form.extra.length > 0 && editRows(form.extra, extra => setForm(previous => ({ ...previous, extra })))}
        </div>
      </Tab>}
      <Tab eventKey="headers" title={t("mcpHeaders.headers", { defaultValue: "Headers" })}>
        <div style={{ paddingTop: 12 }}>{editRows(rows, setRows)}</div>
      </Tab>
      <Tab eventKey="raw" title={t("mcpHeaders.raw", { defaultValue: "Raw" })}>
        <TextArea rows={6} label={t("manageServersModal.headers")} value={raw} style={{ width: "100%" }}
          onChange={(value: any) => setRaw(valueOf(value))} />
      </Tab>
    </Tabs>
    {(result.error || result.connectionError) && <div role={result.error ? "alert" : "status"} style={{ marginTop: 8, color: result.error ? "#c00" : undefined }}>
      {t(`mcpHeaders.errors.${result.error ?? result.connectionError}`, { defaultValue: errors[result.error ?? result.connectionError!] ?? errors.headers })}
    </div>}
  </div>;
  return { ...result, content };
}
