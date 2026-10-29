/** Incremental, bounded RIFF/WAVE reader. Deltas are byte fragments, not standalone files. */
export class StreamingWaveDecoder {
    private header = new Uint8Array(0);
    private riff = false;
    private format = false;
    private data = false;
    private remaining: number | undefined;
    private received = 0;
    private sampleRate = 0;
    constructor(private audio: (bytes: Uint8Array, sampleRate: number) => void) {}

    push(bytes: Uint8Array) {
        if (this.data) { this.pushAudio(bytes); return; }
        const joined = new Uint8Array(this.header.length + bytes.length);
        joined.set(this.header); joined.set(bytes, this.header.length); this.header = joined;
        const name = (offset: number) => String.fromCharCode(...this.header.subarray(offset, offset + 4));
        if (!this.riff) {
            if (this.header.length < 12) return;
            if (name(0) !== "RIFF" || name(8) !== "WAVE") throw new Error("Unsupported streaming WAV container.");
            this.header = this.header.slice(12); this.riff = true;
        }
        while (this.header.length >= 8) {
            const view = new DataView(this.header.buffer, this.header.byteOffset, this.header.byteLength);
            const kind = name(0), length = view.getUint32(4, true);
            if (kind === "data") {
                if (!this.format) throw new Error("Streaming WAV has no PCM format.");
                // Streaming WAV writers may use zero or UINT32_MAX for an unknown data length.
                this.remaining = length === 0 || length === 0xffffffff ? undefined : length;
                this.data = true; const audio = this.header.slice(8); this.header = new Uint8Array(0);
                this.pushAudio(audio); return;
            }
            if (length > 65536) throw new Error("Streaming WAV header exceeded its limit.");
            const size = 8 + length + (length % 2);
            if (this.header.length < size) break;
            if (kind === "fmt ") {
                const rate = view.getUint32(12, true);
                if (this.format || length < 16 || view.getUint16(8, true) !== 1 || view.getUint16(10, true) !== 1
                    || view.getUint16(22, true) !== 16 || view.getUint16(20, true) !== 2
                    || rate < 8000 || rate > 96000 || view.getUint32(16, true) !== rate * 2)
                    throw new Error("Streaming WAV requires mono signed 16-bit PCM.");
                this.sampleRate = rate; this.format = true;
            }
            this.header = this.header.slice(size);
        }
        if (this.header.length > 65536) throw new Error("Streaming WAV header exceeded its limit.");
    }
    private pushAudio(bytes: Uint8Array) {
        if (this.remaining !== undefined) {
            if (bytes.length > this.remaining) throw new Error("Streaming WAV exceeded its declared audio length.");
            this.remaining -= bytes.length;
        }
        this.received += bytes.length;
        if (bytes.length) this.audio(bytes, this.sampleRate);
    }
    finish() {
        if (!this.data || this.received % 2 || this.remaining !== undefined && this.remaining !== 0)
            throw new Error("Streaming WAV ended with incomplete audio.");
    }
}
