import { useState } from "react";
import type { DecisionAnswer, DecisionQuestion } from "aihappey-ai";
import type { MenuItemProps } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { ViewButton } from "../buttons/ViewButton";
import { LimitedTextField } from "../fields/LimitedTextField";

export function DecisionAnswerDetails({ answer }: { answer: DecisionAnswer }) {
  const { t, i18n } = useTranslation();
  const percent = (n: number) => new Intl.NumberFormat(i18n.language, { style: "percent", maximumFractionDigits: 2 }).format(n);
  if (answer.type === "refusal") return <div role="status">{t("decisionsPage.refusal")}</div>;
  if (answer.type === "predicate") return <div>{t("decisionsPage.probability")}: <strong>{percent(answer.probability)}</strong></div>;
  return <div style={{ display: "grid", gap: 8 }}>
    <div>{t(answer.type === "choice" ? "decisionsPage.selectedChoice" : "decisionsPage.score")}: <strong>{answer.type === "choice" ? JSON.stringify(answer.choice) : answer.score}</strong></div>
    <div>{t("decisionsPage.confidence")}: {percent(answer.confidence)}</div>
    <dl style={{ margin: 0 }}>
      {answer.probabilities.map((p, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <dt>{"label" in p ? `${p.label} (${p.value})` : JSON.stringify(p.value)}</dt><dd style={{ margin: 0 }}>{percent(p.probability)}</dd>
      </div>)}
    </dl>
  </div>;
}

export function DecisionQuestionDetails({ question, answer }: { question: DecisionQuestion; answer?: DecisionAnswer }) {
  const { t } = useTranslation();
  return <div style={{ display: "grid", gap: 16 }}>
    <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{question.instructions}</div>
    {question.type === "choice" && <dl>{question.choices.map((c, i) => <div key={i}><dt><strong>{JSON.stringify(c.value)}</strong></dt>{c.description && <dd>{c.description}</dd>}</div>)}</dl>}
    {question.type === "score" && <ol>{question.levels.map((l, i) => <li key={i}><strong>{l.label}</strong>{l.description && <div>{l.description}</div>}</li>)}</ol>}
    {answer && <><h3 style={{ margin: 0 }}>{t("decisionsPage.answer")}</h3><DecisionAnswerDetails answer={answer} /></>}
  </div>;
}

export function DecisionQuestionCard({ question, answer, number, onEdit, onDelete, onMoveUp, onMoveDown }: {
  question: DecisionQuestion; answer?: DecisionAnswer; number: number;
  onEdit?: () => void; onDelete?: () => void; onMoveUp?: () => void; onMoveDown?: () => void;
}) {
  const { Card, Menu, Modal, Button } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const title = question.name || t("decisionsPage.questionNumber", { number });
  const items: MenuItemProps[] = [];
  if (onEdit) items.push({ key: "edit", label: t("edit"), onClick: onEdit });
  if (onMoveUp) items.push({ key: "up", label: t("decisionsPage.moveUp"), onClick: onMoveUp });
  if (onMoveDown) items.push({ key: "down", label: t("decisionsPage.moveDown"), onClick: onMoveDown });
  if (onDelete) items.push({ key: "delete", label: t("delete"), onClick: onDelete });
  return <>
    <Card size="small" title={title} description={t(`decisionsPage.${question.type}`)}
      headerActions={items.length ? <Menu items={items} /> : undefined}
      actions={<ViewButton size="small" variant="transparent" title={t("view")} onClick={() => setOpen(true)} />}>
      <LimitedTextField text={question.instructions} rows={4} />
      {answer && <div style={{ marginTop: 12 }}><DecisionAnswerDetails answer={answer} /></div>}
    </Card>
    <Modal show={open} onHide={() => setOpen(false)} title={title} size="large"
      actions={<Button variant="subtle" onClick={() => setOpen(false)}>{t("close")}</Button>}>
      <DecisionQuestionDetails question={question} answer={answer} />
    </Modal>
  </>;
}
