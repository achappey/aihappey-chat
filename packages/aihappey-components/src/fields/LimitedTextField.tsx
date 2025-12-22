type LimitedTextFieldProps = {
  text?: string;
  rows?: number
};

export const LimitedTextField = ({ text, rows }: LimitedTextFieldProps) => {
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
        color: "#888",
      }}
    >
      {text}
    </div>
  );
};
