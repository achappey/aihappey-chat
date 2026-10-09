import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createDecisionProvider, defaultEndpoints } from "aihappey-ai";
import { isInlineDecisionImage, isValidDecisionInput, isValidDecisionQuestions, isValidDecisionResponse, MAX_DECISION_IMAGES, toWireQuestions, useDecisions, type DecisionInput, type DecisionQuestion, type DecisionResponse } from "aihappey-decisions";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { useChatContext } from "../chat/context/ChatContext";
import { useQueryModelId } from "../models/queryModelSelection";
import { useStorageErrorMessage } from "../storage/storageErrorMessage";

export type DecisionImage = { id: string; name: string; image_url: string };

function readInlineImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" && isInlineDecisionImage(reader.result) ? resolve(reader.result) : reject(new Error("Invalid image"));
    reader.onerror = () => reject(reader.error);
    reader.onabort = () => reject(new Error("Image read aborted"));
    reader.readAsDataURL(file);
  });
}

export function useDecisionsController() {
  const { t } = useTranslation();
  const storageError = useStorageErrorMessage();
  const { config } = useChatContext();
  const store = useDecisions();
  const models = useAppStore(s => s.models);
  const preferred = useAppStore(s => s.userPreferredDecisionModel);
  const customHeaders = useAppStore(s => s.customHeaders);
  const queryModel = useQueryModelId(models ?? [], "decision");
  const [selectedModel, setModel] = useState(queryModel ?? preferred ?? "");
  const [prompt, setPromptState] = useState("");
  const [questions, setQuestionsState] = useState<DecisionQuestion[]>([]);
  const [images, setImages] = useState<DecisionImage[]>([]);
  const [result, setResult] = useState<DecisionResponse>();
  const [providerOptionsText, setOptionsText] = useState("{}");
  const providerOptions = useMemo<Record<string, any> | undefined>(() => {
    try {
      const value = JSON.parse(providerOptionsText);
      return value && typeof value === "object" && !Array.isArray(value)
        && Object.values(value).every(v => v && typeof v === "object" && !Array.isArray(v)) ? value : undefined;
    } catch { return undefined; }
  }, [providerOptionsText]);
  const providerOptionsValid = providerOptions !== undefined;
  const [processing, setProcessing] = useState(false);
  const [readingImages, setReadingImages] = useState(false);
  const [errors, setErrors] = useState<{ id: string; message: string }[]>([]);
  const busy = useRef(false);
  const reading = useRef(false);
  const revision = useRef(0);
  const mounted = useRef(true);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; abort.current?.abort(); }; }, []);
  const addError = useCallback((message: string) => { if (mounted.current) setErrors(current => [...current, { id: crypto.randomUUID(), message }]); }, []);
  const dismissError = useCallback((id: string) => setErrors(current => current.filter(e => e.id !== id)), []);
  const invalidate = useCallback(() => { revision.current++; setResult(undefined); }, []);
  const setSelectedModel = useCallback((value: string) => { invalidate(); setModel(value); }, [invalidate]);
  const setPrompt = useCallback((value: string) => { invalidate(); setPromptState(value); }, [invalidate]);
  const setQuestions = useCallback((value: DecisionQuestion[]) => { invalidate(); setQuestionsState(structuredClone(value)); }, [invalidate]);
  const setProviderOptionsText = useCallback((value: string) => { invalidate(); setOptionsText(value); }, [invalidate]);
  useEffect(() => { if (queryModel) setSelectedModel(queryModel); }, [queryModel, setSelectedModel]);
  const input = useMemo<DecisionInput>(() => images.length ? [{ role: "user", content: [
    ...(prompt.trim() ? [{ type: "input_text" as const, text: prompt }] : []),
    ...images.map(image => ({ type: "input_image" as const, image_url: image.image_url, detail: "auto" as const })),
  ] }] : prompt, [prompt, images]);
  const modelValid = !!models?.some(m => m.id === selectedModel && m.type === "decision" && m.route !== "direct");
  const gatewayAvailable = !!config.baseUrl && config.gatewayEnabled !== false;
  const canSend = gatewayAvailable && modelValid && !processing && !readingImages && isValidDecisionInput(input)
    && isValidDecisionQuestions(questions) && providerOptionsValid;

  const addImages = useCallback(async (files: File[]) => {
    if (!files.length || busy.current || reading.current) return;
    if (images.length + files.length > MAX_DECISION_IMAGES) { addError(t("decisionsPage.imageLimit")); return; }
    if (files.some(file => !/^image\/(png|jpeg|webp|gif)$/i.test(file.type))) { addError(t("decisionsPage.unsupportedImage")); return; }
    reading.current = true; setReadingImages(true);
    try {
      const added = await Promise.all(files.map(async file => ({ id: crypto.randomUUID(), name: file.name, image_url: await readInlineImage(file) })));
      if (mounted.current) { invalidate(); setImages(current => [...current, ...added]); }
    } catch { addError(t("decisionsPage.imageReadFailed")); }
    finally { reading.current = false; if (mounted.current) setReadingImages(false); }
  }, [images.length, addError, invalidate, t]);
  const removeImage = useCallback((id: string) => { invalidate(); setImages(current => current.filter(image => image.id !== id)); }, [invalidate]);

  const onSend = useCallback(async () => {
    if (!canSend || busy.current || reading.current) return;
    busy.current = true; setProcessing(true); setResult(undefined);
    const request = structuredClone({ model: selectedModel, input, questions, providerOptions });
    const requestRevision = revision.current;
    const controller = new AbortController(); abort.current = controller;
    try {
      const headers = new Headers({ ...config.headers, ...customHeaders });
      // Authentication failure is an error, never an unauthenticated fallback request.
      if (config.getAccessToken) headers.set("Authorization", `Bearer ${await config.getAccessToken()}`);
      if (controller.signal.aborted) return;
      const client = createDecisionProvider({
        baseUrl: config.baseUrl.replace(/\/+$/, "") + (config.endpoints.decisions ?? defaultEndpoints.decisions),
        headers: Object.fromEntries(headers.entries()), fetch: config.fetch,
      });
      const response = await client.decisionModel(request.model).doDecide({ state: request.input,
        questions: toWireQuestions(request.questions), providerOptions: request.providerOptions, abortSignal: controller.signal });
      if (!isValidDecisionResponse(response, request.questions)) throw new Error(t("decisionsPage.invalidResponse"));
      if (!mounted.current) return;
      if (revision.current === requestRevision) setResult(response);
      try { await store.add(request.input, request.questions, response); }
      catch (err) { addError(storageError(err, t("decisionsPage.saveFailed"))); }
    } catch (err) {
      if (!controller.signal.aborted) addError(err instanceof Error ? err.message : t("decisionsPage.executionFailed"));
    } finally {
      busy.current = false;
      if (mounted.current) setProcessing(false);
    }
  }, [canSend, selectedModel, input, questions, providerOptions, config, customHeaders, store, addError, storageError, t]);
  return { models, selectedModel, setSelectedModel, prompt, setPrompt, questions, setQuestions, images,
    addImages, removeImage, result, processing, readingImages, canSend, gatewayAvailable,
    providerOptionsText, setProviderOptionsText, providerOptionsValid, errors, addError, dismissError, onSend };
}
