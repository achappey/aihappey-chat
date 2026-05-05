import React from "react";
import { useTools } from "../../../tools/useTools";
import { ToolInvocationCard } from "./ToolInvocationCard";
import { PROVIDERS } from "../../../../runtime/providers/providerMetadata";

const normalizeProviderId = (providerId?: string) => {
  const trimmed = String(providerId ?? "").trim().toLowerCase();
  if (!trimmed) return undefined;

  return trimmed.includes("/") ? trimmed.split("/")[0] : trimmed;
};

const getProviderIcons = (invocation: any) => {
  if (!invocation?.providerExecuted) return undefined;

  const providerId = normalizeProviderId(invocation.providerId);
  if (!providerId) return undefined;

  return (PROVIDERS as Record<string, { icons?: any }>)[providerId]?.icons;
};

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
        const providerIcons = getProviderIcons(inv);

        return (
          <ToolInvocationCard
            key={(inv.toolCallId || i) + "-inv"}
            invocation={inv}
            tool={tool}
            providerIcons={providerIcons}
          />
        );
      })}
    </div>
  );
};
