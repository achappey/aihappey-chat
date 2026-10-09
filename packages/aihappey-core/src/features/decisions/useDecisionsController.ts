import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createDecisionProvider, defaultEndpoints } from "aihappey-ai";
import { isValidDecisionInput, isValidDecisionQuestions, isValidDecisionResponse, toWireQuestions, useDecisions, type DecisionQuestion, type DecisionResponse } from "aihappey-decisions";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { useChatContext } from "../chat/context/ChatContext";
import { useQueryModelId } from "../models/queryModelSelection";
import { useStorageErrorMessage } from "../storage/storageErrorMessage";
import { composeDecisionInput, prepareDecisionAttachments, type DecisionDocument, type DecisionImage } from "./decisionAttachments";
export type { DecisionImage } from "./decisionAttachments";

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
  const [documents, setDocuments] = useState<DecisionDocument[]>([]);
  const [result, setResult] = useState<DecisionResponse>();
  const [processing, setProcessing] = useState(false);
  const [readingAttachments, setReadingAttachments] = useState(false);
  const [errors, setErrors] = useState<{ id: string; message: string }[]>([]);
  const [attachmentWarnings, setAttachmentWarnings] = useState<{ id: string; message: string }[]>([]);
  const busy = useRef(false);
  const reading = useRef(false);
  const revision = useRef(0);
  const mounted = useRef(true);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; abort.current?.abort(); }; }, []);
  const addError = useCallback((message: string) => { if (mounted.current) setErrors(current => [...current, { id: crypto.randomUUID(), message }]); }, []);
  const dismissError = useCallback((id: string) => setErrors(current => current.filter(e => e.id !== id)), []);
  const dismissAttachmentWarning = useCallback((id: string) => setAttachmentWarnings(current => current.filter(w => w.id !== id)), []);
  const invalidate = useCallback(() => { revision.current++; setResult(undefined); }, []);
  const setSelectedModel = useCallback((value: string) => { invalidate(); setModel(value); }, [invalidate]);
  const setPrompt = useCallback((value: string) => { invalidate(); setPromptState(value); }, [invalidate]);
  const setQuestions = useCallback((value: DecisionQuestion[]) => { invalidate(); setQuestionsState(structuredClone(value)); }, [invalidate]);
  useEffect(() => { if (queryModel) setSelectedModel(queryModel); }, [queryModel, setSelectedModel]);
  const input = useMemo(() => composeDecisionInput(prompt, images, documents), [prompt, images, documents]);
  const modelValid = !!models?.some(m => m.id === selectedModel && m.type === "decision" && m.route !== "direct");
  const gatewayAvailable = !!config.baseUrl && config.gatewayEnabled !== false;
  const canSend = gatewayAvailable && modelValid && !processing && !readingAttachments && isValidDecisionInput(input)
    && isValidDecisionQuestions(questions);

  const addAttachments = useCallback(async (files: File[]) => {
    if (!files.length || busy.current || reading.current) return;
    reading.current = true; setReadingAttachments(true);
    try {
      const added = await prepareDecisionAttachments(files, images.length);
      if (mounted.current) {
        if (added.images.length || added.documents.length) {
          invalidate();
          setImages(current => [...current, ...added.images]);
          setDocuments(current => [...current, ...added.documents]);
        }
        setAttachmentWarnings(current => [...current, ...added.failures.map(failure => ({
          id: crypto.randomUUID(), message: t(`decisionsPage.attachments.${failure.reason}`, { name: failure.name }),
        }))]);
      }
    } finally { reading.current = false; if (mounted.current) setReadingAttachments(false); }
  }, [images.length, invalidate, t]);
  const removeImage = useCallback((id: string) => {
    if (busy.current || reading.current) return;
    invalidate(); setImages(current => current.filter(image => image.id !== id));
  }, [invalidate]);
  const removeDocument = useCallback((id: string) => {
    if (busy.current || reading.current) return;
    invalidate(); setDocuments(current => current.filter(document => document.id !== id));
  }, [invalidate]);

  const onSend = useCallback(async () => {
    if (!canSend || busy.current || reading.current) return;
    busy.current = true; setProcessing(true); setResult(undefined);
    const request = structuredClone({ model: selectedModel, input, questions });
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
        questions: toWireQuestions(request.questions), abortSignal: controller.signal });
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
  }, [canSend, selectedModel, input, questions, config, customHeaders, store, addError, storageError, t]);
  return { models, selectedModel, setSelectedModel, prompt, setPrompt, questions, setQuestions, images, documents,
    addAttachments, removeImage, removeDocument, result, processing, readingAttachments, canSend, gatewayAvailable,
    errors, addError, dismissError, attachmentWarnings, dismissAttachmentWarning, onSend };
}
