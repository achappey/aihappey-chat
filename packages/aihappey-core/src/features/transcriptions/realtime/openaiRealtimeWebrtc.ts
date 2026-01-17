import type { RealtimeResponse } from "aihappey-ai";

export type OpenAiRealtimeWebrtcSession = {
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  stream: MediaStream;
  stop: () => Promise<void>;
};

export type OpenAiRealtimeWebrtcEvents = {
  onEvent?: (event: any) => void;
  onTranscriptText?: (text: string) => void;
  /** Fired when OpenAI emits a `session.created` event. */
  onSessionCreated?: (session: any) => void;
  onError?: (message: string, err?: unknown) => void;
};

const describeError = (e: unknown) => {
  if (!e) return "unknown";
  if (e instanceof Error) return e.message || e.name;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
};

/**
 * Connects to OpenAI Realtime via WebRTC using an *ephemeral* token.
 *
 * Token must be created on your server (never in the browser).
 */
export async function startOpenAiRealtimeWebrtcSession(args: {
  getEphemeralToken: () => Promise<RealtimeResponse>;
  events?: OpenAiRealtimeWebrtcEvents;
}): Promise<OpenAiRealtimeWebrtcSession> {
  const { events } = args;
  const token = await args.getEphemeralToken();
  const EPHEMERAL_KEY = token.value;

  const pc = new RTCPeerConnection();

  // Add local mic track
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const tracks = stream.getTracks();
  if (tracks[0]) pc.addTrack(tracks[0]);

  // Data channel
  const dc = pc.createDataChannel("oai-events");
  dc.addEventListener("message", (e) => {
    try {
      const event = JSON.parse(String(e.data));
      events?.onEvent?.(event);

      if (event?.type === "session.created") {
        events?.onSessionCreated?.(event?.session);
      }

      if(event.type == "conversation.item.input_audio_transcription.delta") {
          events?.onTranscriptText?.(event.delta);
      }
    } catch (err) {
      events?.onError?.("Failed to parse realtime event", err);
    }
  });

  // SDP exchange
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${EPHEMERAL_KEY}`,
      "Content-Type": "application/sdp",
    },
  });

  if (!sdpResponse.ok) {
    const body = await sdpResponse.text().catch(() => "");
    throw new Error(`Realtime SDP exchange failed (${sdpResponse.status}): ${body}`);
  }

  const answer = {
    type: "answer" as const,
    sdp: await sdpResponse.text(),
  };
  await pc.setRemoteDescription(answer);

  const stop = async () => {
    try {
      try {
        dc.close();
      } catch {
        // ignore
      }

      try {
        pc.getSenders().forEach((s) => s.track?.stop());
      } catch {
        // ignore
      }

      try {
        pc.close();
      } catch {
        // ignore
      }

      try {
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
    } catch (e) {
      events?.onError?.(`Failed stopping realtime session: ${describeError(e)}`, e);
    }
  };

  return { pc, dc, stream, stop };
}

