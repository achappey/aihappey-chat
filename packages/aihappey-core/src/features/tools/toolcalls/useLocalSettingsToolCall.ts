import { useCallback } from "react";
import { useAppStore } from "aihappey-state";
import { languageNames, useTranslation } from "aihappey-i18n";
import type { Tool } from "@modelcontextprotocol/sdk/types";

/* ============================================================
   Result helpers
============================================================ */

type ToolTextResult = {
  isError: boolean;
  structuredContent?: any
  content: { type: "text"; text: string }[];
};

const ok = (text: string): ToolTextResult => ({
  isError: false,
  content: [{ type: "text", text }],
});

const structured = (content: any): ToolTextResult => ({
  isError: false,
  content: [],
  structuredContent: content,
});


const fail = (err: unknown): ToolTextResult => ({
  isError: true,
  content: [
    {
      type: "text",
      text: err instanceof Error ? err.message : String(err),
    },
  ],
});

/* ============================================================
   Tool definitions (STATIC)
============================================================ */

export const localSettingsGetTool: Tool = {
  name: "local_settings_get",
  title: "Get local settings",
  description:
    "Returns local user settings including chat display options, default models, language, and MCP timeout settings.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localSettingsSetTool: Tool = {
  name: "local_settings_set",
  title: "Update local settings",
  description:
    "Updates local user settings such as display toggles, default models, language, and MCP timeout configuration.",
  inputSchema: {
    type: "object",
    properties: {
      enableUserLocation: {
        type: "boolean",
        description: "Enable or disable access to the user's location.",
      },
      showTemperature: {
        type: "boolean",
        description: "Show or hide the temperature badge per assistant message.",
      },
      showTokensPerMessage: {
        type: "boolean",
        description: "Show or hide the tokens badge per assistant message.",
      },
      temperature: {
        type: "number",
        description: "AI temperature.",
      },
      userPreferredModel: {
        type: "string",
        description: "Default language model id.",
      },
      userPreferredImageModel: {
        type: "string",
        description: "Default image model id.",
      },
      userPreferredVideoModel: {
        type: "string",
        description: "Default video model id.",
      },
      userPreferredSpeechModel: {
        type: "string",
        description: "Default speech model id.",
      },
      userPreferredTranscriptionModel: {
        type: "string",
        description: "Default transcription model id.",
      },
      userPreferredRerankingModel: {
        type: "string",
        description: "Default reranking model id.",
      },
      language: {
        type: "string",
        description: "UI language code (for example: en, nl, de).",
      },
      throttle: {
        type: "number",
        description: "Custom throttle wait in ms for the chat messages and data updates.",
      },
      mcpToolTimeout: {
        type: "number",
        description: "Timeout (in milliseconds) applied to all MCP tool calls.",
      },
      mcpResetTimeoutOnProgress: {
        type: "boolean",
        description: "Whether the MCP tool timeout resets when progress events arrive.",
      },
    },
    required: [],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export const localSettingsGetLanguagesTool: Tool = {
  name: "local_settings_get_languages",
  title: "Get available languages",
  description:
    "Returns all available UI languages and the currently active language.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const attachmentsSettingsGetTool: Tool = {
  name: "attachments_settings_get",
  title: "Get attachment settings",
  description:
    "Returns local attachment settings such as conversion, raw upload, max size (MB), and EXIF extraction.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const attachmentsSettingsSetTool: Tool = {
  name: "attachments_settings_set",
  title: "Update attachment settings",
  description:
    "Updates local attachment settings including conversion, raw upload, max size in MB, and EXIF extraction.",
  inputSchema: {
    type: "object",
    properties: {
      convertAttachmentsToText: {
        type: "boolean",
        description: "Whether attachments should be converted to text when supported.",
      },
      sendRawAttachments: {
        type: "boolean",
        description: "Whether raw attachments should still be sent along with converted text.",
      },
      maxAttachmentsSizeMb: {
        type: "number",
        description: "Maximum attachment size in MB (clamped to 0..100).",
      },
      extractExif: {
        type: "boolean",
        description: "Whether image EXIF metadata extraction is enabled.",
      },
    },
    required: [],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};

/* ============================================================
   Plugin DEFINITION (STATIC)
============================================================ */

export const localSettingsPluginDef = {
  name: "local-settings",
  match: (toolName: string) =>
    toolName.startsWith("local_settings_") || toolName.startsWith("attachments_settings_"),
  tools: [
    localSettingsGetTool,
    localSettingsSetTool,
    localSettingsGetLanguagesTool,
    attachmentsSettingsGetTool,
    attachmentsSettingsSetTool,
  ],
};

/* ============================================================
   Runtime types
============================================================ */

type LocalSettingsToolName =
  | "local_settings_get"
  | "local_settings_set"
  | "local_settings_get_languages"
  | "attachments_settings_get"
  | "attachments_settings_set";

type LocalSettingsToolCall = {
  toolName: LocalSettingsToolName;
  input?: any;
};

/* ============================================================
   Plugin RUNTIME (execution only)
============================================================ */

export function useLocalSettingsRuntime() {
  const { i18n } = useTranslation();

  const enableUserLocation = useAppStore(a => a.enableUserLocation);
  const setEnableUserLocation = useAppStore(a => a.setEnableUserLocation);

  const showMessageTemperature = useAppStore(a => a.showMessageTemperature);
  const showMessageTokens = useAppStore(a => a.showMessageTokens);
  const setShowMessageTemperature = useAppStore(a => a.setShowMessageTemperature);
  const setShowMessageTokens = useAppStore(a => a.setShowMessageTokens);

  const experimentalThrottle = useAppStore(a => a.experimentalThrottle);
  const setThrottle = useAppStore(a => a.setThrottle);

  const temperature = useAppStore(a => a.temperature);
  const setTemperature = useAppStore(a => a.setTemperature);

  const userPreferredModel = useAppStore(a => a.userPreferredModel);
  const userPreferredImageModel = useAppStore(a => a.userPreferredImageModel);
  const userPreferredVideoModel = useAppStore(a => a.userPreferredVideoModel);
  const userPreferredSpeechModel = useAppStore(a => a.userPreferredSpeechModel);
  const userPreferredTranscriptionModel = useAppStore(a => a.userPreferredTranscriptionModel);
  const userPreferredRerankingModel = useAppStore(a => a.userPreferredRerankingModel);

  const setUserPreferredModel = useAppStore(a => a.setUserPreferredModel);
  const setUserPreferredImageModel = useAppStore(a => a.setUserPreferredImageModel);
  const setUserPreferredVideoModel = useAppStore(a => a.setUserPreferredVideoModel);
  const setUserPreferredSpeechModel = useAppStore(a => a.setUserPreferredSpeechModel);
  const setUserPreferredTranscriptionModel = useAppStore(a => a.setUserPreferredTranscriptionModel);
  const setUserPreferredRerankingModel = useAppStore(a => a.setUserPreferredRerankingModel);

  const toolTimeout = useAppStore(a => a.toolTimeout);
  const resetTimeoutOnProgress = useAppStore(a => a.resetTimeoutOnProgress);
  const setMcpTimeout = useAppStore(a => a.setMcpTimeout);

  const convertAttachmentsToText = useAppStore(a => a.convertAttachmentsToText);
  const sendRawAttachments = useAppStore(a => a.sendRawAttachments);
  const maxAttachmentsSize = useAppStore(a => a.maxAttachmentsSize);
  const extractExif = useAppStore(a => a.extractExif);

  const setConvertAttachmentsToText = useAppStore(a => a.setConvertAttachmentsToText);
  const setSendRawAttachments = useAppStore(a => a.setSendRawAttachments);
  const setMaxAttachmentsSize = useAppStore(a => a.setMaxAttachmentsSize);
  const setExtractExif = useAppStore(a => a.setExtractExif);

  const ONE_MB = 1024 * 1024;
  const clampMb = (value: number) => Math.min(100, Math.max(0, Math.round(value)));
  const bytesToMb = (bytes?: number) => {
    const safeBytes = typeof bytes === "number" && Number.isFinite(bytes) ? bytes : 25 * ONE_MB;
    return clampMb(safeBytes / ONE_MB);
  };
  const mbToBytes = (mb: number) => clampMb(mb) * ONE_MB;

  const supportedLanguageCodes = ((i18n.options.supportedLngs ?? Object.keys(languageNames)) as string[])
    .filter((lng) => !!lng && lng !== "cimode")
    .filter((lng) => Object.prototype.hasOwnProperty.call(languageNames, lng));

  const languages = supportedLanguageCodes.map((code) => ({
    code,
    name: (languageNames as Record<string, string>)[code] ?? code,
  }));

  const handle = useCallback(
    async (toolCall: LocalSettingsToolCall): Promise<ToolTextResult> => {
      try {
        switch (toolCall.toolName) {
          case "local_settings_get":
            return structured(
              {
                chatApp: {
                  enableUserLocation,
                  throttleInMs: experimentalThrottle,
                  showTemperature: !!showMessageTemperature,
                  showTokensPerMessage: !!showMessageTokens,
                },
                ai: {
                  temperature,
                  defaultModels: {
                    userPreferredModel,
                    userPreferredImageModel,
                    userPreferredVideoModel,
                    userPreferredSpeechModel,
                    userPreferredTranscriptionModel,
                    userPreferredRerankingModel,
                  },
                },
                language: {
                  current: i18n.language,
                },
                mcp: {
                  toolTimeoutInMs: toolTimeout,
                  resetTimeoutOnProgress,
                },
              }
            );

          case "local_settings_set": {
            const input = toolCall.input ?? {};

            if (typeof input.enableUserLocation === "boolean") {
              setEnableUserLocation(input.enableUserLocation);
            }

            const nextShowTemperature =
              typeof input.showTemperature === "boolean"
                ? input.showTemperature
                : typeof input.showMessageTemperature === "boolean"
                  ? input.showMessageTemperature
                  : undefined;

            if (typeof nextShowTemperature === "boolean") {
              setShowMessageTemperature(nextShowTemperature);
            }

            const nextShowTokensPerMessage =
              typeof input.showTokensPerMessage === "boolean"
                ? input.showTokensPerMessage
                : typeof input.showMessageTokens === "boolean"
                  ? input.showMessageTokens
                  : undefined;

            if (typeof nextShowTokensPerMessage === "boolean") {
              setShowMessageTokens(nextShowTokensPerMessage);
            }

            if (input.throttle !== undefined) {
              setThrottle(input.throttle);
            }

            if (input.temperature !== undefined) {
              if (typeof setTemperature !== "function") {
                throw new Error(
                  "setTemperature missing in store (expected a.setTemperature)."
                );
              }
              setTemperature(input.temperature);
            }

            const setPreferredModel = (
              value: unknown,
              setter: (model: string) => void
            ) => {
              if (value === null) {
                setter("");
                return;
              }
              if (typeof value === "string") {
                setter(value);
              }
            };

            setPreferredModel(input.userPreferredModel, setUserPreferredModel);
            setPreferredModel(input.userPreferredImageModel, setUserPreferredImageModel);
            setPreferredModel(input.userPreferredVideoModel, setUserPreferredVideoModel);
            setPreferredModel(input.userPreferredSpeechModel, setUserPreferredSpeechModel);
            setPreferredModel(input.userPreferredTranscriptionModel, setUserPreferredTranscriptionModel);
            setPreferredModel(input.userPreferredRerankingModel, setUserPreferredRerankingModel);

            if (input.language !== undefined) {
              if (typeof input.language !== "string" || !input.language.trim()) {
                throw new Error("language must be a non-empty string.");
              }

              const requestedLanguage = input.language.trim();
              if (!supportedLanguageCodes.includes(requestedLanguage)) {
                throw new Error(
                  `Unsupported language: ${requestedLanguage}. Supported languages: ${supportedLanguageCodes.join(", ")}`
                );
              }

              await i18n.changeLanguage(requestedLanguage);
            }

            if (input.mcpToolTimeout !== undefined) {
              setMcpTimeout(
                input.mcpToolTimeout,
                input.mcpResetTimeoutOnProgress ?? resetTimeoutOnProgress
              );
            } else if (input.mcpResetTimeoutOnProgress !== undefined) {
              setMcpTimeout(toolTimeout, input.mcpResetTimeoutOnProgress);
            }

            return ok("Settings updated");
          }

          case "local_settings_get_languages":
            return structured({
              current: i18n.language,
              languages,
            });

          case "attachments_settings_get":
            return structured({
              convertAttachmentsToText: convertAttachmentsToText ?? false,
              sendRawAttachments: sendRawAttachments ?? false,
              maxAttachmentsSizeMb: bytesToMb(maxAttachmentsSize),
              extractExif: !!extractExif,
            });

          case "attachments_settings_set": {
            const input = toolCall.input ?? {};

            if (typeof input.convertAttachmentsToText === "boolean") {
              setConvertAttachmentsToText(input.convertAttachmentsToText);
            }

            if (typeof input.sendRawAttachments === "boolean") {
              setSendRawAttachments(input.sendRawAttachments);
            }

            if (input.maxAttachmentsSizeMb !== undefined) {
              if (
                typeof input.maxAttachmentsSizeMb !== "number"
                || Number.isNaN(input.maxAttachmentsSizeMb)
                || !Number.isFinite(input.maxAttachmentsSizeMb)
              ) {
                throw new Error("maxAttachmentsSizeMb must be a valid number.");
              }

              setMaxAttachmentsSize(mbToBytes(input.maxAttachmentsSizeMb));
            }

            if (typeof input.extractExif === "boolean") {
              setExtractExif(input.extractExif);
            }

            return ok("Attachment settings updated");
          }

          default:
            throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [
      enableUserLocation,
      showMessageTemperature,
      showMessageTokens,
      experimentalThrottle,
      temperature,
      userPreferredModel,
      userPreferredImageModel,
      userPreferredVideoModel,
      userPreferredSpeechModel,
      userPreferredTranscriptionModel,
      userPreferredRerankingModel,
      toolTimeout,
      resetTimeoutOnProgress,
      convertAttachmentsToText,
      sendRawAttachments,
      maxAttachmentsSize,
      extractExif,
      i18n,
      languages,
      supportedLanguageCodes,
      setEnableUserLocation,
      setShowMessageTemperature,
      setShowMessageTokens,
      setThrottle,
      setTemperature,
      setConvertAttachmentsToText,
      setSendRawAttachments,
      setMaxAttachmentsSize,
      setExtractExif,
      setUserPreferredModel,
      setUserPreferredImageModel,
      setUserPreferredVideoModel,
      setUserPreferredSpeechModel,
      setUserPreferredTranscriptionModel,
      setUserPreferredRerankingModel,
      setMcpTimeout,
    ]
  );

  return {
    name: localSettingsPluginDef.name,
    handle,
  };
}
