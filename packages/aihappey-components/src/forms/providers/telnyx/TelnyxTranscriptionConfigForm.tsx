import React from "react";
import { TimestampGranularitiesForm } from "../../settings/transcriptions/TimestampGranularitiesForm";

export type TelnyxTranscriptionConfig = {
  /**
   * The timestamp granularities to populate for this transcription.
   * Note: Telnyx requires `response_format=verbose_json` for timestamp granularities to have effect.
   * Currently only `segment` is supported.
   */
  timestamp_granularities?: Array<"segment">;
};

export const TelnyxTranscriptionConfigForm: React.FC<{
  config: TelnyxTranscriptionConfig;
  updateConfig: (val: TelnyxTranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
  const enabled = config?.timestamp_granularities != null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <TimestampGranularitiesForm
        idPrefix="telnyx-transcription-timestamp"
        supportedGranularities={["segment"]}
        value={enabled ? (["segment"] as Array<"segment">) : undefined}
        enabled={enabled}
        selected={enabled ? (["segment"] as Array<"segment">) : []}
        // Telnyx only supports `segment`; keep it locked on.
        disableSegmentToggle={true}
        onChange={(timestamp_granularities) => {
          const nextEnabled = timestamp_granularities != null;
          updateConfig({
            ...config,
            timestamp_granularities: nextEnabled ? (["segment"] as Array<"segment">) : undefined,
          });
        }}
        onToggleEnabled={(nextEnabled) => {
          updateConfig({
            ...config,
            timestamp_granularities: nextEnabled ? (["segment"] as Array<"segment">) : undefined,
          });
        }}
        onToggleGranularity={() => {
          // No-op: only `segment` supported and it is locked on.
        }}
      />
    </div>
  );
};

