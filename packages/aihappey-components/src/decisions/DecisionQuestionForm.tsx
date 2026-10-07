import type { DecisionQuestion } from "aihappey-ai";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

const valueOf = (event: any): string => String(event?.target?.value ?? event ?? "");

/** The form edits wire objects directly. Choice value types and score-level order are explicit. */
export function DecisionQuestionForm({ value, onChange }: {
  value: DecisionQuestion; onChange: (question: DecisionQuestion) => void;
}) {
  const { Input, TextArea, Select, Button, Card } = useTheme();
  const { t } = useTranslation();
  const changeType = (type: DecisionQuestion["type"]) => {
    const common = { instructions: value.instructions, ...(value.name !== undefined ? { name: value.name } : {}) };
    onChange(type === "predicate" ? { ...common, type } : type === "choice"
      ? { ...common, type, choices: [{ value: "" }, { value: "" }] }
      : { ...common, type, levels: [{ label: "" }, { label: "" }] });
  };
  const updateRow = (index: number, row: any) => {
    if (value.type === "choice") onChange({ ...value, choices: value.choices.map((c, i) => i === index ? row : c) });
    if (value.type === "score") onChange({ ...value, levels: value.levels.map((l, i) => i === index ? row : l) });
  };
  const moveRow = (index: number, offset: number) => {
    if (value.type === "predicate") return;
    const rows = value.type === "choice" ? [...value.choices] : [...value.levels];
    [rows[index], rows[index + offset]] = [rows[index + offset], rows[index]];
    onChange(value.type === "choice" ? { ...value, choices: rows as typeof value.choices } : { ...value, levels: rows as typeof value.levels });
  };
  const rows = value.type === "choice" ? value.choices : value.type === "score" ? value.levels : [];
  return <div style={{ display: "grid", gap: 12 }}>
    <Select label={t("decisionsPage.questionType")} value={value.type} onChange={(e: any) => changeType(valueOf(e) as DecisionQuestion["type"])}>
      {["predicate", "choice", "score"].map(type => <option key={type} value={type}>{t(`decisionsPage.${type}`)}</option>)}
    </Select>
    <Input label={t("decisionsPage.optionalName")} value={value.name ?? ""} onChange={e => {
      const name = e.target.value;
      const { name: _, ...question } = value;
      onChange(name ? { ...question, name } : question as DecisionQuestion);
    }} />
    <TextArea label={t("decisionsPage.instructions")} value={value.instructions} rows={4} required
      onChange={instructions => onChange({ ...value, instructions })} />
    {value.type !== "predicate" && <>
      <div>{t(value.type === "choice" ? "decisionsPage.choicesHint" : "decisionsPage.levelsHint")}</div>
      {rows.map((row, index) => <Card key={index} size="small" title={t(value.type === "choice" ? "decisionsPage.choiceNumber" : "decisionsPage.levelNumber", { number: index + 1 })}
        actions={<div style={{ display: "flex", gap: 8 }}>
          <Button icon="up" title={t("decisionsPage.moveUp")} variant="transparent" size="small" disabled={index === 0} onClick={() => moveRow(index, -1)} />
          <Button icon="down" title={t("decisionsPage.moveDown")} variant="transparent" size="small" disabled={index === rows.length - 1} onClick={() => moveRow(index, 1)} />
          <Button icon="delete" title={t("delete")} variant="transparent" size="small" disabled={rows.length <= 2} onClick={() => {
            if (value.type === "choice") onChange({ ...value, choices: value.choices.filter((_, i) => i !== index) });
            if (value.type === "score") onChange({ ...value, levels: value.levels.filter((_, i) => i !== index) });
          }} />
        </div>}>
        <div style={{ display: "grid", gap: 12 }}>
          {"value" in row ? <>
            <Select label={t("decisionsPage.valueType")} value={typeof row.value} onChange={(e: any) => updateRow(index, { ...row, value: valueOf(e) === "boolean" ? false : "" })}>
              <option value="string">{t("decisionsPage.string")}</option><option value="boolean">{t("decisionsPage.boolean")}</option>
            </Select>
            {typeof row.value === "boolean" ? <Select label={t("decisionsPage.value")} value={String(row.value)}
              onChange={(e: any) => updateRow(index, { ...row, value: valueOf(e) === "true" })}>
              <option value="true">true</option><option value="false">false</option>
            </Select> : <Input label={t("decisionsPage.value")} value={row.value} required onChange={e => updateRow(index, { ...row, value: e.target.value })} />}
          </> : <Input label={t("decisionsPage.levelLabel")} value={row.label} required onChange={e => updateRow(index, { ...row, label: e.target.value })} />}
          <TextArea label={t("decisionsPage.optionalDescription")} value={row.description ?? ""} rows={2} onChange={description => {
            const { description: _, ...rest } = row;
            updateRow(index, description ? { ...rest, description } : rest);
          }} />
        </div>
      </Card>)}
      <Button variant="subtle" icon="add" onClick={() => {
        if (value.type === "choice") onChange({ ...value, choices: [...value.choices, { value: "" }] });
        if (value.type === "score") onChange({ ...value, levels: [...value.levels, { label: "" }] });
      }}>{t(value.type === "choice" ? "decisionsPage.addChoice" : "decisionsPage.addLevel")}</Button>
    </>}
  </div>;
}
