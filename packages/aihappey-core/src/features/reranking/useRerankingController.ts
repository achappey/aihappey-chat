import { useCallback, useEffect, useMemo, useState } from "react";
import { createRerankProvider } from "aihappey-ai";
import { useAppStore } from "aihappey-state";

import { fileAttachmentRuntime } from "../../runtime/files/fileAttachmentRuntime";
import { useChatContext } from "../chat/context/ChatContext";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";

import { getRerankingErrorMessage } from "./rerankingErrors";
import { extractTextFromFileOrZip } from "./rerankingFileText";
import type { LocalDoc, RerankingResponse } from "./rerankingTypes";
import { useRerankingErrors } from "./useRerankingErrors";

const genId = (n: number) => `${Date.now()}-${Math.random().toString(16).slice(2)}-${n}`;

export function useRerankingController() {
  const models = useAppStore((a) => a.models);
  const customHeaders = useAppStore((a) => a.customHeaders);
  const providerRerankingMetadata = useAppStore((a) => a.providerRerankingMetadata);
  const topN = useAppStore((a) => a.topN);
  const { config } = useChatContext();
  const getAccessToken = config?.getAccessToken;
  const headers = config?.headers;

  const [prompt, setPrompt] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [docs, setDocs] = useState<LocalDoc[]>([]);

  const {
    errors,
    warnings,
    conversionWarnings,
    addError,
    addWarnings,
    addConversionWarning,
    clearWarnings,
    dismissError,
    dismissWarning,
    dismissConversionWarning,
  } = useRerankingErrors();

  const baseUrl = config.baseUrl + config.endpoints.reranking;
  const defaultModel = getAccessToken ? "cohere/rerank-v4.0-fast" : "";
  const [selectedModel, setSelectedModel] = useState<string>(defaultModel);

  // Safety: ensure this page never uses the shared attachment runtime.
  useEffect(() => {
    fileAttachmentRuntime.clear();
  }, []);

  const canSend = useMemo(() => {
    return !processing && prompt.trim().length > 0 && docs.length > 1;
  }, [processing, prompt, docs.length]);

  const addFilesToLocalState = useCallback(async (files: File[]) => {
    if (!files.length) return;

    const extracted: { fileName: string; text: string; file: File }[] = [];
    const failedFileNames: string[] = [];
    for (const f of files) {
      try {
        const res = await extractTextFromFileOrZip(f);
        extracted.push(...res.extracted);
        failedFileNames.push(...res.failedFileNames);
      } catch {
        // collect failures per requirement
        failedFileNames.push(f.name);
      }
    }

    if (failedFileNames.length) {
      const unique = Array.from(new Set(failedFileNames));
      addConversionWarning(`Some files could not be converted to text: ${unique.join(", ")}`);
    }

    if (!extracted.length) {
      return;
    }

    setDocs((prev) => {
      const startIndex = prev.length;
      const next: LocalDoc[] = extracted.map((e, i) => ({
        id: genId(startIndex + i),
        fileName: e.fileName,
        text: e.text,
        file: e.file,
        index: startIndex + i,
      }));
      return [...prev, ...next];
    });
  }, [addConversionWarning]);

  const clearDocs = useCallback(() => {
    setDocs([]);
  }, []);

  const addAttachment = useCallback(
    async (file: File) => {
      // IMPORTANT: do not call fileAttachmentRuntime.add(file)
      await addFilesToLocalState([file]);
    },
    [addFilesToLocalState]
  );

  const addAttachments = useCallback(
    async (files: File[]) => {
      // IMPORTANT: do not call fileAttachmentRuntime.add(file)
      await addFilesToLocalState(files);
    },
    [addFilesToLocalState]
  );

  const { isOver, dropRef, handleDrop, handleDragOver } = useChatFileDrop(addAttachment, addAttachments);

  const onSend = useCallback(async () => {
    if (!canSend) return;
    setProcessing(true);
    clearWarnings();
    try {
      let merged = { ...(headers ?? {}), ...(customHeaders ?? {}) } as any;
      if (getAccessToken) {
        try {
          merged.Authorization = `Bearer ${await getAccessToken()}`;
        } catch {
          // ignore
        }
      }

      const provider = createRerankProvider({ baseUrl, headers: merged });
      const model = provider.rerankingModel(selectedModel);

      const result = (await model.doRerank({
        query: prompt,
        documents: {
          type: "text",
          values: docs.map((d) => d.text),
        },
        topN: topN,
        providerOptions: providerRerankingMetadata,
      })) as RerankingResponse;

      // Surface provider warnings using the shared warning UI.
      addWarnings(result?.warnings as any);

      // Backend returns rankings per original index; higher score should rank earlier.
      const ranked = (result?.ranking ?? []).slice().sort((a, b) => b.relevanceScore - a.relevanceScore);
      const scoreByIndex = new Map(ranked.map((r) => [r.index, r.relevanceScore]));
      const rankByIndex = new Map(ranked.map((r, i) => [r.index, i + 1]));

      setDocs((prev) =>
        prev
          .map((d) => ({
            ...d,
            rank: rankByIndex.get(d.index),
            relevanceScore: scoreByIndex.get(d.index),
          }))
          .slice()
          .sort((a, b) => {
            const ra = a.rank;
            const rb = b.rank;
            if (ra == null && rb == null) return a.index - b.index;
            if (ra == null) return 1;
            if (rb == null) return -1;
            return ra - rb;
          })
      );
    } catch (err) {
      addError(getRerankingErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  }, [
    addError,
    addWarnings,
    baseUrl,
    canSend,
    clearWarnings,
    customHeaders,
    docs,
    getAccessToken,
    headers,
    prompt,
    providerRerankingMetadata,
    selectedModel,
    topN,
  ]);

  return {
    // UI dependencies
    models,

    // view state
    prompt,
    setPrompt,
    processing,
    canSend,
    docs,

    // errors / warnings
    errors,
    warnings,
    conversionWarnings,
    dismissError,
    dismissWarning,
    dismissConversionWarning,

    // configuration
    selectedModel,
    setSelectedModel,

    // actions
    onSend,
    addFilesToLocalState,
    clearDocs,

    // drag/drop
    isOver,
    dropRef,
    handleDrop,
    handleDragOver,
  };
}

