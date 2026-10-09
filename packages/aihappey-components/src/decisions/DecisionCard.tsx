import { useState } from "react";
import { decisionText, isInlineDecisionImage, type DecisionInput, type DecisionItem, type DecisionResponse } from "aihappey-decisions";
import type { Provider } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { format } from "timeago.js";
import { useTheme } from "../theme/ThemeContext";
import { useDarkMode } from "usehooks-ts";
import { ViewButton } from "../buttons/ViewButton";
import { LimitedTextField } from "../fields/LimitedTextField";
import { DecisionQuestionCard } from "./DecisionQuestionCard";
import { ProviderResultCards } from "../modals/ProviderResultCards";

function evidence(input: DecisionInput): { text: string; images: string[] } {
  if (typeof input === "string") return { text: input, images: [] };
  if (!Array.isArray(input) || !input.every((m: any) => m && m.role === "user")) return { text: decisionText(input), images: [] };
  const texts: string[] = [], images: string[] = [];
  for (const message of input as any[]) {
    if (typeof message.content === "string") texts.push(message.content);
    else if (Array.isArray(message.content)) for (const part of message.content) {
      if (part.type === "input_text") texts.push(part.text);
      if (part.type === "input_image" && isInlineDecisionImage(part.image_url)) images.push(part.image_url);
    }
  }
  return { text: texts.join("\n"), images };
}
export const getDecisionInputText = (input: DecisionInput): string => evidence(input).text;

export function DecisionResultDetails({ decision, providers }: { decision: DecisionResponse; providers?: Record<string, Provider> }) {
  const { Card, Alert } = useTheme();
  const { t } = useTranslation();
  const providerKey = decision.response?.modelId?.split("/")[0]?.toLowerCase()
    ?? Object.keys(decision.providerMetadata ?? {}).find(key => key !== "gateway");
  const headers = Object.fromEntries(Object.entries(decision.response?.headers ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  return <div style={{ display: "grid", gap: 12 }}>
    {decision.warnings.map((warning, i) => <Alert key={i} variant="warning">{decisionText(warning)}</Alert>)}
    {decision.usage && <Card size="small" title={t("decisionsPage.usage")}><dl style={{ margin: 0 }}>
      {decision.usage.inputTokens !== undefined && <><dt>{t("decisionsPage.inputTokens")}</dt><dd>{decision.usage.inputTokens}</dd></>}
      {decision.usage.outputTokens !== undefined && <><dt>{t("decisionsPage.outputTokens")}</dt><dd>{decision.usage.outputTokens}</dd></>}
    </dl></Card>}
    <ProviderResultCards providerMetadata={decision.providerMetadata} providers={providers} providerKey={providerKey} headers={headers} body={decision.response?.body} />
  </div>;
}

export function DecisionCard({ item, providers, onDelete }: { item: DecisionItem; providers?: Record<string, Provider>; onDelete?: () => void }) {
  const { Card, Menu, Modal, Button, Image } = useTheme();
  const { t, i18n } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [open, setOpen] = useState(false);
  const model = item.decision.response?.modelId ?? "";
  const provider = providers?.[model.split("/")[0]?.toLowerCase()];
  const icon = provider?.icons?.find(i => i.theme === (isDarkMode ? "dark" : "light")) ?? provider?.icons?.[0];
  const { text, images } = evidence(item.input);
  return <>
    <Card size="small" title={model || t("decisions")} description={format(item.createdAt, i18n.language)}
      image={icon?.src ? <Image height={40} shape="square" src={icon.src} title={provider?.name} /> : undefined}
      headerActions={onDelete ? <Menu items={[{ key: "delete", label: t("delete"), onClick: onDelete }]} /> : undefined}
      actions={<ViewButton size="small" variant="transparent" title={t("view")} onClick={() => setOpen(true)} />}>
      <LimitedTextField text={text || t("decisionsPage.imageInput")} rows={4} />
      <div style={{ marginTop: 8 }}>{t("decisionsPage.questionCount", { count: item.questions.length })}</div>
    </Card>
    <Modal show={open} onHide={() => setOpen(false)} title={model || t("decisions")} size="large"
      actions={<Button variant="subtle" onClick={() => setOpen(false)}>{t("close")}</Button>}>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{text}</div>
        {!!images.length && <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{images.map((url, i) => <img key={i} src={url} alt={t("decisionsPage.imageNumber", { number: i + 1 })} style={{ maxWidth: 160, maxHeight: 160, objectFit: "contain" }} />)}</div>}
        {item.questions.map((question, i) => <DecisionQuestionCard key={question.id} question={question} number={i + 1} answer={item.decision.answers[question.id]} />)}
        <DecisionResultDetails decision={item.decision} providers={providers} />
      </div>
    </Modal>
  </>;
}
