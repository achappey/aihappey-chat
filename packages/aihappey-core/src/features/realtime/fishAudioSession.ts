import { AgentSession, type SessionToken, type AgentSessionOptions } from "@fishaudio/agent-client";

/** Presentation-free transport shared by the browser and the Windows WebView2 bundle. */
export type FishAudioSession = {
  send: (event: any) => void;
  setMuted: (muted: boolean) => Promise<void>;
  stop: () => Promise<void>;
};

export function validateFishSessionToken(value: any): SessionToken {
  if (!value || value.transport !== "livekit") throw new Error("Unsupported Fish Audio session transport.");
  for (const key of ["session_id", "token", "livekit_url", "expires_at"])
    if (typeof value[key] !== "string" || !value[key].trim()) throw new Error(`Fish Audio session is missing ${key}.`);
  const url = new URL(value.livekit_url);
  if (url.protocol !== "wss:" || url.username || url.password) throw new Error("Invalid Fish Audio LiveKit URL.");
  if (!Number.isFinite(Date.parse(value.expires_at)) || Date.parse(value.expires_at) <= Date.now()) throw new Error("Fish Audio session join deadline has expired.");
  if (!Number.isInteger(value.max_duration_seconds) || value.max_duration_seconds <= 0) throw new Error("Invalid Fish Audio session duration.");
  return value;
}

export async function startFishAudioSession(args: {
  sessionToken: unknown;
  toolNames?: readonly string[];
  signal?: AbortSignal;
  onEvent: (event: any) => void;
  onOpen?: () => void;
  onError?: (message: string) => void;
  microphone?: boolean;
  start?: typeof AgentSession.start;
}): Promise<FishAudioSession> {
  args.signal?.throwIfAborted();
  const token = validateFishSessionToken(args.sessionToken);
  let stopped = false, ready = false;
  let client: AgentSession | undefined;
  let ending: Promise<void> | undefined;
  const queued: any[] = [];
  const pending = new Map<string, { resolve: (result: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  const emit = (event: any) => {
    if (stopped) return;
    if (ready) args.onEvent(event);
    else if (queued.length < 512) queued.push(event);
    else { void stop(); args.onError?.("Fish Audio startup event queue exceeded its limit."); }
  };
  const clearTools = () => {
    for (const call of pending.values()) { clearTimeout(call.timer); call.reject(new Error("Fish Audio session ended.")); }
    pending.clear();
  };
  const stop = () => {
    if (ending) return ending;
    stopped = true; queued.length = 0; clearTools(); args.signal?.removeEventListener("abort", aborted);
    return ending = client?.end() ?? Promise.resolve();
  };
  const aborted = () => { void stop().catch(() => undefined); };
  args.signal?.addEventListener("abort", aborted, { once: true });
  const tools: NonNullable<AgentSessionOptions["clientTools"]> = Object.create(null);
  for (const name of new Set(args.toolNames ?? [])) {
    if (!name || name.length > 256) continue;
    tools[name] = (params, context) => new Promise((resolve, reject) => {
      if (stopped || pending.size >= 64 || pending.has(context.callId)) { reject(new Error("Fish Audio client tool is unavailable.")); return; }
      const timer = setTimeout(() => { pending.delete(context.callId); reject(new Error("Fish Audio client tool timed out.")); }, 115_000);
      pending.set(context.callId, { resolve, reject, timer });
      emit({ type: "response.output_item.done", provider: "fishaudio", item: { type: "function_call", call_id: context.callId, name, arguments: JSON.stringify(params) } });
    });
  }
  try {
    client = await (args.start ?? AgentSession.start)({
      sessionToken: token, microphone: args.microphone ?? true, wakeLock: false, clientTools: tools, clientToolTimeoutMs: 120_000,
      callbacks: {
        onUserTranscript: ({ segmentId, text, final }) => emit({ type: final ? "transcript.user" : "transcript.user.delta", item_id: segmentId, text, provider: "fishaudio" }),
        onAgentResponseDelta: ({ segmentId, text }) => emit({ type: "transcript.agent.delta", item_id: segmentId, text, provider: "fishaudio" }),
        onAgentResponse: ({ segmentId, text }) => emit({ type: "transcript.agent", item_id: segmentId, text, provider: "fishaudio" }),
        // Do not subscribe to message: it duplicates final speech transcripts and echoes locally rendered typed turns.
        onStatusChange: status => emit({ type: status === "reconnecting" ? "session.reconnecting" : status === "connected" ? "session.resumed" : "fishaudio.status", status, provider: "fishaudio" }),
        onModeChange: mode => emit({ type: "fishaudio.mode", mode }),
        onDisconnect: ({ reason }) => {
          emit({ type: "fishaudio.session.closed", reason }); clearTools();
        },
        onToolCallStarted: event => emit({ type: "fishaudio.tool.started", ...event }),
        onToolCallCompleted: event => emit({ type: "fishaudio.tool.completed", ...event }),
        onToolCallFailed: event => emit({ type: "fishaudio.tool.failed", ...event }),
        onError: error => emit({ type: "session.error", code: error.code, message: `Fish Audio: ${error.code}` }),
      },
    });
    if (stopped || args.signal?.aborted) { await client.end(); throw new DOMException("Fish Audio startup cancelled.", "AbortError"); }
    await client.startAudio();
    if (stopped || args.signal?.aborted) { await client.end(); throw new DOMException("Fish Audio startup cancelled.", "AbortError"); }
    // The owning controller must install the returned session before startup transcripts/tools are delivered.
    setTimeout(() => {
      if (stopped) return;
      ready = true; args.onOpen?.();
      for (const event of queued.splice(0)) args.onEvent(event);
    }, 0);
    return {
      setMuted: muted => client!.setMicMuted(muted),
      stop,
      send: event => {
        if (stopped) throw new Error("Fish Audio session has ended.");
        if (["response.create", "session.update"].includes(event?.type)) return; // Published Fish agent owns configuration and turn continuation.
        if (["response.cancel", "user.interrupt", "input_audio_buffer.clear"].includes(event?.type)) { client!.interrupt(); return; }
        if (event?.type === "user.activity") { client!.sendUserActivity(); return; }
        if (event?.type === "conversation.item.create" && event.item?.type === "function_call_output") {
          const call = pending.get(event.item.call_id);
          if (!call) return; // Late or already settled result.
          pending.delete(event.item.call_id); clearTimeout(call.timer);
          let result: any;
          try { result = typeof event.item.output === "string" ? JSON.parse(event.item.output) : event.item.output; }
          catch { call.reject(new Error("Invalid client tool result.")); return; }
          if (result?.isError) call.reject(new Error("Client tool failed or its result was not approved.")); else call.resolve(result);
          return;
        }
        if (event?.type === "conversation.item.create" && event.item?.role === "user") {
          const content = event.item.content;
          if (!Array.isArray(content) || content.some((part: any) => !["text", "input_text"].includes(part?.type) || typeof part.text !== "string"))
            throw new Error("Fish Audio agents accept text input only.");
          client!.sendUserMessage(content.map((part: any) => part.text).join(""), { audio: true });
          return;
        }
        throw new Error("Unsupported Fish Audio client command.");
      },
    };
  } catch (error) {
    await stop().catch(() => undefined);
    // Never propagate SDK causes, room connection URLs, or token-bearing responses into history/UI diagnostics.
    if (args.signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) throw new DOMException("Fish Audio startup cancelled.", "AbortError");
    throw new Error("Fish Audio connection failed. Check microphone permission, audio availability, and the session join deadline.");
  }
}
