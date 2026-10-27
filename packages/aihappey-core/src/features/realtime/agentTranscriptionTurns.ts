/** Normalize provider events without interpreting finalized fragments as whole turns. */
export class AgentTranscriptionTurns {
    private finals: string[] = [];
    private partial = "";
    private active = false;
    private speaking = false;
    private seen = new Set<string>();
    private seenEvents = new Set<string>();
    private completed = new Set<string>();
    private utterances = new Set<string>();
    private itemPartials = new Map<string, string>();
    private generation = 0;
    private lastUnkeyedTurn?: { text: string; generation: number };
    private audioThrough = -1;
    private turnAudioThrough = -1;
    private timer?: ReturnType<typeof setTimeout>;
    private disposed = false;
    constructor(private provider: string, private callbacks: {
        // start means confirmed, non-empty NEW transcription, never acoustic activity.
        start: () => void; preview: (text: string) => void; turn: (text: string) => void;
    }) {}
    activity(speaking: boolean) {
        if (this.disposed) return;
        if (speaking && !this.speaking) this.generation++;
        this.speaking = speaking;
        if (speaking) clearTimeout(this.timer);
        else this.schedule();
    }
    private start() { if (!this.active && !this.disposed) { this.active = true; this.callbacks.start(); } }
    private accepts(text: string, key?: string) {
        if (this.disposed || !text.trim() || (key && this.completed.has(key))) return false;
        // Identity-less protocols cannot distinguish an identical replay from a new
        // utterance without fresh acoustic/provider-boundary or different text evidence.
        if (!key && this.lastUnkeyedTurn?.generation === this.generation
            && this.lastUnkeyedTurn.text === text.trim()) return false;
        if (key) this.utterances.add(key);
        else this.lastUnkeyedTurn = undefined;
        return true;
    }
    private preview(text: string, key?: string) {
        if (!this.accepts(text, key)) return;
        this.start();
        this.partial = text;
        this.callbacks.preview([...this.finals, text].filter(Boolean).join(this.separator).trim());
    }
    private append(text: string, fragmentKey?: string, utteranceKey?: string) {
        if ((fragmentKey && this.seen.has(fragmentKey)) || !this.accepts(text, utteranceKey)) return false;
        if (fragmentKey) this.seen.add(fragmentKey);
        this.start(); this.finals.push(text); this.partial = "";
        this.callbacks.preview(this.finals.join(this.separator).trim());
        this.schedule(); return true;
    }
    private complete(text: string, key?: string) {
        if (key && this.completed.has(key)) return;
        if (!key) {
            if (this.append(text)) this.finish();
            return;
        }
        // A whole-utterance final is authoritative, not another fragment. Other
        // items can still have in-flight deltas when this one completes.
        const accepted = this.accepts(text, key);
        this.completed.add(key); this.itemPartials.delete(key);
        this.utterances.delete(key);
        if (!accepted) {
            if (!this.utterances.size) { this.partial = ""; this.active = false; }
            return; // Empty finals close only their item; never interrupt.
        }
        this.start();
        this.callbacks.preview(text.trim());
        this.partial = ""; this.active = false;
        this.callbacks.turn(text.trim());
    }
    private schedule() {
        clearTimeout(this.timer);
        // Native endpointing is authoritative. Final fragments alone are not a turn end.
        if (["openai", "deepgram", "assemblyai", "elevenlabs", "gladia"].includes(this.provider)) return;
        if (!this.speaking && this.finals.length) this.timer = setTimeout(() => this.finish(), 900);
    }
    private get separator() { return ["soniox", "cartesia"].includes(this.provider) ? "" : " "; }
    private finish() {
        clearTimeout(this.timer);
        const text = this.finals.join(this.separator).trim();
        for (const key of this.utterances) { this.completed.add(key); this.itemPartials.delete(key); }
        this.utterances.clear();
        this.audioThrough = Math.max(this.audioThrough, this.turnAudioThrough);
        this.turnAudioThrough = -1;
        this.finals = []; this.partial = ""; this.active = false;
        if (text) this.lastUnkeyedTurn = { text, generation: this.generation };
        if (text && !this.disposed) this.callbacks.turn(text);
    }
    reset() {
        clearTimeout(this.timer);
        // Discarded drafts must not reappear after mute/unmute through late events.
        for (const key of this.utterances) this.completed.add(key);
        this.utterances.clear(); this.itemPartials.clear();
        this.audioThrough = Math.max(this.audioThrough, this.turnAudioThrough); this.turnAudioThrough = -1;
        this.finals = []; this.partial = ""; this.active = false; this.speaking = false;
    }
    dispose() { this.disposed = true; this.reset(); }
    event(event: any) {
        if (this.disposed || event?.__synthetic) return;
        if (event?.event_id) {
            if (this.seenEvents.has(event.event_id)) return;
            this.seenEvents.add(event.event_id);
        }
        const type = event?.type ?? event?.message_type;
        switch (this.provider) {
            case "openai": {
                const key = event.item_id == null ? undefined : `openai:${event.item_id}`;
                if (key && this.completed.has(key)) break;
                // VAD hints alone are not transcription and must never interrupt.
                if (type === "conversation.item.input_audio_transcription.delta") {
                    const delta = String(event.delta ?? "");
                    const text = (key ? this.itemPartials.get(key) ?? "" : this.partial) + delta;
                    if (key) this.itemPartials.set(key, text);
                    // Whitespace can be part of a token stream, but it is never
                    // evidence of new speech, even when an older partial exists.
                    if (delta.trim()) this.preview(text, key);
                }
                if (type === "conversation.item.input_audio_transcription.completed") this.complete(String(event.transcript ?? ""), key);
                break;
            }
            case "deepgram": {
                if (type === "UtteranceEnd" && (event.last_word_end == null || Number(event.last_word_end) > this.audioThrough)) this.finish();
                if (type !== "Results") break;
                const end = Number(event.start) + Number(event.duration);
                if (Number.isFinite(end) && end <= this.audioThrough) break;
                const text = String(event.channel?.alternatives?.[0]?.transcript ?? "");
                if (event.is_final) {
                    if (this.append(text, `deepgram:${event.start}:${event.duration}`) && Number.isFinite(end))
                        this.turnAudioThrough = Math.max(this.turnAudioThrough, end);
                }
                else this.preview(text);
                if (event.speech_final) this.finish();
                break;
            }
            case "assemblyai":
                if (type === "Turn") {
                    const key = event.turn_order == null ? undefined : `assemblyai:${event.turn_order}`;
                    if (event.end_of_turn) this.complete(String(event.transcript ?? ""), key);
                    else this.preview(String(event.transcript ?? ""), key);
                }
                break;
            case "elevenlabs":
                if (type === "partial_transcript") this.preview(String(event.text ?? ""), event.item_id);
                // With timestamps enabled the provider sends the same commit twice.
                if (type === "committed_transcript" || type === "committed_transcript_with_timestamps") {
                    this.complete(String(event.text ?? ""), event.item_id);
                }
                break;
            case "gladia":
                if (type === "transcript") {
                    const utterance = event.data?.utterance;
                    const identity = utterance?.start ?? event.data?.id;
                    const key = identity == null ? undefined : `gladia:${identity}`;
                    if (event.data?.is_final) this.complete(String(utterance?.text ?? ""), key);
                    else this.preview(String(utterance?.text ?? ""), key);
                }
                break;
            case "google": {
                const content = event.serverContent;
                if (content?.interimInputTranscription) this.preview(String(content.interimInputTranscription.text ?? ""));
                if (content?.inputTranscription) this.append(String(content.inputTranscription.text ?? ""));
                if (content?.turnComplete) this.finish();
                break;
            }
            case "soniox": {
                const tokens = (event.tokens ?? []).filter((token: any) => {
                    if (token.start_ms == null || ["<fin>", "<end>"].includes(token.text)) return true;
                    if (Number(token.end_ms) <= this.audioThrough) return false;
                    const key = `soniox:${token.start_ms}:${token.end_ms}:${token.text}`;
                    if (token.is_final) { if (this.seen.has(key)) return false; this.seen.add(key); }
                    return true;
                });
                const text = tokens.filter((token: any) => token.is_final && !["<fin>", "<end>"].includes(token.text)).map((token: any) => token.text).join("");
                if (this.append(text)) for (const token of tokens.filter((token: any) => token.is_final)) {
                    if (Number.isFinite(token.end_ms)) this.turnAudioThrough = Math.max(this.turnAudioThrough, token.end_ms);
                }
                this.preview(tokens.filter((token: any) => !token.is_final).map((token: any) => token.text).join(""));
                if (tokens.some((token: any) => token.is_final && ["<fin>", "<end>"].includes(token.text))) this.finish();
                break;
            }
            case "cartesia": {
                const key = event.turn_id == null ? undefined : `cartesia:${event.turn_id}`;
                if (key && this.completed.has(key)) break;
                if (type === "turn.start") this.generation++;
                if (type === "turn.update" || type === "turn.eager_end") this.preview(String(event.transcript ?? ""), key);
                if (type === "turn.end") this.complete(String(event.transcript ?? ""), key);
                if (type === "transcript") {
                    if (event.is_final) this.append(String(event.text ?? ""), event.start == null ? undefined : `cartesia:${event.start}:${event.end}`, key);
                    else this.preview(String(event.text ?? ""), key);
                }
                break;
            }
        }
    }
}
