import { useState } from "react";
import { decisionText, type DecisionAnswer, type DecisionQuestion } from "aihappey-decisions";
import type { MenuItemProps } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { ViewButton } from "../buttons/ViewButton";
import { LimitedTextField } from "../fields/LimitedTextField";

export function DecisionAnswerDetails({ answer, question }: { answer: DecisionAnswer; question?: DecisionQuestion }) {
  const { t, i18n } = useTranslation();
  const percent = (n: number) => new Intl.NumberFormat(i18n.language, { style: "percent", maximumFractionDigits: 2 }).format(n);
  if (answer.type === "refusal") return <div role="status">{t("decisionsPage.refusal")}</div>;
  if (answer.type === "boolean") return <div>{t("decisionsPage.probability")}: <strong>{percent(answer.probability)}</strong></div>;
  if (answer.type === "box") return <div>{JSON.stringify(answer.box)}</div>;
  const levelLabel = (key: string) => {
    const level = answer.type === "score" && question?.type === "score" ? decisionText(question.criteria[Number(key)]).trim() : "";
    return level ? `${key} - ${level}` : key;
  };
  return <div style={{ display: "grid", gap: 8 }}>
    <div>{t(answer.type === "choice" ? "decisionsPage.selectedChoice" : "decisionsPage.score")}: <strong>{answer.type === "choice" ? JSON.stringify(answer.choice) : answer.score}</strong></div>
    <dl style={{ margin: 0, display: "grid", gap: answer.type === "choice" ? 8 : 0 }}>
      {Object.entries(answer.probabilities ?? {}).map(([key, p]) => <div key={key} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", columnGap: 16, rowGap: 4 }}>
        <dt style={{ overflowWrap: "anywhere" }}>{levelLabel(key)}</dt><dd style={{ margin: 0 }}>{percent(p)}</dd>
        {answer.type === "choice" && <div role="meter" aria-label={key} aria-valuemin={0} aria-valuemax={1}
          aria-valuenow={Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : 0} aria-valuetext={percent(p)}
          style={{ gridColumn: "1 / -1", position: "relative", height: 3, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "currentColor", opacity: 0.08 }} />
          <div style={{ width: `${(Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : 0) * 100}%`, height: "100%", background: "currentColor", opacity: 0.35 }} />
        </div>}
      </div>)}
    </dl>
  </div>;
}

export function DecisionQuestionDetails({ question, answer }: { question: DecisionQuestion; answer?: DecisionAnswer }) {
  const { t } = useTranslation();
  return <div style={{ display: "grid", gap: 16 }}>
    <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{decisionText(question.instructions)}</div>
    {question.type === "choice" && <dl>{Object.entries(question.criteria).map(([key, description]) => <div key={key}><dt><strong>{key}</strong></dt>{description != null && <dd>{decisionText(description)}</dd>}</div>)}</dl>}
    {question.type === "score" && <ol start={0}>{question.criteria.map((level, i) => <li key={i}>{decisionText(level)}</li>)}</ol>}
    {question.type === "boolean" && question.criteria && <dl>{Object.entries(question.criteria).map(([key, description]) => <div key={key}><dt>{key}</dt><dd>{decisionText(description)}</dd></div>)}</dl>}
    {answer && <><h3 style={{ margin: 0 }}>{t("decisionsPage.answer")}</h3><DecisionAnswerDetails answer={answer} question={question} /></>}
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
  if (onEdit) items.push({ key: "edit", label: t("decisionsPage.edit"), onClick: onEdit });
  if (onMoveUp) items.push({ key: "up", label: t("decisionsPage.moveUp"), onClick: onMoveUp });
  if (onMoveDown) items.push({ key: "down", label: t("decisionsPage.moveDown"), onClick: onMoveDown });
  if (onDelete) items.push({ key: "delete", label: t("delete"), onClick: onDelete });
  return <>
    <Card size="small" title={title} description={t(`decisionsPage.${question.type === "boolean" ? "predicate" : question.type}`)}
      headerActions={items.length ? <Menu items={items} /> : undefined}
      actions={<ViewButton size="small" variant="transparent" title={t("view")} onClick={() => setOpen(true)} />}>
      <LimitedTextField text={decisionText(question.instructions)} rows={4} />
      {answer && <div style={{ marginTop: 12 }}><DecisionAnswerDetails answer={answer} question={question} /></div>}
    </Card>
    <Modal show={open} onHide={() => setOpen(false)} title={title} size="large"
      actions={<Button variant="subtle" onClick={() => setOpen(false)}>{t("close")}</Button>}>
      <DecisionQuestionDetails question={question} answer={answer} />
    </Modal>
  </>;
}
