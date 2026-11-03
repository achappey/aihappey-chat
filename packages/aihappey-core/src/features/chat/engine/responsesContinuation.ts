/** Scheduling only. Replay state belongs to persisted, provider-keyed UI parts. */
export const createResponsesContinuation = () => {
  const submitted = new Set<string>();
  let userTurn: string | undefined;

  return {
    shouldSend({ messages = [] }: { messages?: any[] } = {}): boolean {
      const turn = messages.findLast(message => message.role === "user")?.id;
      if (turn !== userTurn) {
        submitted.clear();
        userTurn = turn;
      }
      const message = messages.at(-1);
      if (message?.role !== "assistant" || message.metadata?.interrupted) return false;
      const parts: any[] = message.parts ?? [];
      const stepStart = parts.findLastIndex(part => part.type === "step-start");
      const step = parts.slice(stepStart + 1);
      const tools = step.filter(part => (part.type?.startsWith("tool-") || part.type === "dynamic-tool") && part.providerExecuted !== true);
      if (!tools.length) return false;
      if (tools.some(part => !["output-available", "output-error", "output-denied", "approval-responded"].includes(part.state))) return false;
      // A preamble before a tool is not a final answer. Text after the last
      // client tool is final; never let a completed old tool resubmit it.
      const lastTool = step.findLastIndex(part => tools.includes(part));
      if (step.slice(lastTool + 1).some(part => part.type === "text" && part.text?.trim())) return false;

      const key = JSON.stringify([message.id, stepStart, tools.map(part => part.toolCallId).sort()]);
      if (submitted.has(key)) return false;
      submitted.add(key);
      return true;
    },
  };
};
