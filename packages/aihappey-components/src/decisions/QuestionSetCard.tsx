import { useState } from "react";
import { serializeQuestionSet, type QuestionSet } from "aihappey-decisions";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { ViewButton } from "../buttons/ViewButton";
import { DecisionQuestionCard } from "./DecisionQuestionCard";

export function downloadQuestionSet(set: QuestionSet) {
  const url = URL.createObjectURL(new Blob([serializeQuestionSet(set)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${set.name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_") || "questions"}.json`;
  document.body.appendChild(anchor);
  anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Stateless storage actions allow this card to be reused on a future overview page. */
export function QuestionSetCard({ set, onEdit, onDelete, onLoad }: {
  set: QuestionSet; onEdit?: () => void; onDelete?: () => void; onLoad?: () => void;
}) {
  const { Card, Menu, Modal, Button } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const items = [
    ...(onEdit ? [{ key: "edit", label: t("edit"), onClick: onEdit }] : []),
    { key: "download", label: t("download"), onClick: () => downloadQuestionSet(set) },
    ...(onDelete ? [{ key: "delete", label: t("delete"), onClick: onDelete }] : []),
  ];
  return <>
    <Card size="small" title={set.name} description={t("decisionsPage.questionCount", { count: set.questions.length })}
      headerActions={<Menu items={items} />} actions={<div style={{ display: "flex", gap: 8 }}>
        <ViewButton variant="transparent" size="small" title={t("view")} onClick={() => setOpen(true)} />
        <Button variant="transparent" size="small" icon="download" title={t("download")} onClick={() => downloadQuestionSet(set)} />
        {onLoad && <Button size="small" variant="subtle" icon="add" onClick={onLoad}>{t("decisionsPage.useSet")}</Button>}
      </div>}>
      <div style={{ display: "grid", gap: 4 }}>{set.questions.slice(0, 3).map((q, i) => <div key={i} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.name || q.instructions}</div>)}</div>
    </Card>
    <Modal show={open} onHide={() => setOpen(false)} title={set.name} size="large"
      actions={<Button variant="subtle" onClick={() => setOpen(false)}>{t("close")}</Button>}>
      <div style={{ display: "grid", gap: 16 }}>{set.questions.map((question, index) => <DecisionQuestionCard key={index} question={question} number={index + 1} />)}</div>
    </Modal>
  </>;
}
