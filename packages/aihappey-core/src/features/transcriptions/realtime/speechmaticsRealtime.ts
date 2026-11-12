/** Recognition options are separate from token options and from the other protocol. */
export type SpeechmaticsRealtimeConfig = {
  region?: "global" | "eu" | "us" | "au";
  ttl?: number;
  transcription_config?: Record<string, any>;
  realtime_config?: Record<string, any>;
  agent_config?: Record<string, any>;
};

export function speechmaticsModel(modelId: string) {
  const model = modelId.replace(/^speechmatics\//, "");
  if (!["standard", "enhanced", "melia-1", "oak-1", "linden-1"].includes(model))
    throw new Error("Select a supported Speechmatics real-time transcription model.");
  return model;
}

export function speechmaticsConnection(modelId: string, config: SpeechmaticsRealtimeConfig = {}) {
  const model = speechmaticsModel(modelId), region = config.region ?? "global";
  if (!["global", "eu", "us", "au"].includes(region)) throw new Error("Select a documented Speechmatics region.");
  return `wss://${region}.rt.speechmatics.com/v2${model === "linden-1" ? "/agent" : ""}`;
}

export function speechmaticsStart(modelId: string, config: SpeechmaticsRealtimeConfig = {}) {
  const model = speechmaticsModel(modelId), agent = model === "linden-1";
  speechmaticsConnection(modelId, config);
  if (config.ttl !== undefined && (!Number.isInteger(config.ttl) || config.ttl < 60 || config.ttl > 86400))
    throw new Error("Speechmatics token TTL must be an integer from 60 to 86400 seconds.");
  for (const options of [config.transcription_config, config.realtime_config, config.agent_config])
    if (options !== undefined && (!options || typeof options !== "object" || Array.isArray(options))) throw new Error("Invalid Speechmatics recognition options.");
  const transcription: Record<string, any> = { ...config.transcription_config, ...(agent ? config.agent_config : config.realtime_config), model, enable_partials: true };
  const multilingual = model === "melia-1" || model === "oak-1";
  transcription.language = multilingual ? "multi" : transcription.language ?? "en";
  if (typeof transcription.language !== "string" || !transcription.language.trim() || (!multilingual && ["auto", "multi"].includes(transcription.language)))
    throw new Error("Select a language for this Speechmatics model.");
  if (transcription.diarization !== undefined && !["none", "speaker"].includes(transcription.diarization))
    throw new Error("Mono Speechmatics transcription supports none or speaker diarization.");
  if (agent && ["max_delay", "max_delay_mode", "language_hints", "conversation_config", "operating_point"].some(key => key in transcription))
    throw new Error("Put regular-only Speechmatics options in realtime_config, not shared transcription_config.");
  if (!agent && transcription.max_delay !== undefined && (typeof transcription.max_delay !== "number" || !Number.isFinite(transcription.max_delay) || transcription.max_delay < .7 || transcription.max_delay > 4))
    throw new Error("Speechmatics maximum delay must be from 0.7 to 4 seconds.");
  if (multilingual && transcription.conversation_config?.end_of_utterance_silence_trigger !== undefined)
    throw new Error("Melia 1 and Oak 1 do not support automatic end-of-utterance configuration.");
  if (Array.isArray(transcription.language_hints) && !transcription.language_hints.length) delete transcription.language_hints;
  if (!multilingual && transcription.language_hints !== undefined) throw new Error("Speechmatics language hints require Melia 1 or Oak 1.");
  return { message: "StartRecognition", audio_format: { type: "raw", encoding: "pcm_s16le", sample_rate: 16000 },
    transcription_config: transcription, ...(agent ? { turn_config: { turn_detection_mode: "vad" } } : {}) };
}

export class SpeechmaticsTranscript {
  private segments: Array<{ text: string; startSecond: number; endSecond: number }> = [];
  private text = "";
  private preview = "";
  private delimiter = " ";
  private seen = new Set<string>();
  apply(event: any): boolean {
    if (event.message === "RecognitionStarted" && typeof event.language_pack_info?.word_delimiter === "string") {
      this.delimiter = event.language_pack_info.word_delimiter; return false;
    }
    if (event.message === "EndOfTranscript") { this.preview = ""; return true; }
    const agent = event.message === "AddSegment" || event.message === "AddPartialSegment";
    const final = event.message === "AddTranscript" || event.message === "AddSegment";
    if (!agent && !final && event.message !== "AddPartialTranscript") return false;
    const value = agent ? event.segment?.transcript : event.metadata?.transcript;
    const start = event.metadata?.start_time, end = event.metadata?.end_time;
    if (typeof value !== "string" || value.length > 2_000_000 || !Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start)
      throw new Error("Invalid Speechmatics transcript segment.");
    const prefix = agent && this.text && value && !/\s$/.test(this.text) && !/^[\s.,!?;:]/.test(value) ? this.delimiter : "";
    if (final) {
      const key = JSON.stringify([event.message, start, end, value]);
      if (!this.seen.has(key)) {
        this.seen.add(key); this.text += prefix + value;
        this.segments.push({ text: value, startSecond: start, endSecond: end });
      }
      this.preview = "";
    } else this.preview = prefix + value;
    if (this.segments.length > 100_000 || this.text.length + this.preview.length > 2_000_000) throw new Error("Speechmatics transcript limit exceeded.");
    return true;
  }
  snapshot() {
    return { text: this.text, displayText: this.text + this.preview, segments: [...this.segments],
      durationInSeconds: this.segments.length ? Math.max(...this.segments.map(segment => segment.endSecond)) : undefined };
  }
}
