type LimitedTextFieldProps = {
  text?: string;
  rows?: number
  minHeight?: number
};

export const LimitedTextField = ({ text, rows, minHeight }: LimitedTextFieldProps) => {
  return (
    <div
      title={text}
      style={{
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: rows ? rows - 1 : 2,        // limit to 3 lines
        overflow: "hidden",
        textOverflow: "ellipsis",
        fontSize: 12,
        minHeight: minHeight,
        color: "#888",
      }}
    >
      {text}
    </div>
  );
};
