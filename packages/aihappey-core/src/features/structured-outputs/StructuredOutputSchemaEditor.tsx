import { useEffect, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import {
  changeSchemaType,
  cloneSchema,
  enumValueMatchesType,
  isJsonSchemaObject,
  renameProperty,
  schemaProperties,
  schemaType,
  uniquePropertyName,
  type GuidedSchemaType,
  type JsonSchema,
} from "./schemaEditorUtils";

const GUIDED_TYPES: GuidedSchemaType[] = [
  "string", "number", "integer", "boolean", "object", "array", "null",
];

function inputValue(value: any) {
  return value?.target?.value ?? value ?? "";
}

const EnumEditor = ({ schema, onChange }: { schema: JsonSchema; onChange: (schema: JsonSchema) => void }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [text, setText] = useState(() => schema.enum ? JSON.stringify(schema.enum, null, 2) : "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(schema.enum ? JSON.stringify(schema.enum, null, 2) : "");
    setError(null);
  }, [schema.enum]);

  const apply = () => {
    if (!text.trim()) {
      const next = { ...schema };
      delete next.enum;
      onChange(next);
      setError(null);
      return;
    }
    try {
      const values = JSON.parse(text);
      const type = schemaType(schema);
      if (!Array.isArray(values) || values.length === 0) {
        throw new Error(t("structuredOutputsPage.editor.enumArrayError"));
      }
      if (type && !values.every((item) => enumValueMatchesType(item, type))) {
        throw new Error(t("structuredOutputsPage.editor.enumTypeError"));
      }
      onChange({ ...schema, enum: values });
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("structuredOutputsPage.editor.enumArrayError"));
    }
  };

  return (
    <div style={{ display: "grid", gap: 4 }}>
      <theme.TextArea
        label={t("structuredOutputsPage.editor.enumValues")}
        value={text}
        rows={3}
        placeholder={'["first", "second"]'}
        onChange={(value: any) => setText(inputValue(value))}
      />
      <div><theme.Button size="small" variant="subtle" onClick={apply}>{t("structuredOutputsPage.editor.applyEnum")}</theme.Button></div>
      {error ? <div style={{ color: "#c00", fontSize: 12 }}>{error}</div> : null}
    </div>
  );
};

type NodeEditorProps = {
  schema: JsonSchema;
  onChange: (schema: JsonSchema) => void;
  root?: boolean;
  depth?: number;
};

const SchemaNodeEditor = ({ schema, onChange, root = false, depth = 0 }: NodeEditorProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const type = schemaType(schema);
  const properties = schemaProperties(schema);
  const required = Array.isArray(schema.required)
    ? schema.required.filter((item): item is string => typeof item === "string")
    : [];

  const updateProperty = (name: string, child: JsonSchema) => {
    onChange({ ...schema, properties: { ...properties, [name]: child } });
  };

  const addProperty = () => {
    const name = uniquePropertyName(schema);
    onChange({ ...schema, properties: { ...properties, [name]: { type: "string" } } });
  };

  const removeProperty = (name: string) => {
    const nextProperties = { ...properties };
    delete nextProperties[name];
    const next: JsonSchema = { ...schema, properties: nextProperties };
    if (required.length) next.required = required.filter((item) => item !== name);
    onChange(next);
  };

  const setRequired = (name: string, checked: boolean) => {
    const nextRequired = checked
      ? Array.from(new Set([...required, name]))
      : required.filter((item) => item !== name);
    const next = { ...schema };
    if (nextRequired.length) next.required = nextRequired;
    else delete next.required;
    onChange(next);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: root ? "1fr" : "minmax(140px, .4fr) minmax(180px, 1fr)", gap: 12 }}>
        {!root ? (
          <theme.Select
            label={t("structuredOutputsPage.editor.type")}
            value={type ?? "advanced"}
            onChange={(value: any) => {
              const selected = inputValue(value) as GuidedSchemaType | "advanced";
              if (selected !== "advanced") onChange(changeSchemaType(schema, selected));
            }}
          >
            {!type ? <option value="advanced">{t("structuredOutputsPage.editor.advancedType")}</option> : null}
            {GUIDED_TYPES.map((item) => <option key={item} value={item}>{t(`structuredOutputsPage.editor.types.${item}`)}</option>)}
          </theme.Select>
        ) : null}
        <theme.Input
          label={t("description")}
          value={typeof schema.description === "string" ? schema.description : ""}
          placeholder={t("structuredOutputsPage.editor.descriptionPlaceholder")}
          onChange={(value: any) => {
            const description = String(inputValue(value));
            const next = { ...schema };
            if (description) next.description = description;
            else delete next.description;
            onChange(next);
          }}
        />
      </div>

      {!type && !root ? (
        <div style={{ color: "#888" }}>{t("structuredOutputsPage.editor.advancedNodeHelp")}</div>
      ) : null}

      {type && type !== "object" && type !== "array" ? <EnumEditor schema={schema} onChange={onChange} /> : null}

      {type === "object" ? (
        <div style={{ display: "grid", gap: 10 }}>
          {Object.entries(properties).map(([name, child]) => (
            <PropertyEditor
              key={name}
              name={name}
              schema={child}
              required={required.includes(name)}
              depth={depth + 1}
              onRename={(nextName) => onChange(renameProperty(schema, name, nextName))}
              onRequired={(checked) => setRequired(name, checked)}
              onChange={(nextChild) => updateProperty(name, nextChild)}
              onRemove={() => removeProperty(name)}
            />
          ))}
          {!Object.keys(properties).length ? (
            <div style={{ color: "#888" }}>{t("structuredOutputsPage.editor.noProperties")}</div>
          ) : null}
          <div>
            <theme.Button icon="add" variant="subtle" onClick={addProperty}>
              {t("structuredOutputsPage.editor.addProperty")}
            </theme.Button>
          </div>
        </div>
      ) : null}

      {type === "array" ? (
        <div style={{ borderLeft: "3px solid rgba(127,127,127,.3)", paddingLeft: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{t("structuredOutputsPage.editor.arrayItems")}</div>
          {isJsonSchemaObject(schema.items) ? (
            <SchemaNodeEditor
              schema={schema.items}
              depth={depth + 1}
              onChange={(items) => onChange({ ...schema, items })}
            />
          ) : (
            <div style={{ color: "#888" }}>{t("structuredOutputsPage.editor.advancedItemsHelp")}</div>
          )}
        </div>
      ) : null}
    </div>
  );
};

const PropertyEditor = ({
  name, schema, required, depth, onRename, onRequired, onChange, onRemove,
}: {
  name: string;
  schema: JsonSchema | boolean;
  required: boolean;
  depth: number;
  onRename: (name: string) => void;
  onRequired: (required: boolean) => void;
  onChange: (schema: JsonSchema) => void;
  onRemove: () => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [draftName, setDraftName] = useState(name);

  useEffect(() => setDraftName(name), [name]);

  return (
    <div style={{ border: "1px solid rgba(127,127,127,.3)", borderRadius: 8, padding: 12, display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(140px, 1fr) auto auto", alignItems: "end", gap: 8 }}>
        <theme.Input
          label={t("structuredOutputsPage.editor.propertyName")}
          required
          value={draftName}
          onChange={(value: any) => setDraftName(String(inputValue(value)))}
          onBlur={() => {
            if (draftName.trim()) onRename(draftName);
            else setDraftName(name);
          }}
        />
        <theme.Switch
          id={`schema-required-${depth}-${name}`}
          label={t("structuredOutputsPage.editor.required")}
          checked={required}
          onChange={onRequired}
        />
        <theme.Button icon="delete" size="small" variant="transparent" title={t("delete")} onClick={onRemove} />
      </div>
      {isJsonSchemaObject(schema) ? (
        <SchemaNodeEditor schema={schema} onChange={onChange} depth={depth} />
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
          <span style={{ color: "#888" }}>{t("structuredOutputsPage.editor.booleanSchemaHelp")}</span>
          <theme.Button variant="subtle" onClick={() => onChange({ type: "string" })}>{t("structuredOutputsPage.editor.convertToGuided")}</theme.Button>
        </div>
      )}
    </div>
  );
};

export const StructuredOutputSchemaEditor = ({ schema, onChange }: { schema: JsonSchema; onChange: (schema: JsonSchema) => void }) => (
  <SchemaNodeEditor schema={cloneSchema(schema)} onChange={onChange} root />
);
