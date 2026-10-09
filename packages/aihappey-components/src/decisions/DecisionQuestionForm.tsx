import { useEffect, useState } from "react";
import { decisionText, type DecisionQuestion } from "aihappey-decisions";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

const valueOf = (event: any): string => String(event?.target?.value ?? event ?? "");
export function DecisionQuestionForm({ value, onChange }: {
  value: DecisionQuestion; onChange: (question: DecisionQuestion) => void;
}) {
  const { Input, TextArea, Select, Button, Card } = useTheme();
  const { t } = useTranslation();
  // Draft rows retain duplicate/empty option names without collapsing them into a map.
  const [choices, setChoices] = useState<[string, any][]>([]);
  useEffect(() => {
    if (value.type === "choice") setChoices(Object.keys(value.criteria).length ? Object.entries(value.criteria) : [["", null], ["", null]]);
  }, [value.id, value.type]);
  const commitChoices = (rows: [string, any][]) => {
    setChoices(rows);
    if (value.type === "choice") onChange({ ...value, criteria: rows.every(([key]) => key.trim()) && new Set(rows.map(([key]) => key)).size === rows.length
      ? Object.fromEntries(rows) : {} });
  };
  const changeType = (type: DecisionQuestion["type"]) => {
    const common = { id: value.id, name: value.name, instructions: value.instructions };
    onChange(type === "boolean" ? { ...common, type } : type === "choice" ? { ...common, type, criteria: {} } : { ...common, type, criteria: ["", ""] });
  };
  const rows = value.type === "choice" ? choices : value.type === "score" ? value.criteria.map((v, i) => [String(i), v] as [string, any]) : [];
  const update = (index: number, key: string, description: any) => {
    if (value.type === "choice") commitChoices(choices.map((row, i) => i === index ? [key, description] : row));
    if (value.type === "score") onChange({ ...value, criteria: value.criteria.map((row, i) => i === index ? description : row) });
  };
  const reorder = (index: number, offset: number) => {
    const next = [...rows]; [next[index], next[index + offset]] = [next[index + offset], next[index]];
    if (value.type === "choice") commitChoices(next);
    if (value.type === "score") onChange({ ...value, criteria: next.map(([, description]) => description) });
  };
  return <div style={{ display: "grid", gap: 12 }}>
    <Select label={t("decisionsPage.questionType")} value={value.type} onChange={(e: any) => changeType(valueOf(e) as DecisionQuestion["type"])}>
      {["boolean", "choice", "score"].map(type => <option key={type} value={type}>{t(`decisionsPage.${type === "boolean" ? "predicate" : type}`)}</option>)}
    </Select>
    <Input label={t("decisionsPage.optionalName")} value={value.name ?? ""} onChange={e => onChange({ ...value, name: e.target.value || undefined })} />
    <TextArea label={t("decisionsPage.instructions")} value={decisionText(value.instructions)} rows={4} required onChange={instructions => onChange({ ...value, instructions })} />
    {value.type === "boolean" && (["true", "false"] as const).map(key => <TextArea key={key}
      label={t("decisionsPage.booleanCriterion", { defaultValue: `Definition of ${key} (optional)`, value: key })}
      value={decisionText(value.criteria?.[key])} rows={2} onChange={description => {
        const criteria = { ...value.criteria };
        if (description) criteria[key] = description; else delete criteria[key];
        onChange({ ...value, criteria: Object.keys(criteria).length ? criteria : undefined });
      }} />)}
    {value.type !== "boolean" && <>
      <div>{t(value.type === "choice" ? "decisionsPage.choicesHint" : "decisionsPage.levelsHint")}</div>
      {rows.map(([key, description], index) => <Card key={index} size="small" title={t(value.type === "choice" ? "decisionsPage.choiceNumber" : "decisionsPage.levelNumber", { number: index + 1 })}
        actions={<div style={{ display: "flex", gap: 8 }}>
          <Button icon="up" title={t("decisionsPage.moveUp")} variant="transparent" size="small" disabled={!index} onClick={() => reorder(index, -1)} />
          <Button icon="down" title={t("decisionsPage.moveDown")} variant="transparent" size="small" disabled={index === rows.length - 1} onClick={() => reorder(index, 1)} />
          <Button icon="delete" title={t("delete")} variant="transparent" size="small" disabled={rows.length <= (value.type === "score" ? 2 : 1)} onClick={() => {
            if (value.type === "choice") commitChoices(rows.filter((_, i) => i !== index));
            if (value.type === "score") onChange({ ...value, criteria: value.criteria.filter((_, i) => i !== index) });
          }} />
        </div>}>
        {value.type === "choice" && <Input label={t("decisionsPage.value")} value={key} required onChange={e => update(index, e.target.value, description)} />}
        <TextArea label={t(value.type === "choice" ? "decisionsPage.optionalDescription" : "decisionsPage.levelLabel")}
          value={decisionText(description)} rows={2} onChange={text => update(index, key, value.type === "choice" ? text || null : text)} />
      </Card>)}
      <Button variant="subtle" icon="add" onClick={() => {
        if (value.type === "choice") commitChoices([...choices, ["", null]]);
        if (value.type === "score") onChange({ ...value, criteria: [...value.criteria, ""] });
      }}>{t(value.type === "choice" ? "decisionsPage.addChoice" : "decisionsPage.addLevel")}</Button>
    </>}
  </div>;
}
