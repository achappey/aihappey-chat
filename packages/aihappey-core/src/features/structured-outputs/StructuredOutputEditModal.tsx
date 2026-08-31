import { useEffect, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { StructuredOutputsItem } from "aihappey-structured-outputs";
import { StructuredOutputSchemaEditor } from "./StructuredOutputSchemaEditor";
import {
  addMissingClosedObjectConstraints,
  cloneSchema,
  parseAndValidateSchema,
  validateSchema,
  type JsonSchema,
} from "./schemaEditorUtils";

export type StructuredOutputEditValues = { name: string; json_schema: string };

type Props = {
  open: boolean;
  mode: "create" | "edit";
  item?: StructuredOutputsItem;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (values: StructuredOutputEditValues) => void | Promise<void>;
};

const EMPTY_SCHEMA: JsonSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
};
const inputValue = (value: any) => value?.target?.value ?? value ?? "";

export const StructuredOutputEditModal = ({ open, mode, item, saving, error, onClose, onSave }: Props) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("general");
  const [name, setName] = useState("");
  const [schema, setSchema] = useState<JsonSchema>(EMPTY_SCHEMA);
  const [advancedText, setAdvancedText] = useState(JSON.stringify(EMPTY_SCHEMA, null, 2));
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const parsed = item ? parseAndValidateSchema(item.json_schema) : null;
    const initial = parsed?.valid ? cloneSchema(parsed.schema) : cloneSchema(EMPTY_SCHEMA);
    setName(item?.name ?? "");
    setSchema(initial);
    setAdvancedText(item?.json_schema ?? JSON.stringify(initial, null, 2));
    setValidationErrors(parsed && !parsed.valid ? parsed.errors : []);
    setActiveTab(parsed && !parsed.valid ? "advanced" : "general");
  }, [item, open]);

  const applyAdvanced = () => {
    const result = parseAndValidateSchema(advancedText);
    if (!result.valid) {
      setValidationErrors(result.errors);
      return false;
    }
    setSchema(cloneSchema(result.schema));
    setAdvancedText(JSON.stringify(result.schema, null, 2));
    setValidationErrors([]);
    return true;
  };

  const selectTab = (nextTab: string) => {
    if (activeTab === "advanced" && nextTab !== "advanced" && !applyAdvanced()) return;
    if (nextTab === "advanced") setAdvancedText(JSON.stringify(schema, null, 2));
    setActiveTab(nextTab);
  };

  const save = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setValidationErrors([t("structuredOutputsPage.editor.nameRequired")]);
      setActiveTab("general");
      return;
    }
    let nextSchema = schema;
    if (activeTab === "advanced") {
      const result = parseAndValidateSchema(advancedText);
      if (!result.valid) {
        setValidationErrors(result.errors);
        return;
      }
      nextSchema = result.schema;
    } else {
      const result = validateSchema(schema);
      if (!result.valid) {
        setValidationErrors(result.errors);
        return;
      }
    }
    const compatibleSchema = addMissingClosedObjectConstraints(nextSchema);
    const compatibleResult = validateSchema(compatibleSchema);
    if (!compatibleResult.valid) {
      setValidationErrors(compatibleResult.errors);
      return;
    }
    setSchema(compatibleSchema);
    setAdvancedText(JSON.stringify(compatibleSchema, null, 2));
    setValidationErrors([]);
    await onSave({ name: cleanName, json_schema: JSON.stringify(compatibleSchema, null, 2) });
  };

  const canSave = !!name.trim() && !saving;

  return (
    <theme.Modal
      show={open}
      onHide={() => { if (!saving) onClose(); }}
      title={mode === "create" ? t("structuredOutputsPage.editor.createTitle") : t("structuredOutputsPage.editor.editTitle")}
      size="large"
      actions={(
        <div style={{ display: "flex", gap: 8 }}>
          <theme.Button variant="subtle" disabled={!!saving} onClick={onClose}>{t("cancel")}</theme.Button>
          <theme.Button variant="primary" disabled={!canSave} onClick={() => void save()}>
            {saving ? t("saving") : t("save")}
          </theme.Button>
        </div>
      )}
    >
      {error ? <div style={{ color: "#c00", marginBottom: 12 }}>{error}</div> : null}
      {validationErrors.length ? (
        <div style={{ color: "#c00", marginBottom: 12 }} role="alert">
          <div style={{ fontWeight: 600 }}>{t("structuredOutputsPage.editor.validationTitle")}</div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
            {validationErrors.map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}
          </ul>
        </div>
      ) : null}
      <theme.Tabs activeKey={activeTab} onSelect={selectTab}>
        <theme.Tab eventKey="general" icon="settings" title={t("general")}>
          <div style={{ display: "grid", gap: 12, paddingTop: 12 }}>
            <theme.Input
              label={t("name")}
              required
              autoFocus
              value={name}
              placeholder={t("structuredOutputsPage.editor.namePlaceholder")}
              onChange={(value: any) => setName(String(inputValue(value)))}
            />
          </div>
        </theme.Tab>
        <theme.Tab eventKey="builder" icon="structuredOutputs" title={t("structuredOutputsPage.editor.builderTab")}>
          <div style={{ display: "grid", gap: 12, paddingTop: 12 }}>
            <StructuredOutputSchemaEditor
              schema={schema}
              onChange={(next) => { setSchema(next); setValidationErrors([]); }}
            />
          </div>
        </theme.Tab>
        <theme.Tab eventKey="advanced" icon="code" title={t("structuredOutputsPage.editor.advancedTab")}>
          <div style={{ display: "grid", gap: 12, paddingTop: 12 }}>
            <theme.TextArea
              label={t("structuredOutputsPage.editor.jsonSchema")}
              value={advancedText}
              rows={22}
              onChange={(value: any) => { setAdvancedText(String(inputValue(value))); setValidationErrors([]); }}
            />
            <div><theme.Button variant="subtle" onClick={applyAdvanced}>{t("structuredOutputsPage.editor.validateJson")}</theme.Button></div>
          </div>
        </theme.Tab>
      </theme.Tabs>
    </theme.Modal>
  );
};
