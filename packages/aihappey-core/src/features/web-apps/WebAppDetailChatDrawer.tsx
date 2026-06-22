import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { AttachmentButton, FileTags, useTheme } from "aihappey-components";
import type { UIMessage } from "aihappey-types";
import { useChatContext } from "../chat/context/ChatContext";
import { useActiveProviderMetadata } from "../chat/engine/useActiveProviderMetadata";
import { MessageList } from "../chat/messages/MessageList";
import { useUIStream } from "../json-render/useUIStream";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { fileAttachmentRuntime, useFileAttachments } from "../../runtime/files/fileAttachmentRuntime";
import { WebAppDetailDrawerTabs } from "./WebAppDetailDrawerTabs";
import { createChatAuthHeadersForModel } from "../provider-credentials/providerAuthHeaders";

type WebAppDetailChatDrawerProps = {
    open: boolean;
    onClose: () => void;
    appId?: string;
    app?: {
        name?: string;
        description?: string;
        data?: any;
        dataSource?: any;
    } | null;
    tree?: any;
    catalogPrompt: string;
    onStreamUpdate?: (tree: any) => void;
    onStreamComplete?: (tree: any) => void;
    onStreamError?: (error: Error) => void;
    onStreamingChange?: (streaming: boolean) => void;
    dataSourceValue: any;
    canRefresh: boolean;
    refreshing: boolean;
    dataRefreshError?: string;
    dataSourceError?: string;
    connectedServerKeys: string[];
    resourceOptions: any[];
    resourceTemplateOptions: any[];
    toolOptions: any[];
    structuredOutputOptions: any[];
    modelOptions: any[];
    onRefreshData: () => void;
    onDataSourceChange: (next: any) => void;
};

export const WebAppDetailChatDrawer = ({
    open,
    onClose,
    appId,
    app,
    tree,
    catalogPrompt,
    onStreamUpdate,
    onStreamComplete,
    onStreamError,
    onStreamingChange,
    dataSourceValue,
    canRefresh,
    refreshing,
    dataRefreshError,
    dataSourceError,
    connectedServerKeys,
    resourceOptions,
    resourceTemplateOptions,
    toolOptions,
    structuredOutputOptions,
    modelOptions,
    onRefreshData,
    onDataSourceChange,
}: WebAppDetailChatDrawerProps) => {
    const { Drawer: DrawerPrimitive, Button, Spinner } = useTheme();
    const { t } = useTranslation();
    const isDesktop = useIsDesktop();
    const [drawerSize, setDrawerSize] = useState<"medium" | "large" | "full">("medium");
    const [messages, setMessages] = useState<UIMessage[]>([]);
    const [chatError, setChatError] = useState<string | null>(null);

    const model = useAppStore((s) => s.selectedModel);
    const customHeaders = useAppStore((s) => s.customHeaders);
    const maxOutputTokens = useAppStore((s) => s.maxOutputTokens);
    const { config } = useChatContext();
    const providerMetadata = useActiveProviderMetadata();

    const apiKeyHeaders = useMemo(
        () => createChatAuthHeadersForModel(customHeaders, model, Boolean(config?.getAccessToken)),
        [config?.getAccessToken, customHeaders, model]
    );

    const appDataRef = useRef(app?.data);

    const treeRef = useRef(tree);

    useEffect(() => {
        appDataRef.current = app?.data;
    }, [app?.data]);

    useEffect(() => {
        treeRef.current = tree;
    }, [tree]);

    useEffect(() => {
        setMessages([]);
        setChatError(null);
        fileAttachmentRuntime.clear();
    }, [appId]);

    const {
        spec: streamingTree,
        send: sendUiRequest,
        isStreaming,
    } = useUIStream({
        api: (config?.baseUrl ?? "") + "/api/generate",
        catalogPrompt,
        model,
        getAccessToken: config?.getAccessToken,
        customHeaders: apiKeyHeaders,
        initialTree: tree ?? null,
        onComplete: (nextTree) => {
            if (nextTree) onStreamComplete?.(nextTree);
        },
        onError: (err) => {
            setChatError(err.message);
            onStreamError?.(err);
        },
    });

    useEffect(() => {
        if (streamingTree) {
            onStreamUpdate?.(streamingTree);
        }
    }, [streamingTree, onStreamUpdate]);

    useEffect(() => {
        onStreamingChange?.(isStreaming);
    }, [isStreaming, onStreamingChange]);

    const handleSend = useCallback(
        async (text: string) => {
            const trimmed = String(text ?? "").trim();
            if (!trimmed) return;

            const userMessage: UIMessage = {
                id: crypto.randomUUID(),
                role: "user",
                parts: [{ type: "text", text: trimmed }],
                metadata: {
                    timestamp: new Date().toISOString(),
                    author: "user",
                },
            };

            setMessages((prev) => [...prev, userMessage]);
            setChatError(null);

            const currentTree = treeRef.current;
            let promptToSend = trimmed;

            if (currentTree?.root && Object.keys(currentTree.elements || {}).length > 0) {
                promptToSend = `CURRENT UI STATE (already loaded, DO NOT recreate existing elements):\n${JSON.stringify(currentTree, null, 2)}\n\nUSER REQUEST: ${trimmed}\n\nIMPORTANT: The current UI is already loaded. Output ONLY the patches needed to make the requested change, one JSON patch per line (JSONL), using RFC 6902 operations:\n- Add a new element: {"op":"add","path":"/elements/new-key","value":{...}}\n- Update existing value: {"op":"replace","path":"/elements/existing-key/props/title","value":"New title"}\n- Update root: {"op":"replace","path":"/root","value":"new-root-key"}\n- Remove: {"op":"remove","path":"/elements/old-key"}\n\nDo not use op \"set\". Use add/replace/remove (and move/copy/test only if truly needed).\nDO NOT output patches for elements that don't need to change. Only output what's necessary for the requested modification.`;
            }

            await sendUiRequest(
                promptToSend,
                appDataRef.current,
                providerMetadata,
                currentTree ?? null,
                maxOutputTokens
            );

            fileAttachmentRuntime.clear();
        },
        [maxOutputTokens, providerMetadata, sendUiRequest]
    );

    const headerNavigation = (
        <div
            style={{
                display: "flex",
                width: "100%",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 4,
            }}
        >
            <Button
                icon="panelExpand"
                variant="transparent"
                disabled={drawerSize === "full"}
                onClick={() =>
                    setDrawerSize((prev) => (prev === "medium" ? "large" : "full"))
                }
            />
            <Button
                icon="panelContract"
                variant="transparent"
                disabled={drawerSize === "medium"}
                onClick={() =>
                    setDrawerSize((prev) => (prev === "full" ? "large" : "medium"))
                }
            />
        </div>
    );

    const chatContent = (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
                minHeight: 0,
            }}
        >
            {chatError ? (
                <div style={{ padding: "8px 12px", color: "#a4262c" }}>
                    {chatError}
                </div>
            ) : null}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                <MessageList
                    messages={messages as any}
                    showCitations={() => undefined}
                    showAttachments={() => undefined}
                />
            </div>
            <div
                style={{
                    flexShrink: 0,
                    paddingRight: 24,
                    paddingTop: 8,
                    boxSizing: "border-box",
                }}
            >
                {isStreaming ? <Spinner /> : null}

                <SimpleWebAppChatInput
                    onSend={handleSend}
                    disabled={isStreaming}
                    streaming={isStreaming}
                />
            </div>
        </div>
    );

    return (
        <>
            <DrawerPrimitive
                open={open}
                title={t("aiChat")}
                overlay={!isDesktop}
                size={isDesktop ? drawerSize : "small"}
                headerNavigation={headerNavigation}
                onClose={onClose}
            >
                <WebAppDetailDrawerTabs
                    app={app ?? null}
                    effectiveTree={tree}
                    dataSourceValue={dataSourceValue}
                    canRefresh={canRefresh}
                    refreshing={refreshing}
                    dataRefreshError={dataRefreshError}
                    dataSourceError={dataSourceError}
                    connectedServerKeys={connectedServerKeys}
                    resourceOptions={resourceOptions}
                    resourceTemplateOptions={resourceTemplateOptions}
                    toolOptions={toolOptions}
                    structuredOutputOptions={structuredOutputOptions}
                    modelOptions={modelOptions}
                    onRefreshData={onRefreshData}
                    onDataSourceChange={onDataSourceChange}
                    chatOpen={open}
                    chatContent={chatContent}
                />
            </DrawerPrimitive>
        </>
    );
};

type SimpleWebAppChatInputProps = {
    onSend: (text: string) => Promise<void>;
    disabled?: boolean;
    streaming?: boolean;
};

const SimpleWebAppChatInput = ({ onSend, disabled, streaming }: SimpleWebAppChatInputProps) => {
    const { TextArea, Button } = useTheme();
    const { t } = useTranslation();
    const attachments = useFileAttachments(fileAttachmentRuntime);
    const [value, setValue] = useState("");

    const canSend = value.trim().length > 0 && !disabled && !streaming;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const text = value.trim();
        if (!text || !canSend) return;
        await onSend(text);
        setValue("");
    };

    return (
        <form onSubmit={handleSubmit} style={simpleInputStyles.form}>
            {attachments.length > 0 ? (
                <div style={simpleInputStyles.tagsRow}>
                    <FileTags
                        files={attachments}
                        removeFile={(name) => fileAttachmentRuntime.remove(name)}
                    />
                </div>
            ) : null}

            <TextArea
                value={value}
                autoFocus
                placeholder={t("promptPlaceholder")}
                onChange={(next) => setValue(next ?? "")}
                style={simpleInputStyles.textArea}
            />

            <div style={simpleInputStyles.buttonRow}>
                <AttachmentButton
                    disabled={!!disabled || !!streaming}
                    onFilesSelected={(files) => {
                        files.forEach((file) => fileAttachmentRuntime.add(file));
                    }}
                />
                <Button
                    type="submit"
                    size="large"
                    icon="send"
                    disabled={!canSend}
                />
            </div>
        </form>
    );
};

const simpleInputStyles: Record<string, CSSProperties> = {
    form: {
        maxWidth: 1056,
        margin: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
    },
    tagsRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
    },
    textArea: {
        width: "100%",
    },
    buttonRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
    },
};
