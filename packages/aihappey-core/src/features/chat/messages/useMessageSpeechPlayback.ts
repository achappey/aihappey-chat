import {
  base64ToUint8Array,
  createSpeechProvider,
  readOpenAISse,
  type OpenAISpeechStreamEvent,
} from "aihappey-ai";
import type { ChatMessage } from "aihappey-types";
import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "aihappey-state";
import { useChatContext } from "../context/ChatContext";
import { buildStreamingHeaders, resolveStreamingUrl } from "../../streaming/streamingRequest";
import { createStreamingAudioPlayback, type StreamingAudioPlayback } from "../../streaming/streamingAudioPlayback";

const STREAMING_FORMAT = "mp3" as const;

const getMessageText = (message: ChatMessage) =>
  (message.content ?? [])
    .filter((part: any) => part?.type === "text" || part?.type === "reasoning")
    .map((part: any) => String(part.text ?? ""))
    .join("\n")
    .trim();

const getProviderOptionsForSelectedModel = (
  selectedModel: string,
  providerOptions: Record<string, any> | undefined,
) => {
  const providerKey = selectedModel.split("/")[0]?.trim().toLowerCase();
  const providerConfig = providerKey ? providerOptions?.[providerKey] : undefined;
  return providerConfig === undefined || !providerKey ? undefined : { [providerKey]: providerConfig };
};

type UseMessageSpeechPlaybackOptions = {
  onError: () => void;
};

/**
 * Plays assistant-message text without adding speech items or visual UI.
 * OpenAI-compatible SSE is preferred; the established /api/speech request is
 * used only when the streaming route fails to return playable audio.
 */
export const useMessageSpeechPlayback = ({ onError }: UseMessageSpeechPlaybackOptions) => {
  const { config } = useChatContext();
  const customHeaders = useAppStore((state) => state.customHeaders);
  const model = useAppStore((state) => state.userPreferredSpeechModel);
  const providerSpeechMetadata = useAppStore((state) => state.providerSpeechMetadata);
  const voice = useAppStore((state) => state.voice);
  const outputFormat = useAppStore((state) => state.speechOutputFormat);
  const instructions = useAppStore((state) => state.speechInstructions);
  const speed = useAppStore((state) => state.speed);
  const language = useAppStore((state) => state.speechLanguage);
  const playbackRef = useRef<StreamingAudioPlayback | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    playbackRef.current?.dispose();
    playbackRef.current = null;
    audioRef.current?.pause();
    audioRef.current?.removeAttribute("src");
    audioRef.current?.load();
    audioRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const speak = useCallback(async (message: ChatMessage) => {
    const text = getMessageText(message);
    if (!model || !text) return;

    stop();

    try {
      const audio = new Audio();
      const playback = createStreamingAudioPlayback(STREAMING_FORMAT, audio);
      audioRef.current = audio;
      playbackRef.current = playback;
      const chunks: Uint8Array[] = [];
      const headers = await buildStreamingHeaders(config, customHeaders);
      headers.set("Content-Type", "application/json");

      await readOpenAISse<OpenAISpeechStreamEvent>({
        url: resolveStreamingUrl(config.baseUrl, config.endpoints.oaiSpeech),
        fetch: config.fetch,
        init: {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            input: text,
            response_format: STREAMING_FORMAT,
            voice: voice || undefined,
            instructions: instructions || undefined,
            speed,
            stream_format: "sse",
          }),
        },
        onEvent: (event) => {
          if (event.type !== "speech.audio.delta" || typeof event.audio !== "string") return;
          const chunk = base64ToUint8Array(event.audio);
          chunks.push(chunk);
          playback.append(chunk);
        },
      });

      if (!chunks.length) throw new Error("Streaming speech returned no audio.");
      await playback.finish(chunks);
      return;
    } catch {
      // Dispose partial streaming audio before starting the independent fallback.
      stop();
    }

    try {
      const headers = {
        ...(config.headers ?? {}),
        ...(customHeaders ?? {}),
      } as Record<string, string>;
      if (config.getAccessToken) headers.Authorization = `Bearer ${await config.getAccessToken()}`;

      const provider = createSpeechProvider({
        baseUrl: resolveStreamingUrl(config.baseUrl, config.endpoints.speech),
        headers,
      });
      const result = await provider.speechModel(model).doGenerate({
        text,
        voice,
        outputFormat,
        instructions,
        speed,
        language,
        providerOptions: getProviderOptionsForSelectedModel(model, providerSpeechMetadata),
      });
      const source = (result as any).audio;
      if (typeof source !== "string" || !source.startsWith("data:audio/")) {
        throw new Error("Speech fallback returned no playable audio.");
      }

      const audio = new Audio(source);
      audioRef.current = audio;
      await audio.play();
    } catch {
      stop();
      onError();
    }
  }, [config, customHeaders, instructions, language, model, onError, outputFormat, providerSpeechMetadata, speed, stop, voice]);

  return { canSpeak: !!model, speak };
};
