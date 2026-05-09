import type { RealtimeResponse } from "aihappey-ai";

export type RealtimeConversationWebrtcSession = {
  kind: "webrtc";
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  stream: MediaStream;
  send: (event: any) => void;
  setMicrophoneEnabled: (enabled: boolean) => void;
  stop: () => Promise<void>;
};

export type RealtimeConversationSession = RealtimeConversationWebrtcSession;

export type RealtimeConversationEvents = {
  onOpen?: () => void;
  onEvent?: (event: any) => void;
  onError?: (message: string, err?: unknown) => void;
  onRemoteStream?: (stream: MediaStream) => void;
};

export type RealtimeConversationWebrtcEvents = RealtimeConversationEvents;

const describeError = (e: unknown) => {
  if (!e) return "unknown";
  if (e instanceof Error) return e.message || e.name;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
};

export async function startOpenAiRealtimeConversationWebrtcSession(args: {
  getEphemeralToken: () => Promise<RealtimeResponse>;
  events?: RealtimeConversationEvents;
}): Promise<RealtimeConversationWebrtcSession> {
  const { events } = args;
  const token = await args.getEphemeralToken();
  const ephemeralKey = token.value;

  if (!ephemeralKey) {
    throw new Error("Realtime token response did not contain a value.");
  }

  const pc = new RTCPeerConnection();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  for (const track of stream.getAudioTracks()) {
    pc.addTrack(track, stream);
  }

  pc.ontrack = (event) => {
    const remoteStream = event.streams?.[0];
    if (remoteStream) events?.onRemoteStream?.(remoteStream);
  };

  pc.addEventListener("connectionstatechange", () => {
    if (pc.connectionState === "failed") {
      events?.onError?.("Realtime WebRTC connection failed");
    }
  });

  const dc = pc.createDataChannel("oai-events");
  dc.addEventListener("open", () => events?.onOpen?.());
  dc.addEventListener("error", (e) => events?.onError?.("Realtime data channel error", e));
  dc.addEventListener("message", (e) => {
    try {
      const event = JSON.parse(String(e.data));
      events?.onEvent?.(event);
    } catch (err) {
      events?.onError?.("Failed to parse realtime event", err);
    }
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${ephemeralKey}`,
      "Content-Type": "application/sdp",
    },
  });

  if (!sdpResponse.ok) {
    const body = await sdpResponse.text().catch(() => "");
    throw new Error(`Realtime SDP exchange failed (${sdpResponse.status}): ${body}`);
  }

  await pc.setRemoteDescription({
    type: "answer",
    sdp: await sdpResponse.text(),
  });

  const send = (event: any) => {
    if (dc.readyState !== "open") {
      throw new Error(`Realtime data channel is not open (${dc.readyState}).`);
    }
    dc.send(JSON.stringify(event));
  };

  const setMicrophoneEnabled = (enabled: boolean) => {
    stream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  };

  const stop = async () => {
    try {
      try {
        dc.close();
      } catch {
        // ignore
      }

      try {
        pc.getSenders().forEach((sender) => sender.track?.stop());
      } catch {
        // ignore
      }

      try {
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore
      }

      try {
        pc.close();
      } catch {
        // ignore
      }
    } catch (e) {
      events?.onError?.(`Failed stopping realtime session: ${describeError(e)}`, e);
    }
  };

  return { kind: "webrtc", pc, dc, stream, send, setMicrophoneEnabled, stop };
}

export const startRealtimeConversationWebrtcSession = startOpenAiRealtimeConversationWebrtcSession;

