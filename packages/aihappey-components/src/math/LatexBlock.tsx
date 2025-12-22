import { BlockMath, InlineMath } from "react-katex";

type LatexBlockProps = {
  latex: string;
  block?: boolean;
  options?: Record<string, any>;
};

export const LatexBlock = ({
  latex,
  block = true,
  options,
}: LatexBlockProps) => {
  if (!latex?.trim()) return null;

  return (
    <div style={{ overflowX: "auto", margin: "1em 0" }}>
      {block ? (
        <BlockMath
          math={latex}
          renderError={(err: any) => (
            <span style={{ color: "red" }}>{err.message}</span>
          )}
          {...(options && { options })}
        />
      ) : (
        <InlineMath
          math={latex}
          renderError={(err: any) => (
            <span style={{ color: "red" }}>{err.message}</span>
          )}
          {...(options && { options })}
        />
      )}
    </div>
  );
};
