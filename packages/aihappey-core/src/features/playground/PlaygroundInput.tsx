import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";

type PlaygroundInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  streaming: boolean;
  error?: string;
};

export const PlaygroundInput = ({
  value,
  onChange,
  onSend,
  disabled,
  streaming,
  error,
}: PlaygroundInputProps) => {
  const { Button, Text, TextArea, Spinner } = useTheme();
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    const newHeight = Math.min(textareaRef.current.scrollHeight, 100);
    textareaRef.current.style.height = `${newHeight}px`;
  };

  const handleChange = (nextValue: string) => {
    onChange(nextValue);
    window.setTimeout(resizeTextarea, 0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled) onSend();
    }
  };

  return (
    <div style={styles.container}>
      <TextArea
        ref={textareaRef}
        value={value}
        autoFocus
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={t("promptPlaceholder")}
        style={styles.textArea}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <div style={styles.buttonRow}>
        {streaming ? <Spinner /> : null}
        <Button
          onClick={onSend}
          disabled={disabled}
          size="large"
          icon="send"
        />
      </div>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
  },
  textArea: {
    resize: "vertical",
    maxHeight: 120,
    flex: 1,
  },
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  error: {
    color: "#d13438",
  },
};

export default PlaygroundInput;
