import { useState } from "react";
import type { DecisionInput } from "aihappey-ai";
import type { DecisionItem } from "aihappey-decisions";
import type { Provider } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { useDarkMode } from "usehooks-ts";
import { format } from "timeago.js";
import { useTheme } from "../theme/ThemeContext";
import { ViewButton } from "../buttons/ViewButton";
import { LimitedTextField } from "../fields/LimitedTextField";
import { DecisionQuestionCard } from "./DecisionQuestionCard";

export const getDecisionInputText = (input: DecisionInput): string => typeof input === "string" ? input
  : input.map(m => typeof m.content === "string" ? m.content : m.content.filter(p => p.type === "input_text").map(p => p.text).join("\n")).join("\n");

export function DecisionCard({ item, providers, onDelete }: { item: DecisionItem; providers?: Record<string, Provider>; onDelete?: () => void }) {
  const { Card, Menu, Modal, Button, Image } = useTheme();
  const { t, i18n } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [open, setOpen] = useState(false);
  const provider = providers?.[item.decision.model.split("/")[0]?.toLowerCase()];
  const icon = provider?.icons?.find(i => i.theme === (isDarkMode ? "dark" : "light")) ?? provider?.icons?.[0];
  const text = getDecisionInputText(item.input);
  const images = typeof item.input === "string" ? [] : item.input.flatMap(m => typeof m.content === "string" ? [] : m.content.filter(p => p.type === "input_image"));
  return <>
    <Card size="small" title={item.decision.model} description={format(item.createdAt, i18n.language)}
      image={icon?.src ? <Image height={40} shape="square" src={icon.src} title={provider?.name} /> : undefined}
      headerActions={onDelete ? <Menu items={[{ key: "delete", label: t("delete"), onClick: onDelete }]} /> : undefined}
      actions={<ViewButton size="small" variant="transparent" title={t("view")} onClick={() => setOpen(true)} />}>
      <LimitedTextField text={text || t("decisionsPage.imageInput")} rows={4} />
      <div style={{ marginTop: 8 }}>{t("decisionsPage.questionCount", { count: item.questions.length })}</div>
    </Card>
    <Modal show={open} onHide={() => setOpen(false)} title={item.decision.model} size="large"
      actions={<Button variant="subtle" onClick={() => setOpen(false)}>{t("close")}</Button>}>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{text}</div>
        {!!images.length && <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{images.map((image, i) => <img key={i} src={image.image_url} alt={t("decisionsPage.imageNumber", { number: i + 1 })} style={{ maxWidth: 160, maxHeight: 160, objectFit: "contain" }} />)}</div>}
        {item.questions.map((question, i) => <DecisionQuestionCard key={i} question={question} number={i + 1} answer={item.decision.answers[i]} />)}
        <Card size="small" title={t("decisionsPage.usage")}>
          <dl style={{ margin: 0 }}>
            <dt>{t("decisionsPage.inputTokens")}</dt><dd>{item.decision.usage.input_tokens}</dd>
            <dt>{t("decisionsPage.cachedTokens")}</dt><dd>{item.decision.usage.input_tokens_details.cached_tokens}</dd>
            <dt>{t("decisionsPage.cacheWriteTokens")}</dt><dd>{item.decision.usage.input_tokens_details.cache_write_tokens}</dd>
            <dt>{t("decisionsPage.outputTokens")}</dt><dd>{item.decision.usage.output_tokens}</dd>
            <dt>{t("decisionsPage.reasoningTokens")}</dt><dd>{item.decision.usage.output_tokens_details.reasoning_tokens}</dd>
            <dt>{t("decisionsPage.totalTokens")}</dt><dd>{item.decision.usage.total_tokens}</dd>
          </dl>
        </Card>
      </div>
    </Modal>
  </>;
}
