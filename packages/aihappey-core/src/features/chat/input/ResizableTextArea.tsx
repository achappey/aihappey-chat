import { useRef, type ComponentType, type CSSProperties, type KeyboardEventHandler, type ClipboardEventHandler, type RefObject } from "react";
import { useResizableMessageInput } from "./useResizableMessageInput";

type ResizableTextAreaProps = {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
  onPaste?: ClipboardEventHandler<HTMLTextAreaElement>;
  style?: CSSProperties;
  TextArea: ComponentType<any>;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  direction?: "up" | "down";
  resetKey?: string;
};

export const ResizableTextArea = ({
  TextArea,
  textareaRef: suppliedTextareaRef,
  direction = "down",
  resetKey,
  style,
  ...textAreaProps
}: ResizableTextAreaProps) => {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const internalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRef = suppliedTextareaRef ?? internalTextareaRef;
  const resizable = useResizableMessageInput({
    containerRef: shellRef,
    textareaRef,
    direction,
    resetKey,
  });
  const handleOnTop = direction === "up";

  return (
    <div
      ref={shellRef}
      style={{
        ...styles.shell,
        paddingTop: handleOnTop ? 5 : undefined,
        paddingBottom: handleOnTop ? undefined : 5,
      }}
    >
      {handleOnTop ? <ResizeHandle resizable={resizable} edge="top" /> : null}
      <TextArea
        {...textAreaProps}
        ref={textareaRef}
        style={{
          ...style,
          width: "100%",
          boxSizing: "border-box",
        }}
      />
      {!handleOnTop ? <ResizeHandle resizable={resizable} edge="bottom" /> : null}
    </div>
  );
};

const ResizeHandle = ({
  resizable,
  edge,
}: {
  resizable: ReturnType<typeof useResizableMessageInput>;
  edge: "top" | "bottom";
}) => (
  <div
    role="separator"
    aria-label="Resize text input"
    aria-orientation="horizontal"
    aria-valuemin={resizable.minimumHeight || undefined}
    aria-valuemax={resizable.maximumHeight || undefined}
    aria-valuenow={(resizable.height ?? resizable.minimumHeight) || undefined}
    tabIndex={0}
    title="Drag or use the arrow keys to resize the text input"
    data-dragging={resizable.dragging ? "true" : undefined}
    onPointerDown={resizable.onPointerDown}
    onKeyDown={resizable.onKeyDown}
    style={{
      ...styles.handle,
      ...(edge === "top" ? styles.topHandle : styles.bottomHandle),
    }}
  >
    <span aria-hidden="true" style={styles.grip} />
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  shell: {
    position: "relative",
    width: "100%",
    minWidth: 0,
  },
  handle: {
    position: "absolute",
    zIndex: 1,
    left: 0,
    right: 0,
    height: 11,
    cursor: "ns-resize",
    touchAction: "none",
    display: "flex",
    justifyContent: "center",
    outlineOffset: 1,
  },
  topHandle: {
    top: 0,
    alignItems: "flex-start",
  },
  bottomHandle: {
    bottom: 0,
    alignItems: "flex-end",
  },
  grip: {
    display: "block",
    width: 40,
    height: 3,
    marginBlock: 1,
    borderRadius: 999,
    background: "currentColor",
    opacity: 0.38,
  },
};
