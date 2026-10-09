import { useEffect, useState } from "react";
import { isValidDecisionQuestion, isValidDecisionQuestions, newDecisionQuestion, type DecisionQuestion, type QuestionSet } from "aihappey-decisions";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { DecisionQuestionForm } from "./DecisionQuestionForm";
import { DecisionQuestionCard } from "./DecisionQuestionCard";

export function QuestionSetEditModal({ open, set, initialQuestions, onClose, onSave }: {
  open: boolean; set?: QuestionSet; initialQuestions?: DecisionQuestion[];
  onClose(): void; onSave(values: Omit<QuestionSet, "id"> & { id?: string }): Promise<void>;
}) {
  const { Modal, Button, Input, Alert } = useTheme();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [questions, setQuestions] = useState<DecisionQuestion[]>([]);
  const [editing, setEditing] = useState<{ index: number; question: DecisionQuestion }>();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (open) { setName(set?.name ?? ""); setQuestions(structuredClone(set?.questions ?? initialQuestions ?? [])); setEditing(undefined); setFailed(false); }
  }, [open, set, initialQuestions]);
  const valid = name.trim() && isValidDecisionQuestions(questions) && !editing;
  const move = (index: number, offset: number) => setQuestions(current => {
    const next = [...current]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; return next;
  });
  return <Modal show={open} onHide={() => { if (!saving) onClose(); }} size="large" title={t(set ? "decisionsPage.editSet" : "decisionsPage.createSet")}
    actions={<div style={{ display: "flex", gap: 8 }}>
      <Button variant="subtle" disabled={saving} onClick={onClose}>{t("cancel")}</Button>
      <Button variant="primary" disabled={!valid || saving} onClick={async () => {
        setSaving(true); setFailed(false);
        try { await onSave({ ...(set ? { id: set.id } : {}), name, questions }); }
        catch { setFailed(true); }
        finally { setSaving(false); }
      }}>{t(saving ? "decisionsPage.saving" : "save")}</Button>
    </div>}>
    <div style={{ display: "grid", gap: 16 }}>
      {failed && <Alert variant="danger">{t("decisionsPage.saveFailed")}</Alert>}
      <fieldset disabled={saving} style={{ border: 0, margin: 0, padding: 0, minWidth: 0, display: "grid", gap: 16 }}>
        <Input label={t("name")} value={name} required onChange={e => setName(e.target.value)} />
        {editing ? <>
          <DecisionQuestionForm value={editing.question} onChange={question => setEditing({ ...editing, question })} />
          {!isValidDecisionQuestion(editing.question) && <div role="status">{t("decisionsPage.questionValidation")}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="subtle" onClick={() => setEditing(undefined)}>{t("cancel")}</Button>
            <Button disabled={!isValidDecisionQuestion(editing.question)} onClick={() => {
              setQuestions(current => editing.index === current.length ? [...current, editing.question] : current.map((q, i) => i === editing.index ? editing.question : q));
              setEditing(undefined);
            }}>{t("save")}</Button>
          </div>
        </> : <>
          {questions.map((question, index) => <DecisionQuestionCard key={index} question={question} number={index + 1}
            onEdit={() => setEditing({ index, question: structuredClone(question) })}
            onDelete={() => setQuestions(current => current.filter((_, i) => i !== index))}
            onMoveUp={index > 0 ? () => move(index, -1) : undefined}
            onMoveDown={index < questions.length - 1 ? () => move(index, 1) : undefined} />)}
          <Button icon="add" variant="subtle" onClick={() => setEditing({ index: questions.length, question: newDecisionQuestion() })}>{t("decisionsPage.addQuestion")}</Button>
          {!questions.length && <div>{t("decisionsPage.noQuestions")}</div>}
        </>}
      </fieldset>
    </div>
  </Modal>;
}
