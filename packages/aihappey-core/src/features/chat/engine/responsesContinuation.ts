import { createClientToolContinuation } from "./clientToolContinuation";

/** Responses may need another model turn even when only a hosted program ran. */
export const createResponsesContinuation = () => {
  const client = createClientToolContinuation();
  const submitted = new Set<string>();
  let userTurn: string | undefined;
  let previousProgress: string | undefined;
  let hostedTurns = 0;
  return {
    shouldSend(options: { messages?: any[] } = {}): boolean {
      const messages = options.messages ?? [];
      const turn = messages.findLast(message => message.role === "user")?.id;
      if (turn !== userTurn) {
        submitted.clear(); previousProgress = undefined; hostedTurns = 0; userTurn = turn;
      }
      const message = messages.at(-1);
      if (message?.role !== "assistant" || message.metadata?.interrupted) return false;
      const marker = message.metadata?.responsesContinuation;
      const parts: any[] = message.parts ?? [];
      const stepStart = parts.findLastIndex(part => part.type === "step-start");
      const step = parts.slice(stepStart + 1);
      const tools = step.filter(part => (part.type?.startsWith("tool-") || part.type === "dynamic-tool") && part.providerExecuted !== true);
      if (tools.length) {
        // A final message may arrive in the same response as tool invocations.
        if (marker?.continue === false) return false;
        const send = client.shouldSend(options);
        if (send) { hostedTurns = 0; previousProgress = undefined; }
        return send;
      }
      if (marker?.continue !== true || step.some(part => part.state === "output-error")) return false;
      const key = JSON.stringify([message.id, stepStart, marker.provider, marker.responseId, marker.progress]);
      if (submitted.has(key)) return false;
      if ((marker.progress && marker.progress === previousProgress) || hostedTurns >= 32) {
        throw new Error("Responses program continuation stopped because it made no progress or exceeded 32 hosted-only turns.");
      }
      submitted.add(key); previousProgress = marker.progress; hostedTurns++;
      return true;
    },
  };
};
