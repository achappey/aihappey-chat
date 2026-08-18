import { useEffect, useRef, type RefObject } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";

import { useDictation } from "./useDictation";

export type UsePromptDictationControlsOptions = {
  value: string;
  onChange: (next: string) => void;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean;
};

const appendTranscript = (value: string, transcript: string) => {
  const separator = value && !/\s$/.test(value) ? " " : "";
  return `${value}${separator}${transcript}`;
};

/**
 * Shared dictation UI and behavior for text prompt inputs.
 *
 * The latest value and change handler are kept in refs because transcription
 * completes asynchronously and must not overwrite text entered meanwhile.
 */
export const usePromptDictationControls = ({
  value,
  onChange,
  textareaRef,
  disabled = false,
}: UsePromptDictationControlsOptions) => {
  const { Button } = useTheme();
  const { t } = useTranslation();
  const dictationEnabled = useAppStore((s) => s.chatDictationEnabled);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  valueRef.current = value;
  onChangeRef.current = onChange;

  const dictation = useDictation({
    disabled: disabled || !dictationEnabled,
    onTranscript: (text) => {
      const next = appendTranscript(valueRef.current, text);
      valueRef.current = next;
      onChangeRef.current(next);

      // Keep focus in the input and move the cursor to the appended transcript.
      window.setTimeout(() => {
        const element = textareaRef?.current;
        if (!element) return;
        element.focus();
        try {
          const end = element.value.length;
          element.setSelectionRange(end, end);
        } catch {
          // Some themed textarea implementations may not expose selection APIs.
        }
      }, 0);
    },
  });

  useEffect(() => {
    if (!dictationEnabled && dictation.recording) {
      dictation.stopRecording();
    }
  }, [dictationEnabled, dictation.recording, dictation.stopRecording]);

  const dictationButton = dictationEnabled ? (
    <Button
      type="button"
      size="large"
      title={t("transcriptionRecord")}
      variant={dictation.recording ? "primary" : "transparent"}
      icon={dictation.recording ? "stop" : "transcription"}
      disabled={dictation.recording
        ? false
        : disabled
        || !dictation.recordingSupported
        || !dictation.transcriptionEnabled
        || dictation.transcribing}
      onClick={dictation.recording ? dictation.stopRecording : dictation.startRecording}
    >
      {dictation.recording ? dictation.elapsedLabel : undefined}
    </Button>
  ) : null;

  const dictationError = dictation.error ? (
    <div style={{ marginTop: 8, color: "#b00020" }}>
      {dictation.error}
    </div>
  ) : null;

  return { dictationButton, dictationError };
};
