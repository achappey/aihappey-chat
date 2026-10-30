import { startFishAudioSession, type FishAudioSession } from "./fishAudioSession";

// This document has no presentation. The native host owns all controls, approval prompts and history.
const bridge = (window as any).chrome?.webview;
const nonce = location.hash.slice(1);
if (!bridge || !/^[a-f0-9]{32}$/.test(nonce)) throw new Error("Invalid native transport host.");
let session: FishAudioSession | undefined;
let starting = false, ended = false, lastId = 0;
const lifetime = new AbortController();
const post = (value: any) => bridge.postMessage({ version: 1, nonce, ...value });
const event = (value: any) => post({ kind: "event", event: value });
bridge.addEventListener("message", async ({ data }: { data: any }) => {
  if (!data || data.version !== 1 || data.nonce !== nonce || !Number.isSafeInteger(data.id) || data.id <= lastId || JSON.stringify(data).length > 262144) return;
  lastId = data.id;
  try {
    switch (data.command) {
      case "start":
        if (starting || session || ended) throw new Error("Already started.");
        starting = true;
        session = await startFishAudioSession({ sessionToken: data.payload?.sessionToken,
          toolNames: Array.isArray(data.payload?.toolNames) ? data.payload.toolNames.filter((v: unknown) => typeof v === "string").slice(0, 256) : [],
          signal: lifetime.signal, onEvent: event, onError: () => event({ type: "session.error", code: "connection_failed" }) });
        break;
      case "send":
        if (!session || ended) throw new Error("Not connected.");
        session.send(data.payload); break;
      case "mute":
        if (!session || typeof data.payload?.muted !== "boolean") throw new Error("Invalid mute request.");
        await session.setMuted(data.payload.muted); break;
      case "stop":
        ended = true; lifetime.abort(); await session?.stop(); session = undefined; break;
      case "probe": {
        // Explicit diagnostic only; no credential or SDK session. Exercises actual invisible-host media APIs.
        if (starting || ended) throw new Error("Probe unavailable.");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const context = new AudioContext();
        try {
          await context.resume();
          const oscillator = context.createOscillator(); const gain = context.createGain();
          gain.gain.value = 0.02; oscillator.connect(gain).connect(context.destination); oscillator.start();
          await new Promise(resolve => setTimeout(resolve, 300)); oscillator.stop();
          if (context.state !== "running" || !stream.getAudioTracks().some(track => track.readyState === "live")) throw new Error("Media unavailable.");
          event({ type: "fishaudio.media.probe", microphone: true, playback: true, hidden: document.hidden });
        } finally { stream.getTracks().forEach(track => track.stop()); await context.close(); }
        break;
      }
      default: throw new Error("Unsupported command.");
    }
    post({ kind: "ack", id: data.id, ok: true });
  } catch {
    // Never forward raw SDK errors, command payloads, connection URLs or token-bearing objects.
    post({ kind: "ack", id: data.id, ok: false });
  }
});
post({ kind: "ready" });
