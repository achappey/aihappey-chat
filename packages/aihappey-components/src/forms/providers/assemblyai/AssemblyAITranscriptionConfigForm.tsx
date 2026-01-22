import React from "react";
import type { AssemblyAIRealtimeConfig, AssemblyAITranscriptionConfig } from "./types";
import {
  AssemblyAIAccuracyCardForm,
  AssemblyAIChannelsAndDiarizationCardForm,
  AssemblyAIEnrichmentsCardForm,
  AssemblyAILanguageCardForm,
  AssemblyAIMediaTrimmingCardForm,
  AssemblyAIOutputFormattingCardForm,
  AssemblyAIRealtimeCardForm,
  AssemblyAISafetyAndPiiCardForm,
  AssemblyAISummarizationCardForm,
} from "./cards";

export const AssemblyAITranscriptionConfigForm: React.FC<{
  config: AssemblyAITranscriptionConfig;
  updateConfig: (val: AssemblyAITranscriptionConfig) => void;
  realtimeConfig: AssemblyAIRealtimeConfig;
  updateRealtimeConfig: (val: AssemblyAIRealtimeConfig) => void;
}> = ({ config, updateConfig, realtimeConfig, updateRealtimeConfig }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <AssemblyAIRealtimeCardForm config={realtimeConfig ?? {}} updateConfig={updateRealtimeConfig} />

      <AssemblyAIMediaTrimmingCardForm config={config} updateConfig={updateConfig} />
      <AssemblyAILanguageCardForm config={config} updateConfig={updateConfig} />
      <AssemblyAIOutputFormattingCardForm config={config} updateConfig={updateConfig} />
      <AssemblyAIChannelsAndDiarizationCardForm config={config} updateConfig={updateConfig} />
      <AssemblyAIEnrichmentsCardForm config={config} updateConfig={updateConfig} />
      <AssemblyAISafetyAndPiiCardForm config={config} updateConfig={updateConfig} />
      <AssemblyAISummarizationCardForm config={config} updateConfig={updateConfig} />
      <AssemblyAIAccuracyCardForm config={config} updateConfig={updateConfig} />
    </div>
  );
};

