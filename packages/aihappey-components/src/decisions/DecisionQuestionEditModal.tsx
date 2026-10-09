import { useEffect, useState } from "react";
import { isValidDecisionQuestion, newDecisionQuestion, type DecisionQuestion } from "aihappey-decisions";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { DecisionQuestionForm } from "./DecisionQuestionForm";

export function DecisionQuestionEditModal({ open, question, onClose, onSave }: {
  open: boolean; question?: DecisionQuestion; onClose(): void; onSave(question: DecisionQuestion): void;
}) {
  const { Modal, Button } = useTheme();
  const { t } = useTranslation();
  const [value, setValue] = useState<DecisionQuestion>(newDecisionQuestion);
  useEffect(() => { if (open) setValue(structuredClone(question ?? newDecisionQuestion())); }, [open, question]);
  return <Modal show={open} onHide={onClose} size="large" title={t(question ? "decisionsPage.editQuestion" : "decisionsPage.addQuestion")}
    actions={<div style={{ display: "flex", gap: 8 }}>
      <Button variant="subtle" onClick={onClose}>{t("cancel")}</Button>
      <Button variant="primary" disabled={!isValidDecisionQuestion(value)} onClick={() => onSave(value)}>{t("save")}</Button>
    </div>}>
    <DecisionQuestionForm value={value} onChange={setValue} />
    {!isValidDecisionQuestion(value) && <div role="status" style={{ marginTop: 12 }}>{t("decisionsPage.questionValidation")}</div>}
  </Modal>;
}
