import type { Experimental_RealtimeModelV4 as RealtimeModelV4, Experimental_RealtimeModelV4SessionConfig as SessionConfig } from '@ai-sdk/provider';
import type { RealtimeConversationEvents, RealtimeConversationWebrtcSession } from './startRealtimeConversationWebrtc';

/** Negotiation only: media and native protocol events remain independent of provisioning. */
export async function startGatewayRealtimeWebrtc(args: {
  model: RealtimeModelV4; sessionConfig: SessionConfig; events?: RealtimeConversationEvents; signal?: AbortSignal;
}): Promise<RealtimeConversationWebrtcSession> {
  const pc = new RTCPeerConnection();
  const lifetime = new AbortController();
  let stream: MediaStream | undefined;
  let stopped = false;
  let closed!: () => void;
  const finalized = new Promise<void>(resolve => { closed = resolve; });
  const live = args.model.capabilities?.conversation === 'continuous';
  const startupTimeout = setTimeout(() => { args.events?.onError?.('Realtime session startup timed out.'); cleanup(); }, 40000);
  const dc = pc.createDataChannel(args.model.getWebRTCConfig?.().dataChannelLabel ?? 'oai-events');
  const cleanup = () => {
    if (stopped) return;
    stopped = true; lifetime.abort(); dc.close();
    clearTimeout(startupTimeout);
    stream?.getTracks().forEach(track => track.stop()); pc.close();
    args.signal?.removeEventListener('abort', cleanup);
  };
  args.signal?.addEventListener('abort', cleanup, { once: true });
  const send = (event: any) => {
    if (stopped || dc.readyState !== 'open') throw new Error('Realtime data channel is not open.');
    const payload = JSON.stringify(event);
    const limit = Math.min(pc.sctp?.maxMessageSize || 65536, 262144);
    if (new TextEncoder().encode(payload).length > limit || dc.bufferedAmount > 1048576) throw new Error('Realtime data-channel message or buffer limit exceeded.');
    dc.send(payload);
  };
  try {
    args.signal?.throwIfAborted();
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (lifetime.signal.aborted) { stream.getTracks().forEach(track => track.stop()); throw new DOMException('Aborted', 'AbortError'); }
    stream.getAudioTracks().forEach(track => pc.addTrack(track, stream!));
    pc.ontrack = event => { if (event.streams[0]) args.events?.onRemoteStream?.(event.streams[0]); };
    let open = false;
    let negotiated = false;
    const ready = () => { if (open && negotiated && !stopped) setTimeout(() => { if (!stopped) args.events?.onOpen?.(); }, 0); };
    dc.onopen = () => { open = true; ready(); };
    dc.onerror = error => args.events?.onError?.('Realtime data channel failed.', error);
    dc.onclose = () => { closed(); if (!stopped) args.events?.onError?.('Realtime data channel closed.'); cleanup(); };
    dc.onmessage = event => {
      try {
        const raw = JSON.parse(String(event.data));
        // The installed SDK exposes unsupported native Live envelopes as custom events.
        // Retain the raw event for native Responses tools and newer provider fields.
        args.model.parseServerEvent(raw);
        if (raw.type === 'session.closed') closed();
        args.events?.onEvent?.(raw);
      } catch (error) { args.events?.onError?.('Invalid realtime event.', error); }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') { args.events?.onError?.('Realtime WebRTC connection failed.'); cleanup(); }
    };
    const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
    const answer = await args.model.doCreateWebRTCSession!({ sdp: pc.localDescription!.sdp, sessionConfig: args.sessionConfig, abortSignal: lifetime.signal });
    lifetime.signal.throwIfAborted();
    await pc.setRemoteDescription({ type: 'answer', sdp: answer.sdp });
    negotiated = true; clearTimeout(startupTimeout); ready();
    return { kind: 'webrtc', pc, dc, stream, send,
      setMicrophoneEnabled(enabled) { stream!.getAudioTracks().forEach(track => { track.enabled = enabled; }); if (live && dc.readyState === 'open') send({ type: enabled ? 'session.input_audio.unmute' : 'session.input_audio.mute', event_id: crypto.randomUUID() }); },
      async stop() {
        if (stopped) return;
        try {
          if (live && dc.readyState === 'open') {
            send({ type: 'session.close', event_id: crypto.randomUUID() });
            await Promise.race([finalized, new Promise(resolve => setTimeout(resolve, 1500))]);
          }
        } finally { cleanup(); }
      },
    };
  } catch (error) { cleanup(); throw error; }
}
