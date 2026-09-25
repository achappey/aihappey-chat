import { useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { AgentEvaluations, AgentLocalEvaluator } from "aihappey-types";

export type AgentChecksProps = {
  value?: AgentEvaluations;
  onChange?: (value: AgentEvaluations | undefined) => void;
  readOnly?: boolean;
  availableToolNames?: string[];
};

const appendUniqueItem = (items: string[], item: string) => {
  const normalized = item.trim();
  return normalized && !items.includes(normalized) ? [...items, normalized] : items;
};

export const hasAgentChecks = (value?: AgentEvaluations) => {
  const local = value?.localEvaluator;
  return !!local && (
    local.nonEmpty !== undefined
    || local.keywordCheck !== undefined
    || local.toolCallsPresent === true
    || local.toolCalledCheck !== undefined
    || local.hasImageContent === true
  );
};

export const AgentChecks = ({ value, onChange, readOnly = false, availableToolNames = [] }: AgentChecksProps) => {
  const { Button, Card, Input, Select, Switch, Tags, Text } = useTheme();
  const { t } = useTranslation();
  const local = value?.localEvaluator;
  const [keywordInput, setKeywordInput] = useState("");
  const [toolNameInput, setToolNameInput] = useState("");

  const updateLocal = (update: (current: AgentLocalEvaluator) => AgentLocalEvaluator) => {
    if (!onChange) return;
    const next = update(local ?? {});
    onChange(Object.keys(next).length ? { localEvaluator: next } : undefined);
  };

  const removeCheck = (key: keyof AgentLocalEvaluator) => updateLocal((current) => {
    const { [key]: _, ...remaining } = current;
    return remaining;
  });

  const headerToggle = (id: string, checked: boolean, onToggle: (checked: boolean) => void) => readOnly
    ? undefined
    : <Switch id={id} label="" checked={checked} onChange={onToggle} />;

  const details = (label: string, content: string) => (
    <div style={{ display: "grid", gap: 4 }}>
      <Text><strong>{label}</strong></Text>
      <Text>{content}</Text>
    </div>
  );

  const itemEditor = ({
    items,
    input,
    label,
    placeholder,
    setInput,
    onItemsChange,
  }: {
    items: string[];
    input: string;
    label: string;
    placeholder: string;
    setInput: (value: string) => void;
    onItemsChange: (items: string[]) => void;
  }) => {
    const addItem = () => {
      const next = appendUniqueItem(items, input);
      if (next !== items) onItemsChange(next);
      setInput("");
    };

    return (
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "end", gap: 8 }}>
          <Input
            label={label}
            placeholder={placeholder}
            value={input}
            onChange={(event: any) => setInput(event.target.value)}
            onKeyDown={(event: any) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              addItem();
            }}
          />
          <Button
            type="button"
            icon="add"
            size="small"
            variant="informative"
            title={t("add")}
            disabled={!input.trim()}
            onClick={addItem}
          />
        </div>
        {items.length ? (
          <Tags
            size="small"
            items={items.map((item) => ({ key: item, label: item }))}
            onRemove={(item: string) => onItemsChange(items.filter((current) => current !== item))}
          />
        ) : null}
      </div>
    );
  };

  const toolNameEditor = (items: string[], onItemsChange: (items: string[]) => void) => {
    if (!availableToolNames.length) {
      return itemEditor({
        items,
        input: toolNameInput,
        label: t("agentChecks.namedTools.toolNames"),
        placeholder: t("agentChecks.namedTools.placeholder"),
        setInput: setToolNameInput,
        onItemsChange,
      });
    }

    return (
      <div style={{ display: "grid", gap: 8 }}>
        <Select
          label={t("agentChecks.namedTools.toolNames")}
          values={[]}
          placeholder={t("agentChecks.namedTools.selectTool")}
          searchable
          options={availableToolNames.map((toolName) => ({ value: toolName, label: toolName }))}
          onChange={(toolName: string) => onItemsChange(appendUniqueItem(items, toolName))}
        >
          {availableToolNames.map((toolName) => (
            <option key={toolName} value={toolName}>{toolName}</option>
          ))}
        </Select>
        {items.length ? (
          <Tags
            size="small"
            items={items.map((item) => ({ key: item, label: item }))}
            onRemove={(item: string) => onItemsChange(items.filter((current) => current !== item))}
          />
        ) : null}
      </div>
    );
  };

  const cards = [
    (!readOnly || local?.nonEmpty !== undefined) ? (
      <Card
        key="non-empty"
        size="small"
        title={t("agentChecks.nonEmpty.title")}
        description={t("agentChecks.nonEmpty.description")}
        headerActions={headerToggle("agent-check-non-empty", local?.nonEmpty !== undefined, (checked) => {
          if (!checked) removeCheck("nonEmpty");
          else updateLocal((current) => ({ ...current, nonEmpty: { minLength: 1 } }));
        })}
      >
        {local?.nonEmpty !== undefined && (readOnly
          ? details(t("agentChecks.nonEmpty.minLength"), String(local.nonEmpty.minLength ?? 1))
          : <Input
              type="number"
              min={1}
              step={1}
              label={t("agentChecks.nonEmpty.minLength")}
              value={local.nonEmpty.minLength ?? 1}
              onChange={(event) => updateLocal((current) => ({
                ...current,
                nonEmpty: { minLength: Math.max(1, Math.trunc(Number(event.target.value) || 1)) },
              }))}
            />)}
      </Card>
    ) : null,
    (!readOnly || local?.keywordCheck !== undefined) ? (
      <Card
        key="keywords"
        size="small"
        title={t("agentChecks.keywords.title")}
        description={t("agentChecks.keywords.description")}
        headerActions={headerToggle("agent-check-keywords", local?.keywordCheck !== undefined, (checked) => {
          if (!checked) removeCheck("keywordCheck");
          else updateLocal((current) => ({ ...current, keywordCheck: { keywords: [], caseSensitive: false } }));
        })}
      >
        {local?.keywordCheck !== undefined && (readOnly ? (
          <div style={{ display: "grid", gap: 12 }}>
            {details(t("agentChecks.keywords.keywords"), local.keywordCheck.keywords.join(", "))}
            {details(t("agentChecks.keywords.caseSensitive"), t(local.keywordCheck.caseSensitive ? "yes" : "no"))}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {itemEditor({
              items: local.keywordCheck.keywords,
              input: keywordInput,
              label: t("agentChecks.keywords.keywords"),
              placeholder: t("agentChecks.keywords.placeholder"),
              setInput: setKeywordInput,
              onItemsChange: (keywords) => updateLocal((current) => ({
                ...current,
                keywordCheck: { ...current.keywordCheck!, keywords },
              })),
            })}
            <Switch
              id="agent-check-keywords-case-sensitive"
              label={t("agentChecks.keywords.caseSensitive")}
              checked={local.keywordCheck.caseSensitive === true}
              onChange={(checked: boolean) => updateLocal((current) => ({
                ...current,
                keywordCheck: { ...current.keywordCheck!, caseSensitive: checked },
              }))}
            />
          </div>
        ))}
      </Card>
    ) : null,
    (!readOnly || local?.toolCallsPresent === true) ? (
      <Card
        key="tool-calls"
        size="small"
        title={t("agentChecks.toolCallsPresent.title")}
        description={t("agentChecks.toolCallsPresent.description")}
        headerActions={headerToggle("agent-check-tool-calls", local?.toolCallsPresent === true, (checked) => {
          if (!checked) removeCheck("toolCallsPresent");
          else updateLocal((current) => ({ ...current, toolCallsPresent: true }));
        })}
      />
    ) : null,
    (!readOnly || local?.toolCalledCheck !== undefined) ? (
      <Card
        key="named-tools"
        size="small"
        title={t("agentChecks.namedTools.title")}
        description={t("agentChecks.namedTools.description")}
        headerActions={headerToggle("agent-check-named-tools", local?.toolCalledCheck !== undefined, (checked) => {
          if (!checked) removeCheck("toolCalledCheck");
          else updateLocal((current) => ({ ...current, toolCalledCheck: { toolNames: [], mode: "All" } }));
        })}
      >
        {local?.toolCalledCheck !== undefined && (readOnly ? (
          <div style={{ display: "grid", gap: 12 }}>
            {details(t("agentChecks.namedTools.toolNames"), local.toolCalledCheck.toolNames.join(", "))}
            {details(t("agentChecks.namedTools.mode"), t(`agentChecks.namedTools.modes.${local.toolCalledCheck.mode ?? "All"}`))}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {toolNameEditor(local.toolCalledCheck.toolNames, (toolNames) => updateLocal((current) => ({
                ...current,
                toolCalledCheck: { ...current.toolCalledCheck!, toolNames },
              })))}
            <Select
              label={t("agentChecks.namedTools.mode")}
              values={[local.toolCalledCheck.mode ?? "All"]}
              valueTitle={t(`agentChecks.namedTools.modes.${local.toolCalledCheck.mode ?? "All"}`)}
              options={["All", "Any"].map((mode) => ({
                value: mode,
                label: t(`agentChecks.namedTools.modes.${mode}`),
              }))}
              onChange={(mode: "All" | "Any") => updateLocal((current) => ({
                ...current,
                toolCalledCheck: { ...current.toolCalledCheck!, mode },
              }))}
            >
              <option value="All">{t("agentChecks.namedTools.modes.All")}</option>
              <option value="Any">{t("agentChecks.namedTools.modes.Any")}</option>
            </Select>
          </div>
        ))}
      </Card>
    ) : null,
    (!readOnly || local?.hasImageContent === true) ? (
      <Card
        key="image-content"
        size="small"
        title={t("agentChecks.imageContent.title")}
        description={t("agentChecks.imageContent.description")}
        headerActions={headerToggle("agent-check-image-content", local?.hasImageContent === true, (checked) => {
          if (!checked) removeCheck("hasImageContent");
          else updateLocal((current) => ({ ...current, hasImageContent: true }));
        })}
      />
    ) : null,
  ].filter(Boolean);

  return <div style={{ display: "grid", gap: 12, paddingTop: 12 }}>{cards}</div>;
};
