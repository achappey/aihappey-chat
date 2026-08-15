import React, { useCallback, useState } from "react";
import { createResponsesProvider } from "aihappey-ai";
import type { ResponseApiCreateRequest, ResponseApiInputContent } from "aihappey-ai";
import { AgentFavoriteToggleButton, JobCard, ErrorAlerts, useTheme, WarningAlerts } from "aihappey-components";
import { useJobs } from "aihappey-jobs";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { useChatContext } from "../chat/context/ChatContext";
import { AgentSelect } from "../agents/AgentSelect";
import { buildSelectedAgentRequest, normalizeSelectedAgentKeys, resolveSelectedAgentEntries } from "../agents/agentSelection";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";
import { UserMenuInline } from "../user-settings/UserMenuInline";
import { useStorageErrorMessage } from "../storage/storageErrorMessage";
import { Markdown } from "../../ui/markdown/Markdown";
import { JobsInput } from "./JobsInput";
import { useJobErrors } from "./useJobErrors";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const createFileContentPart = async (file: File): Promise<ResponseApiInputContent> => {
  const url = await fileToDataUrl(file);

  if (file.type.startsWith("image/")) {
    return { type: "input_image", image_url: url };
  }

  return {
    type: "input_file",
    file_data: url,
    filename: file.name,
  };
};

export const JobsPage = () => {
  const isDesktop = useIsDesktop();
  const { config } = useChatContext();
  const jobs = useJobs();
  const getStorageErrorMessage = useStorageErrorMessage();
  const { t } = useTranslation();
  const { Skeleton } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [itemsLoading, setItemsLoading] = useState(0);
  const [processing, setProcessing] = useState(false);
  const selectedAgentNames = useAppStore((s) => s.selectedAgentNames);
  const setSelectedAgents = useAppStore((s) => s.setSelectedAgents);
  const agents = useAppStore((s) => s.agents);
  const remoteAgentModels = useAppStore((s) => s.remoteAgentModels);
  const favoriteAgentIds = useAppStore((s) => s.favoriteAgentIds);
  const toggleFavoriteAgent = useAppStore((s) => s.toggleFavoriteAgent);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const normalizedAgentValues = normalizeSelectedAgentKeys(selectedAgentNames, agents ?? [], remoteAgentModels ?? []);
  const selectedAgentKey = normalizedAgentValues.length === 1 ? normalizedAgentValues[0] : undefined;
  const selectedAgentEntry = selectedAgentKey
    ? resolveSelectedAgentEntries([selectedAgentKey], agents ?? [], remoteAgentModels ?? [])[0]
    : undefined;
  const isSelectedAgentFavorite = !!selectedAgentKey && (favoriteAgentIds ?? []).includes(selectedAgentKey);
  const {
    errors,
    warnings,
    addError,
    addWarnings,
    dismissError,
    dismissWarning,
  } = useJobErrors();

  const addAttachments = useCallback((nextFiles: File[]) => {
    setFiles((prev) => [...prev, ...nextFiles]);
  }, []);

  const removeFile = useCallback((name: string) => {
    setFiles((prev) => prev.filter((file) => file.name !== name));
  }, []);

  const { isOver, dropRef: drop, handleDrop, handleDragOver } =
    useChatFileDrop((file) => addAttachments([file]), addAttachments);

  const dropRef = useCallback((node: HTMLDivElement | null) => {
    if (node) drop(node);
  }, [drop]);

  const createClient = async () => {
    const headers = { ...(config.headers ?? {}), ...(customHeaders ?? {}) };

    const getAccessToken = config.agentEndpoint
      ? (config.getAgentAccessToken ?? config.getAccessToken)
      : config.getAccessToken;

    if (getAccessToken) {
      headers.Authorization = `Bearer ${await getAccessToken()}`;
    }

    return createResponsesProvider({
      baseUrl: (config.agentEndpoint ?? config.baseUrl) + config.endpoints.responses,
      headers,
      fetch: config.fetch,
    });
  };

  const buildRequest = async (text: string): Promise<ResponseApiCreateRequest> => {
    const selectedAgentRequest = buildSelectedAgentRequest(
      selectedAgentNames,
      agents,
      remoteAgentModels,
    );
    const content: ResponseApiInputContent[] = [];

    if (text.trim()) content.push({ type: "input_text", text: text.trim() });
    content.push(...await Promise.all(files.map(createFileContentPart)));

    const metadata: Record<string, any> = {};
    if (selectedAgentRequest.localAgents.length > 0) {
      metadata.agents = selectedAgentRequest.localAgents;
    }

    const request: ResponseApiCreateRequest = {
      input: [
        {
          role: "user",
          content,
        },
      ],
      background: true,
      store: true,
      stream: false,
      ...(selectedAgentRequest.models.length === 1
        ? { model: selectedAgentRequest.models[0] }
        : selectedAgentRequest.models.length > 1
          ? { models: selectedAgentRequest.models }
          : {}),
      ...(Object.keys(metadata).length ? { metadata } : {}),
    };

    if (!request.model && !request.models?.length && !metadata.agents?.length) {
      throw new Error(t("selectAgentForJob", "Select at least one agent for the job."));
    }

    return request;
  };

  const sendJob = async (text: string) => {
    setProcessing(true);
    setItemsLoading(1);
    try {
      const request = await buildRequest(text);
      const client = await createClient();
      const response = await client.create(request);
      await jobs.add(request, response, text || files.map((file) => file.name).join(", "));
      jobs.refresh();
      setFiles([]);
    } catch (err) {
      addError(getStorageErrorMessage(err, "Job request failed"));
      addWarnings((err as any)?.warnings);
    } finally {
      setProcessing(false);
      setItemsLoading(0);
    }
  };

  const refreshJob = async (jobId: string, responseId?: string) => {
    if (!responseId) return;
    try {
      const client = await createClient();
      const response = await client.retrieve(responseId);
      await jobs.update(jobId, response);
    } catch (err) {
      addError(getStorageErrorMessage(err, "Refresh failed"));
    }
  };

  const deleteJob = async (jobId: string, responseId?: string) => {
    try {
      if (responseId) {
        const client = await createClient();
        await client.delete(responseId);
      }
      await jobs.delete(jobId);
    } catch (err) {
      addError(getStorageErrorMessage(err, "Delete failed"));
    }
  };

  return (
    <div style={{
      background: "transparent",
      width: "100%",
      paddingLeft: isDesktop ? 0 : 12,
      paddingRight: isDesktop ? 0 : 12,
      boxSizing: "border-box",
    }}>
      <div style={{
        paddingLeft: isDesktop ? 12 : 0,
        paddingRight: isDesktop ? 12 : 0,
        display: "flex",
        alignItems: "center",
      }}>
        <AgentSelect
          localAgents={agents ?? []}
          remoteAgentModels={remoteAgentModels ?? []}
          values={selectedAgentNames ?? []}
          onChange={(name) => selectedAgentNames.includes(name)
            ? setSelectedAgents(selectedAgentNames.filter((a) => a !== name))
            : setSelectedAgents([...selectedAgentNames, name])}
          favoriteAgentIds={favoriteAgentIds ?? []}
          favoritesLabel={t("favorites")}
        />
        <div style={{ paddingLeft: 8 }}>
          <AgentFavoriteToggleButton
            variant="subtle"
            size="small"
            isFavorite={isSelectedAgentFavorite}
            agentName={selectedAgentEntry?.label}
            onToggleFavorite={() => selectedAgentKey && toggleFavoriteAgent(selectedAgentKey)}
            disabled={!selectedAgentKey}
          />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ paddingLeft: 16 }}>
          <UserMenuInline />
        </div>
      </div>

      <ErrorAlerts errors={errors} dismissError={dismissError} />
      <WarningAlerts warnings={warnings} dismissWarning={dismissWarning} />

      <div
        style={{ marginTop: 44, border: isOver ? "2px dotted" : undefined, borderColor: isOver ? "#888" : "transparent" }}
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <JobsInput
          value={prompt}
          onChange={setPrompt}
          onSend={sendJob}
          files={files}
          onFilesSelected={addAttachments}
          onRemoveFile={removeFile}
          disabled={processing}
        />
      </div>

      <div style={{
        maxWidth: 1056,
        margin: "0 auto",
        padding: isDesktop ? "0 12px" : 0,
        boxSizing: "border-box",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isDesktop ? "repeat(2, minmax(0, 1fr))" : "1fr",
          gap: 16,
          alignItems: "stretch",
        }}>
          {Array.from({ length: itemsLoading }).map((_, i) => (
            <div key={`shimmer-${i}`} style={cellStyle}>
              <Skeleton style={{ width: "100%", height: "100%" }} />
            </div>
          ))}

          {jobs.items.map((item) => (
            <JobCard
              key={item.id}
              job={item}
              onRefresh={() => void refreshJob(item.id, item.responseId)}
              onDelete={() => void deleteJob(item.id, item.responseId)}
              renderMarkdown={(text) => <Markdown text={text} />}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const cellStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  position: "relative",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: 99,
};

