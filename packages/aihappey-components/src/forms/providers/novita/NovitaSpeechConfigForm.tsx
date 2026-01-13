import React from "react";

import { GlmSpeechCardForm } from "./speechCards/GlmSpeechCardForm";
import { MinimaxSpeechCardForm } from "./speechCards/MinimaxSpeechCardForm";
import { Txt2SpeechSpeechCardForm } from "./speechCards/Txt2SpeechSpeechCardForm";

import type { NovitaSpeechConfig } from "./speechCards/novitaSpeechTypes";

export type {
  NovitaGlmSpeechConfig,
  NovitaMinimaxSpeechConfig,
  NovitaSpeechConfig,
  NovitaTxt2SpeechSpeechConfig,
} from "./speechCards/novitaSpeechTypes";

export const NovitaSpeechConfigForm: React.FC<{
  config: NovitaSpeechConfig;
  updateConfig: (val: NovitaSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <MinimaxSpeechCardForm config={config} updateConfig={updateConfig} />
      <GlmSpeechCardForm config={config} updateConfig={updateConfig} />
      <Txt2SpeechSpeechCardForm config={config} updateConfig={updateConfig} />
    </div>
  );
};

