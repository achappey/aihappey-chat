import { useEffect, useRef, useState } from "react";
import { DecisionCard, DecisionResultDetails, DecisionQuestionCard, DecisionQuestionEditModal, ErrorAlerts, ModelFavoriteToggleButton, QuestionSetCard, QuestionSetEditModal, useTheme } from "aihappey-components";
import { useDecisions, type QuestionSet } from "aihappey-decisions";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { ModelSelect } from "../models/ModelSelect";
import { UserMenuInline } from "../user-settings/UserMenuInline";
import { useProviderRegistry } from "../../runtime/providers/useProviderRegistry";
import { useStorageErrorMessage } from "../storage/storageErrorMessage";
import { useDecisionsController } from "./useDecisionsController";

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 16, marginTop: 16 };

export function DecisionsPage() {
  const { Tabs, Tab, TextArea, Button, Card, Alert } = useTheme();
  const { t } = useTranslation();
  const c = useDecisionsController();
  const store = useDecisions();
  const providers = useProviderRegistry();
  const storageError = useStorageErrorMessage();
  const favorites = useAppStore(s => s.favoriteModelsByType.decision);
  const toggleFavorite = useAppStore(s => s.toggleFavoriteModelForType);
  const [activeTab, setActiveTab] = useState("current");
  const [editingQuestion, setEditingQuestion] = useState<number>();
  const [editingSet, setEditingSet] = useState<QuestionSet | "new">();
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const locked = c.processing || c.readingImages;
  const model = c.models?.find(m => m.id === c.selectedModel);
  useEffect(() => { if (store.error) { c.addError(storageError(store.error, t("decisionsPage.loadFailed"))); store.clearError(); } }, [store.error, store.clearError, c.addError, storageError, t]);
  const storageAction = async (action: () => Promise<void>) => {
    try { await action(); } catch (err) { c.addError(storageError(err, t("decisionsPage.storageFailed"))); }
  };
  const move = (index: number, offset: number) => {
    const questions = [...c.questions]; [questions[index], questions[index + offset]] = [questions[index + offset], questions[index]]; c.setQuestions(questions);
  };
  return <div style={{ background: "transparent", width: "100%", minHeight: "100vh" }}>
    <div style={{ padding: "0 12px", display: "flex", alignItems: "center", gap: 8 }}>
      <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <ModelSelect models={(c.models ?? []).filter(m => m.route !== "direct")} modelTypes={["decision"]} value={c.selectedModel} onChange={c.setSelectedModel} />
      </fieldset>
      <ModelFavoriteToggleButton size="small" variant="subtle" isFavorite={(favorites ?? []).includes(c.selectedModel)} modelName={model?.name ?? c.selectedModel}
        disabled={!c.selectedModel} onToggleFavorite={() => toggleFavorite("decision", c.selectedModel)} />
      <div style={{ flex: 1 }} /><UserMenuInline />
    </div>
    <ErrorAlerts errors={c.errors} dismissError={c.dismissError} />
    <div style={{ maxWidth: 1056, margin: "44px auto 0", padding: "0 12px" }}>
      <form onSubmit={e => { e.preventDefault(); void c.onSend(); }}>
        <h1>{t("decisions")}</h1>
        {!c.gatewayAvailable && <Alert variant="warning">{t("decisionsPage.gatewayRequired")}</Alert>}
        {!c.models?.some(m => m.type === "decision" && m.route !== "direct") && <Alert variant="info">{t("decisionsPage.noModels")}</Alert>}
        <div onDragOver={e => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDragging(true); } }} onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); void c.addImages(Array.from(e.dataTransfer.files)); }}
          style={{ outline: dragging ? "2px dashed currentColor" : undefined }}>
          <TextArea label={t("decisionsPage.input")} value={c.prompt} onChange={locked ? undefined : c.setPrompt} readOnly={locked}
            rows={5} placeholder={t("decisionsPage.inputPlaceholder")} style={{ width: "100%", resize: "vertical" }} />
        </div>
        <input ref={fileInput} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: "none" }} onChange={e => {
          const files = Array.from(e.target.files ?? []); e.target.value = ""; void c.addImages(files);
        }} />
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <Button type="button" icon="attachment" variant="subtle" size="large" disabled={locked} title={t("decisionsPage.addImages")} onClick={() => fileInput.current?.click()} />
          {!!c.images.length && <span>{t("decisionsPage.imageCount", { count: c.images.length })}</span>}
          <div style={{ flex: 1 }} />
          <Button type="submit" icon="send" size="large" disabled={!c.canSend} title={t(c.processing ? "decisionsPage.processing" : "decisionsPage.send")} />
        </div>
        {!!c.images.length && <div style={grid}>{c.images.map(image => <Card key={image.id} size="small" title={image.name}
          actions={<Button type="button" icon="delete" variant="transparent" size="small" title={t("delete")} disabled={locked} onClick={() => c.removeImage(image.id)} />}>
          <img src={image.image_url} alt={image.name} style={{ maxWidth: "100%", maxHeight: 180, objectFit: "contain" }} />
        </Card>)}</div>}
      </form>
      <h2 style={{ marginTop: 44 }}>{t("decisionsPage.questionsAndAnswers")}</h2>
      <Tabs activeKey={activeTab} onSelect={setActiveTab}>
        <Tab eventKey="current" title={t("current")}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <Button icon="add" variant="subtle" disabled={locked} onClick={() => setEditingQuestion(c.questions.length)}>{t("decisionsPage.addQuestion")}</Button>
            <Button variant="subtle" disabled={locked || !c.questions.length} onClick={() => setEditingSet("new")}>{t("decisionsPage.saveAsSet")}</Button>
          </div>
          {!c.questions.length && <div style={{ marginTop: 16 }}><Card title={t("decisionsPage.noQuestions")}><div>{t("decisionsPage.noQuestionsHint")}</div></Card></div>}
          <div style={grid}>{c.questions.map((question, index) => <DecisionQuestionCard key={question.id} question={question} number={index + 1} answer={c.result?.answers[question.id]}
            onEdit={locked ? undefined : () => setEditingQuestion(index)}
            onDelete={locked ? undefined : () => c.setQuestions(c.questions.filter((_, i) => i !== index))}
            onMoveUp={!locked && index > 0 ? () => move(index, -1) : undefined}
            onMoveDown={!locked && index < c.questions.length - 1 ? () => move(index, 1) : undefined} />)}</div>
          {c.result && <div style={{ marginTop: 16 }}><DecisionResultDetails decision={c.result} providers={providers} /></div>}
        </Tab>
        <Tab eventKey="saved" title={t("saved", { total: store.items.length })}>
          <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
            {!store.items.length && <Card title={t("decisionsPage.noSaved")}><div>{t("decisionsPage.noSavedHint")}</div></Card>}
            {store.items.map(item => <DecisionCard key={item.id} item={item} providers={providers} onDelete={() => void storageAction(() => store.delete(item.id))} />)}
          </div>
        </Tab>
        <Tab eventKey="sets" title={t("decisionsPage.questionSets")}>
          <div style={{ marginTop: 16 }}><Button variant="subtle" icon="add" disabled={locked} onClick={() => setEditingSet("new")}>{t("decisionsPage.createSet")}</Button></div>
          {!store.questionSets.length && <div style={{ marginTop: 16 }}><Card title={t("decisionsPage.noSets")}><div>{t("decisionsPage.noSetsHint")}</div></Card></div>}
          <div style={grid}>{store.questionSets.map(set => <QuestionSetCard key={set.id} set={set}
            onEdit={locked ? undefined : () => setEditingSet(set)}
            onDelete={() => void storageAction(() => store.deleteQuestionSet(set.id))}
            onLoad={locked ? undefined : () => { c.setQuestions(set.questions); setActiveTab("current"); }} />)}</div>
        </Tab>
      </Tabs>
    </div>
    <DecisionQuestionEditModal open={editingQuestion !== undefined} question={editingQuestion !== undefined ? c.questions[editingQuestion] : undefined}
      onClose={() => setEditingQuestion(undefined)} onSave={question => {
        c.setQuestions(editingQuestion === c.questions.length ? [...c.questions, question] : c.questions.map((q, i) => i === editingQuestion ? question : q));
        setEditingQuestion(undefined);
      }} />
    <QuestionSetEditModal open={editingSet !== undefined} set={typeof editingSet === "object" ? editingSet : undefined}
      initialQuestions={activeTab === "current" ? c.questions : undefined} onClose={() => setEditingSet(undefined)}
      onSave={async values => {
        try { await store.saveQuestionSet(values); setEditingSet(undefined); }
        catch (err) { c.addError(storageError(err, t("decisionsPage.saveFailed"))); throw err; }
      }} />
  </div>;
}
