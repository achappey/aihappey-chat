import { AgentPhoneWebClient, type AgentPhoneEvent, type StartCallConfig } from "agentphone-web-sdk";
import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeConversationEvents, RealtimeConversationSdkSession } from "./startRealtimeConversationWebrtc";

const describeError = (e: unknown) => {
  if (!e) return "unknown";
  if (e instanceof Error) return e.message || e.name;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
};

const toNumber = (value: any): number | undefined => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
};

const pickTranscriptText = (payload: any): string => {
  const candidates = [
    payload?.text,
    payload?.transcript,
    payload?.message,
    payload?.content,
    payload?.data?.text,
    payload?.data?.transcript,
    payload?.data?.message,
    payload?.data?.content,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  return "";
};

const pickTranscriptRole = (payload: any): "user" | "agent" | undefined => {
  const raw = String(
    payload?.role ??
    payload?.speaker ??
    payload?.source ??
    payload?.participant ??
    payload?.data?.role ??
    payload?.data?.speaker ??
    payload?.data?.source ??
    ""
  ).toLowerCase();

  if (raw.includes("agent") || raw.includes("assistant") || raw.includes("bot")) return "agent";
  if (raw.includes("user") || raw.includes("customer") || raw.includes("human") || raw.includes("caller")) return "user";
  return undefined;
};

const isFinalTranscript = (payload: any): boolean => {
  const finalValue = payload?.is_final ?? payload?.final ?? payload?.isFinal ?? payload?.data?.is_final ?? payload?.data?.final ?? payload?.data?.isFinal;
  if (typeof finalValue === "boolean") return finalValue;

  const status = String(payload?.status ?? payload?.type ?? payload?.data?.status ?? payload?.data?.type ?? "").toLowerCase();
  return status.includes("final") || status.includes("complete") || status.includes("done");
};

const normalizeAgentPhoneUpdateEvents = (payload: any): any[] => {
  const text = pickTranscriptText(payload);
  if (!text) {
    return [{ type: "agentphone.update", provider: "agentphone", update: payload }];
  }

  const role = pickTranscriptRole(payload);
  const final = isFinalTranscript(payload);
  const type = role === "agent"
    ? "transcript.agent"
    : role === "user"
      ? (final ? "transcript.user" : "transcript.user.delta")
      : (final ? "transcript.user" : "transcript.user.delta");

  return [
    {
      type,
      provider: "agentphone",
      text,
      item_id: payload?.item_id ?? payload?.id ?? payload?.data?.id,
      raw: payload,
    },
  ];
};

export async function startAgentPhoneRealtimeConversationSdkSession(args: {
  getAccessToken: () => Promise<RealtimeResponse>;
  config?: Partial<Omit<StartCallConfig, "accessToken">>;
  events?: RealtimeConversationEvents;
}): Promise<RealtimeConversationSdkSession> {
  const { events } = args;
  const token = await args.getAccessToken();
  const accessToken = token.value;

  if (!accessToken) {
    throw new Error("AgentPhone realtime token response did not contain a value.");
  }

  const client = new AgentPhoneWebClient();
  let stopped = false;
  let muted = false;

  const emitEvent = (event: any) => events?.onEvent?.(event);
  const on = (event: AgentPhoneEvent, listener: (...args: any[]) => void) => client.on(event, listener);

  on("call_started", () => {
    emitEvent({ type: "call_started", provider: "agentphone" });
    events?.onOpen?.();
  });

  on("call_ready", () => {
    emitEvent({ type: "call_ready", provider: "agentphone" });
    void client.startAudioPlayback().catch((e) => {
      events?.onError?.(`AgentPhone audio playback did not start automatically: ${describeError(e)}`, e);
    });
  });

  on("call_ended", () => {
    stopped = true;
    emitEvent({ type: "call_ended", provider: "agentphone" });
  });

  on("agent_start_talking", () => emitEvent({ type: "agent_start_talking", provider: "agentphone" }));
  on("agent_stop_talking", () => emitEvent({ type: "agent_stop_talking", provider: "agentphone" }));
  on("metadata", (metadata) => emitEvent({ type: "metadata", provider: "agentphone", metadata }));
  on("node_transition", (transition) => emitEvent({ type: "node_transition", provider: "agentphone", transition }));
  on("audio", (audio) => emitEvent({ type: "audio", provider: "agentphone", audio }));
  on("update", (payload) => {
    for (const event of normalizeAgentPhoneUpdateEvents(payload)) emitEvent(event);
  });
  on("error", (err) => {
    const message = describeError(err) || "AgentPhone realtime call error";
    emitEvent({ type: "error", provider: "agentphone", message, error: err });
    events?.onError?.(message, err);
  });

  await client.startCall({
    accessToken,
    sampleRate: toNumber(args.config?.sampleRate),
    captureDeviceId: args.config?.captureDeviceId,
    playbackDeviceId: args.config?.playbackDeviceId,
    emitRawAudioSamples: args.config?.emitRawAudioSamples,
  });

  const session: RealtimeConversationSdkSession = {
    kind: "sdk",
    provider: "agentphone",
    client,
    send: (event: any) => {
      emitEvent({
        type: "agentphone.unsupported_client_event",
        provider: "agentphone",
        ignored: event,
      });
    },
    setMicrophoneEnabled: (enabled: boolean) => {
      muted = !enabled;
      if (enabled) client.unmute();
      else client.mute();
    },
    stop: async () => {
      try {
        client.removeAllListeners();
        if (!stopped) client.stopCall();
      } catch (e) {
        events?.onError?.(`Failed stopping AgentPhone realtime session: ${describeError(e)}`, e);
      }
    },
  };

  if (muted) client.mute();
  return session;
}

