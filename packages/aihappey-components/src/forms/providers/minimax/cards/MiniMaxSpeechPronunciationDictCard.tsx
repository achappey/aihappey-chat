import React, { useMemo, useState } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { MiniMaxSpeechConfig } from "../MiniMaxSpeechConfigForm";
import {
  hasAnyOwnValue,
  normalizeList,
  normalizeListItem,
} from "./shared";

export const MiniMaxSpeechPronunciationDictCard: React.FC<{
  config: MiniMaxSpeechConfig;
  updateConfig: (val: MiniMaxSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const updatePronunciationDict = (
    next: Partial<MiniMaxSpeechConfig["pronunciation_dict"]>
  ) => {
    const merged = {
      ...(config?.pronunciation_dict ?? {}),
      ...next,
    } as NonNullable<MiniMaxSpeechConfig["pronunciation_dict"]>;

    updateConfig({
      ...config,
      pronunciation_dict: hasAnyOwnValue(merged) ? merged : undefined,
    });
  };

  const toneList = useMemo(
    () => normalizeList(config?.pronunciation_dict?.tone),
    [config?.pronunciation_dict?.tone]
  );
  const [newTone, setNewTone] = useState<string>("");

  const addTone = () => {
    const n = normalizeListItem(newTone);
    if (!n) return;
    const next = normalizeList([...toneList, n]);
    updatePronunciationDict({ tone: next.length ? next : undefined });
    setNewTone("");
  };

  const removeTone = (tone: string) => {
    const key = normalizeListItem(tone).toLowerCase();
    const next = toneList.filter((x) => normalizeListItem(x).toLowerCase() !== key);
    updatePronunciationDict({ tone: next.length ? next : undefined });
  };

  return (
    <theme.Card size="small" title={t("providers:minimax.pronunciationDict")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ opacity: 0.8, fontSize: 12 }}>{t("providers:minimax.toneHint")}</div>

        <div>
          <theme.Input
            value={newTone}
            label={t("providers:minimax.addTone")}
            placeholder={t("providers:minimax.addTonePlaceholder")}
            onChange={(e: any) => setNewTone(e.target.value)}
            onKeyDown={(e: any) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTone();
              }
            }}
          />
          <theme.Button
            icon="add"
            size="small"
            title={t("add")}
            variant="informative"
            disabled={!normalizeListItem(newTone)}
            onClick={addTone}
          />
        </div>

        {toneList.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {toneList.map((x) => (
              <div
                key={x}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ fontFamily: "monospace" }}>{x}</div>
                <theme.Button
                  size="small"
                  variant="danger"
                  title={t("delete")}
                  onClick={() => removeTone(x)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </theme.Card>
  );
};

