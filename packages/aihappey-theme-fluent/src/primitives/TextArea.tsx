import * as React from "react";
import { Field, Textarea as FluentTextarea } from "@fluentui/react-components";
import { useDarkMode } from "usehooks-ts";

export type TextAreaProps = {
  rows?: number;
  value: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
  readOnly?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean
  label?: string;
  id?: string;
  hint?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  onPaste?: React.ClipboardEventHandler<HTMLTextAreaElement>;
};

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      rows,
      value,
      onChange,
      style,
      hint,
      readOnly,
      placeholder,
      autoFocus,
      required,
      className,
      label,
      id,
      onKeyDown,
      onPaste,
      ...rest
    },
    ref
  ): JSX.Element => {
    const { isDarkMode } = useDarkMode();

    const textareaElement = (
      <FluentTextarea
        id={id}
        ref={ref}
        rows={rows}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        disabled={readOnly}
        onChange={onChange ? (_, data) => onChange(data.value) : undefined}
        style={{
          backgroundColor: isDarkMode ? "#141414" : undefined,
          ...style,
        }}
        className={className}
        {...rest}
      />
    );

    return label ? (
      <Field label={label} hint={hint} required={required}>
        {textareaElement}
      </Field>
    ) : (
      textareaElement
    );
  }
);

TextArea.displayName = "TextArea";
