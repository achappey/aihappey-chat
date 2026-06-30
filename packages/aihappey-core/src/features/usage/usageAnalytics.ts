import type { Conversation, UIMessage } from "aihappey-types/src/chat";

type ModelOptionLike = {
  id?: string;
  name?: string;
  type?: string;
  owned_by?: string;
};

type ProviderLike = {
  name?: string;
};

export type UsageCount = {
  key: string;
  label: string;
  count: number;
};

export type UsageNumberCount = UsageCount & {
  value: number;
};

export type UsageTokenTotals = {
  input: number;
  output: number;
  total: number;
  messagesWithUsage: number;
};

export type UsageModelStat = {
  key: string;
  label: string;
  providerKey: string;
  providerLabel: string;
  modelId: string;
  count: number;
  tokens: number;
  cost: number;
  legacy: boolean;
  unknownProvider: boolean;
};

export type UsageProviderStat = {
  key: string;
  label: string;
  count: number;
  models: Set<string>;
  tokens: number;
  cost: number;
  legacyMessages: number;
  unknownMessages: number;
};

export type UsageToolStat = {
  key: string;
  label: string;
  count: number;
  success: number;
  error: number;
  pending: number;
  resultTypes: Map<string, number>;
};

export type UsageMessageFact = {
  conversationId: string;
  conversationName: string;
  messageId: string;
  role: string;
  timestamp?: string;
  day?: string;
  hour?: number;
  modelKey?: string;
  modelLabel?: string;
  providerKey?: string;
  providerLabel?: string;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  textChars: number;
  partCount: number;
  toolCount: number;
  legacyModel: boolean;
  unknownProvider: boolean;
};

export type UsageConversationFact = {
  id: string;
  name: string;
  messageCount: number;
  partCount: number;
  textChars: number;
  tokens: number;
  cost: number;
  firstTimestamp?: string;
  lastTimestamp?: string;
};

export type UsageAnalytics = {
  conversations: number;
  messages: number;
  parts: number;
  textChars: number;
  roleCounts: Map<string, number>;
  modelStats: Map<string, UsageModelStat>;
  providerStats: Map<string, UsageProviderStat>;
  tokenTotals: UsageTokenTotals;
  totalCost: number;
  toolStats: Map<string, UsageToolStat>;
  toolStateCounts: Map<string, number>;
  toolResultTypeCounts: Map<string, number>;
  contentTypeCounts: Map<string, number>;
  attachmentTypeCounts: Map<string, number>;
  sourceTypeCounts: Map<string, number>;
  dailyMessages: Map<string, number>;
  dailyTokens: Map<string, number>;
  dailyCost: Map<string, number>;
  hourCounts: Map<string, number>;
  weekdayHourCounts: Map<string, number>;
  temperatureCounts: Map<string, number>;
  finishReasonCounts: Map<string, number>;
  errorCounts: Map<string, number>;
  legacyModelMessages: number;
  unknownProviderMessages: number;
  messagesWithModel: number;
  messagesWithCost: number;
  messagesWithTools: number;
  messagesWithSources: number;
  messagesWithReasoning: number;
  messagesWithDataParts: number;
  messagesWithStructuredOutput: number;
  messageFacts: UsageMessageFact[];
  conversationFacts: UsageConversationFact[];
};

const UNKNOWN_PROVIDER = "unknown";
const LEGACY_PROVIDER = "legacy";

const asArray = <T,>(value: T[] | undefined | null): T[] =>
  Array.isArray(value) ? value : [];

const asObject = (value: unknown): Record<string, any> =>
  value && typeof value === "object" ? (value as Record<string, any>) : {};

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const addToMap = (map: Map<string, number>, key: string | undefined, delta = 1) => {
  const safeKey = key && key.trim() ? key.trim() : "unknown";
  map.set(safeKey, (map.get(safeKey) ?? 0) + delta);
};

const maxDate = (a?: string, b?: string) => {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
};

const minDate = (a?: string, b?: string) => {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) <= Date.parse(b) ? a : b;
};

const safeDate = (value: unknown): Date | undefined => {
  const raw = toStringValue(value);
  if (!raw) return undefined;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? new Date(parsed) : undefined;
};

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

const findStringByKeys = (
  value: unknown,
  keys: string[],
  maxDepth = 4,
  seen = new Set<unknown>()
): string | undefined => {
  if (maxDepth < 0 || !value || typeof value !== "object" || seen.has(value)) return undefined;
  seen.add(value);
  const obj = value as Record<string, any>;

  for (const key of keys) {
    const direct = toStringValue(obj[key]);
    if (direct) return direct;
  }

  for (const child of Object.values(obj)) {
    const found = findStringByKeys(child, keys, maxDepth - 1, seen);
    if (found) return found;
  }

  return undefined;
};

const getNestedNumber = (obj: Record<string, any>, paths: string[]) => {
  for (const path of paths) {
    const value = path.split(".").reduce<any>((acc, segment) => acc?.[segment], obj);
    const numberValue = toNumber(value);
    if (numberValue !== undefined) return numberValue;
  }
  return undefined;
};

const getUsageNumbers = (metadata: Record<string, any>) => {
  const usage = asObject(metadata.usage);
  const gatewayUsage = asObject(metadata.gateway?.usage);
  const responseUsage = asObject(metadata.response?.usage);
  const merged = { ...responseUsage, ...gatewayUsage, ...usage };

  const input = getNestedNumber(merged, [
    "inputTokens",
    "promptTokens",
    "prompt_tokens",
    "input_tokens",
    "tokens.input",
    "tokens.prompt",
  ]) ?? 0;

  const output = getNestedNumber(merged, [
    "outputTokens",
    "completionTokens",
    "completion_tokens",
    "output_tokens",
    "tokens.output",
    "tokens.completion",
  ]) ?? 0;

  const explicitTotal =
    toNumber(metadata.totalTokens) ??
    getNestedNumber(merged, ["totalTokens", "total_tokens", "tokens.total"]);
  const total = explicitTotal ?? input + output;

  return {
    input,
    output,
    total,
    hasUsage: explicitTotal !== undefined || input > 0 || output > 0,
  };
};

const getCost = (metadata: Record<string, any>) =>
  toNumber(metadata.providerMetadata?.gateway?.cost) ??
  toNumber(metadata.gateway?.cost) ??
  toNumber(metadata.cost) ??
  toNumber(metadata.response?.cost) ??
  0;

const normalizeProviderLabel = (
  providerKey: string,
  providers: Record<string, ProviderLike>
) => {
  if (providerKey === UNKNOWN_PROVIDER) return "Unknown provider";
  if (providerKey === LEGACY_PROVIDER) return "Legacy / inferred";
  return providers[providerKey]?.name ?? providerKey;
};

const buildKnownModelIndex = (models: ModelOptionLike[]) => {
  const byFullId = new Map<string, ModelOptionLike>();
  const byBareId = new Map<string, ModelOptionLike[]>();
  for (const model of models) {
    const id = toStringValue(model.id)?.toLowerCase();
    if (!id) continue;
    byFullId.set(id, model);
    const bare = id.includes("/") ? id.split("/").slice(1).join("/") : id;
    byBareId.set(bare, [...(byBareId.get(bare) ?? []), model]);
  }
  return { byFullId, byBareId };
};

const normalizeModelReference = ({
  rawModel,
  rawProvider,
  models,
  providers,
}: {
  rawModel?: string;
  rawProvider?: string;
  models: ReturnType<typeof buildKnownModelIndex>;
  providers: Record<string, ProviderLike>;
}) => {
  const providerInput = rawProvider?.trim().toLowerCase();
  const modelInput = rawModel?.trim();

  if (!modelInput) {
    const providerKey = providerInput || UNKNOWN_PROVIDER;
    return {
      key: providerKey === UNKNOWN_PROVIDER ? undefined : `${providerKey}/unknown-model`,
      label: providerKey === UNKNOWN_PROVIDER ? undefined : `${providerKey}/unknown-model`,
      providerKey,
      providerLabel: normalizeProviderLabel(providerKey, providers),
      modelId: "unknown-model",
      legacy: false,
      unknownProvider: providerKey === UNKNOWN_PROVIDER,
    };
  }

  const lower = modelInput.toLowerCase();
  const fullMatch = models.byFullId.get(lower);
  if (modelInput.includes("/")) {
    const providerKey = modelInput.split("/")[0]?.toLowerCase() || providerInput || UNKNOWN_PROVIDER;
    const modelId = modelInput.split("/").slice(1).join("/") || modelInput;
    return {
      key: fullMatch?.id ?? modelInput,
      label: fullMatch?.id ?? modelInput,
      providerKey,
      providerLabel: normalizeProviderLabel(providerKey, providers),
      modelId,
      legacy: false,
      unknownProvider: providerKey === UNKNOWN_PROVIDER,
    };
  }

  const bareMatches = models.byBareId.get(lower) ?? [];
  if (bareMatches.length === 1 && bareMatches[0]?.id?.includes("/")) {
    const fullId = bareMatches[0].id!;
    const providerKey = fullId.split("/")[0]?.toLowerCase() || providerInput || LEGACY_PROVIDER;
    return {
      key: fullId,
      label: `${modelInput} (${normalizeProviderLabel(providerKey, providers)})`,
      providerKey,
      providerLabel: normalizeProviderLabel(providerKey, providers),
      modelId: modelInput,
      legacy: true,
      unknownProvider: false,
    };
  }

  const providerKey = providerInput || LEGACY_PROVIDER;
  return {
    key: `${providerKey}/${modelInput}`,
    label: providerKey === LEGACY_PROVIDER ? `${modelInput} (legacy)` : `${providerKey}/${modelInput}`,
    providerKey,
    providerLabel: normalizeProviderLabel(providerKey, providers),
    modelId: modelInput,
    legacy: true,
    unknownProvider: providerKey === LEGACY_PROVIDER || providerKey === UNKNOWN_PROVIDER,
  };
};

const extractModelId = (message: UIMessage, conversation: Conversation) => {
  const metadata = asObject(message.metadata);
  return (
    toStringValue(metadata.model) ??
    toStringValue(metadata.modelId) ??
    toStringValue(metadata.selectedModel) ??
    toStringValue(metadata.gateway?.model) ??
    toStringValue(metadata.request?.model) ??
    toStringValue(metadata.response?.model) ??
    toStringValue(metadata.body?.model) ??
    toStringValue(conversation.metadata?.model) ??
    findStringByKeys(metadata, ["modelId", "selectedModel", "model"], 3)
  );
};

const extractProviderId = (message: UIMessage) => {
  const metadata = asObject(message.metadata);
  return (
    toStringValue(metadata.providerId) ??
    toStringValue(metadata.providerKey) ??
    toStringValue(metadata.provider) ??
    toStringValue(metadata.gateway?.provider) ??
    toStringValue(metadata.request?.provider) ??
    toStringValue(metadata.response?.provider) ??
    findStringByKeys(metadata, ["providerId", "providerKey", "provider"], 3)
  );
};

const contentTypeForPart = (part: any) => {
  const type = String(part?.type ?? "unknown");
  if (type.startsWith("tool-")) return "tool";
  if (type.startsWith("data-")) return "data";
  if (type === "source-url" || type === "source-document") return "source";
  return type;
};

const attachmentBucket = (part: any) => {
  const mediaType = String(part?.mediaType ?? part?.mimeType ?? "").toLowerCase();
  if (mediaType.startsWith("image/")) return "image";
  if (mediaType.startsWith("audio/")) return "audio";
  if (mediaType.startsWith("video/")) return "video";
  if (mediaType.includes("pdf")) return "pdf";
  if (mediaType.includes("json")) return "json";
  return "file";
};

const toolNameForPart = (part: any) => {
  const type = String(part?.type ?? "");
  return toStringValue(part?.toolName) ?? (type.replace(/^tool-/, "") || "unknown-tool");
};

const toolStateForPart = (part: any) => {
  const state = String(part?.state ?? "").toLowerCase();
  if (part?.error || part?.output?.isError || state.includes("error")) return "error";
  if (state.includes("output") || state.includes("result") || part?.output !== undefined) return "success";
  return "pending";
};

const collectToolResultTypes = (part: any) => {
  const resultTypes: string[] = [];
  const output = part?.output;
  if (output?.structuredContent !== undefined) resultTypes.push("structuredContent");
  if (Array.isArray(output?.content)) {
    for (const item of output.content) {
      resultTypes.push(String(item?.type ?? "content"));
    }
  }
  if (resultTypes.length === 0 && output !== undefined) resultTypes.push(typeof output);
  if (resultTypes.length === 0) resultTypes.push("none");
  return resultTypes;
};

const textLengthForPart = (part: any) => {
  if (part?.type === "text") return String(part?.text ?? "").length;
  if (part?.type === "reasoning") return String(part?.text ?? part?.reasoning ?? "").length;
  return 0;
};

const emptyAnalytics = (): UsageAnalytics => ({
  conversations: 0,
  messages: 0,
  parts: 0,
  textChars: 0,
  roleCounts: new Map(),
  modelStats: new Map(),
  providerStats: new Map(),
  tokenTotals: { input: 0, output: 0, total: 0, messagesWithUsage: 0 },
  totalCost: 0,
  toolStats: new Map(),
  toolStateCounts: new Map(),
  toolResultTypeCounts: new Map(),
  contentTypeCounts: new Map(),
  attachmentTypeCounts: new Map(),
  sourceTypeCounts: new Map(),
  dailyMessages: new Map(),
  dailyTokens: new Map(),
  dailyCost: new Map(),
  hourCounts: new Map(),
  weekdayHourCounts: new Map(),
  temperatureCounts: new Map(),
  finishReasonCounts: new Map(),
  errorCounts: new Map(),
  legacyModelMessages: 0,
  unknownProviderMessages: 0,
  messagesWithModel: 0,
  messagesWithCost: 0,
  messagesWithTools: 0,
  messagesWithSources: 0,
  messagesWithReasoning: 0,
  messagesWithDataParts: 0,
  messagesWithStructuredOutput: 0,
  messageFacts: [],
  conversationFacts: [],
});

export const buildUsageAnalytics = ({
  conversations,
  models = [],
  providers = {},
}: {
  conversations: Conversation[];
  models?: ModelOptionLike[];
  providers?: Record<string, ProviderLike>;
}): UsageAnalytics => {
  const analytics = emptyAnalytics();
  const modelIndex = buildKnownModelIndex(models);
  analytics.conversations = conversations.length;

  for (const conversation of conversations) {
    const messages = asArray(conversation.messages);
    const conversationName = String(conversation.metadata?.name ?? "New chat");
    const conversationFact: UsageConversationFact = {
      id: conversation.id,
      name: conversationName,
      messageCount: messages.length,
      partCount: 0,
      textChars: 0,
      tokens: 0,
      cost: 0,
    };

    for (const message of messages) {
      const metadata = asObject(message.metadata);
      const parts = asArray<any>(message.parts);
      const timestamp = safeDate(metadata.timestamp ?? metadata.createdAt ?? metadata.updatedAt);
      const timestampIso = timestamp?.toISOString();
      const day = timestamp ? dayKey(timestamp) : undefined;
      const hour = timestamp ? timestamp.getHours() : undefined;
      const role = String(message.role ?? "unknown");
      const rawModel = extractModelId(message, conversation);
      const rawProvider = extractProviderId(message);
      const modelRef = normalizeModelReference({
        rawModel,
        rawProvider,
        models: modelIndex,
        providers,
      });
      const tokens = getUsageNumbers(metadata);
      const cost = getCost(metadata);
      let messageTextChars = 0;
      let messageToolCount = 0;
      let hasSources = false;
      let hasReasoning = false;
      let hasDataParts = false;
      let hasStructuredOutput = false;

      analytics.messages += 1;
      analytics.parts += parts.length;
      addToMap(analytics.roleCounts, role);

      if (day) {
        addToMap(analytics.dailyMessages, day);
        addToMap(analytics.dailyTokens, day, tokens.total);
        addToMap(analytics.dailyCost, day, cost);
      }
      if (hour !== undefined) {
        addToMap(analytics.hourCounts, String(hour).padStart(2, "0"));
        addToMap(analytics.weekdayHourCounts, `${timestamp!.getDay()}-${hour}`);
      }

      if (timestampIso) {
        conversationFact.firstTimestamp = minDate(conversationFact.firstTimestamp, timestampIso);
        conversationFact.lastTimestamp = maxDate(conversationFact.lastTimestamp, timestampIso);
      }

      if (tokens.hasUsage) {
        analytics.tokenTotals.messagesWithUsage += 1;
        analytics.tokenTotals.input += tokens.input;
        analytics.tokenTotals.output += tokens.output;
        analytics.tokenTotals.total += tokens.total;
      }
      if (cost > 0) analytics.messagesWithCost += 1;

      analytics.totalCost += cost;
      conversationFact.tokens += tokens.total;
      conversationFact.cost += cost;

      if (modelRef.key) {
        analytics.messagesWithModel += 1;
        const modelStat = analytics.modelStats.get(modelRef.key) ?? {
          key: modelRef.key,
          label: modelRef.label ?? modelRef.key,
          providerKey: modelRef.providerKey,
          providerLabel: modelRef.providerLabel,
          modelId: modelRef.modelId,
          count: 0,
          tokens: 0,
          cost: 0,
          legacy: modelRef.legacy,
          unknownProvider: modelRef.unknownProvider,
        };
        modelStat.count += 1;
        modelStat.tokens += tokens.total;
        modelStat.cost += cost;
        modelStat.legacy = modelStat.legacy || modelRef.legacy;
        modelStat.unknownProvider = modelStat.unknownProvider || modelRef.unknownProvider;
        analytics.modelStats.set(modelRef.key, modelStat);
      }

      const providerStat = analytics.providerStats.get(modelRef.providerKey) ?? {
        key: modelRef.providerKey,
        label: modelRef.providerLabel,
        count: 0,
        models: new Set<string>(),
        tokens: 0,
        cost: 0,
        legacyMessages: 0,
        unknownMessages: 0,
      };
      providerStat.count += 1;
      if (modelRef.key) providerStat.models.add(modelRef.key);
      providerStat.tokens += tokens.total;
      providerStat.cost += cost;
      if (modelRef.legacy) providerStat.legacyMessages += 1;
      if (modelRef.unknownProvider) providerStat.unknownMessages += 1;
      analytics.providerStats.set(modelRef.providerKey, providerStat);

      if (modelRef.legacy) analytics.legacyModelMessages += 1;
      if (modelRef.unknownProvider) analytics.unknownProviderMessages += 1;

      const temperature = toNumber(metadata.temperature);
      if (temperature !== undefined) addToMap(analytics.temperatureCounts, temperature.toFixed(1));
      const finishReason = toStringValue(metadata.finishReason ?? metadata.finish_reason ?? metadata.response?.finishReason);
      if (finishReason) addToMap(analytics.finishReasonCounts, finishReason);
      const error = toStringValue(metadata.error?.message ?? metadata.error ?? metadata.gateway?.error);
      if (error) addToMap(analytics.errorCounts, error.slice(0, 80));

      for (const part of parts) {
        const partType = String(part?.type ?? "unknown");
        const bucket = contentTypeForPart(part);
        addToMap(analytics.contentTypeCounts, bucket);
        conversationFact.partCount += 1;

        const textChars = textLengthForPart(part);
        messageTextChars += textChars;
        analytics.textChars += textChars;
        conversationFact.textChars += textChars;

        if (partType === "file") addToMap(analytics.attachmentTypeCounts, attachmentBucket(part));
        if (partType === "source-url" || partType === "source-document") {
          hasSources = true;
          addToMap(analytics.sourceTypeCounts, partType === "source-url" ? "url" : "document");
        }
        if (partType === "reasoning") hasReasoning = true;
        if (partType.startsWith("data-")) hasDataParts = true;
        if (partType.startsWith("data-") && (part?.data !== undefined || part?.output !== undefined)) {
          hasStructuredOutput = true;
        }

        if (partType.startsWith("tool-")) {
          messageToolCount += 1;
          const toolName = toolNameForPart(part);
          const state = toolStateForPart(part);
          addToMap(analytics.toolStateCounts, state);
          const toolStat = analytics.toolStats.get(toolName) ?? {
            key: toolName,
            label: toolName,
            count: 0,
            success: 0,
            error: 0,
            pending: 0,
            resultTypes: new Map(),
          };
          toolStat.count += 1;
          if (state === "success") toolStat.success += 1;
          if (state === "error") toolStat.error += 1;
          if (state === "pending") toolStat.pending += 1;
          for (const resultType of collectToolResultTypes(part)) {
            addToMap(toolStat.resultTypes, resultType);
            addToMap(analytics.toolResultTypeCounts, resultType);
          }
          analytics.toolStats.set(toolName, toolStat);
        }
      }

      if (messageToolCount > 0) analytics.messagesWithTools += 1;
      if (hasSources) analytics.messagesWithSources += 1;
      if (hasReasoning) analytics.messagesWithReasoning += 1;
      if (hasDataParts) analytics.messagesWithDataParts += 1;
      if (hasStructuredOutput) analytics.messagesWithStructuredOutput += 1;

      analytics.messageFacts.push({
        conversationId: conversation.id,
        conversationName,
        messageId: message.id,
        role,
        timestamp: timestampIso,
        day,
        hour,
        modelKey: modelRef.key,
        modelLabel: modelRef.label,
        providerKey: modelRef.providerKey,
        providerLabel: modelRef.providerLabel,
        tokens: tokens.total,
        inputTokens: tokens.input,
        outputTokens: tokens.output,
        cost,
        textChars: messageTextChars,
        partCount: parts.length,
        toolCount: messageToolCount,
        legacyModel: modelRef.legacy,
        unknownProvider: modelRef.unknownProvider,
      });
    }

    analytics.conversationFacts.push(conversationFact);
  }

  return analytics;
};

export const topCounts = (map: Map<string, number>, limit = 12): UsageCount[] =>
  Array.from(map.entries())
    .map(([key, count]) => ({ key, label: key, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);

export const topModelStats = (map: Map<string, UsageModelStat>, limit = 12) =>
  Array.from(map.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);

export const topProviderStats = (map: Map<string, UsageProviderStat>, limit = 12) =>
  Array.from(map.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);

export const topToolStats = (map: Map<string, UsageToolStat>, limit = 12) =>
  Array.from(map.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);

export const sortedMapEntries = (map: Map<string, number>) =>
  Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));

