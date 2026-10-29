/** Output-only, mono PCM16 scheduling. Adjacent packets share a continuous audio clock. */
export class PcmSpeechOutput {
    private context: AudioContext;
    private sources = new Set<AudioBufferSourceNode>();
    private next = 0;
    private carry?: number;
    private stopped = false;
    private scheduled = false;
    private reported = false;
    constructor(private sampleRate: number, private signal: AbortSignal, private started: () => void, context?: AudioContext,
        private options: { littleEndian?: boolean; initialBufferSeconds?: number } = {}) {
        signal.throwIfAborted();
        if (!Number.isInteger(sampleRate) || sampleRate <= 0) throw new Error("Speech PCM sample rate must be a positive integer.");
        this.context = context ?? new AudioContext();
        signal.addEventListener("abort", this.stop, { once: true });
    }
    get hasStarted() { return this.scheduled && this.context.currentTime >= this.firstStart; }
    private firstStart = Infinity;
    push(bytes: Uint8Array) {
        this.signal.throwIfAborted();
        if (this.stopped) return;
        this.reportStarted();
        if (this.carry !== undefined) { const joined = new Uint8Array(bytes.length + 1); joined[0] = this.carry; joined.set(bytes, 1); bytes = joined; this.carry = undefined; }
        if (bytes.length % 2) { this.carry = bytes[bytes.length - 1]; bytes = bytes.subarray(0, -1); }
        if (!bytes.length) return;
        const context = this.context;
        if (context.state !== "running") throw new Error("Speech audio output is suspended.");
        if (this.next - context.currentTime + bytes.length / 2 / this.sampleRate > 90) throw new Error("Speech playback backlog exceeded.");
        const buffer = context.createBuffer(1, bytes.length / 2, this.sampleRate);
        const data = buffer.getChannelData(0), view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        for (let i = 0; i < data.length; i++) data[i] = view.getInt16(i * 2, this.options.littleEndian ?? true) / 32768;
        const source = context.createBufferSource(); source.buffer = buffer; source.connect(context.destination);
        // Buffer initial/restarted playback against network jitter, without inserting gaps
        // between chunks already scheduled on the audio clock. Existing callers retain 15 ms.
        const lead = this.next <= context.currentTime ? this.options.initialBufferSeconds ?? 0.015 : 0;
        const at = Math.max(this.next, context.currentTime + lead);
        this.firstStart = Math.min(this.firstStart, at); this.next = at + buffer.duration;
        this.sources.add(source); source.onended = () => { this.reportStarted(); this.sources.delete(source); source.disconnect(); };
        source.start(at); this.scheduled = true;
    }
    private reportStarted() { if (this.hasStarted && !this.reported) { this.reported = true; this.started(); } }
    async drain() {
        this.signal.throwIfAborted();
        if (this.carry !== undefined) throw new Error("Speech returned an incomplete PCM sample.");
        while (this.sources.size) { this.reportStarted(); this.signal.throwIfAborted(); if (this.context.state !== "running") throw new Error("Speech audio output stopped."); await new Promise(resolve => setTimeout(resolve, 20)); }
        this.signal.throwIfAborted();
    }
    stop = () => {
        if (this.stopped) return; this.stopped = true;
        this.reportStarted();
        for (const source of this.sources) { source.onended = null; try { source.stop(); } catch {} source.disconnect(); }
        this.sources.clear(); this.carry = undefined; this.signal.removeEventListener("abort", this.stop);
    };
}
