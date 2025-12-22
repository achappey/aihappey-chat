import React from "react";
import { useTools } from "../../../tools/useTools";
import { ToolInvocationCard } from "./ToolInvocationCard";

export const ToolInvocationsActivity: React.FC<{
  invocations?: any[];
}> = ({ invocations }) => {
  const { tools } = useTools();

  if (!invocations?.length) return null;

  return (
    <div
      style={{
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {[...invocations].reverse().map((inv, i) => {
        const tool = tools?.find(t => inv.type?.endsWith(t.name));

        return (
          <ToolInvocationCard
            key={(inv.toolCallId || i) + "-inv"}
            invocation={inv}
            tool={tool}
          />
        );
      })}
    </div>
  );
};
