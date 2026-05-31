import { useCallback, useMemo, useState } from "react";
import { ModelSelect } from "../models/ModelSelect";
import { UserMenuInline } from "../user-settings/UserMenuInline";
import { RerankingInput } from "./RerankingInput";
import { ErrorAlerts, ModelFavoriteToggleButton, RerankingCard, RerankingDocumentCard, useTheme, WarningAlerts } from "aihappey-components";
import { RerankingWarnings } from "./RerankingWarnings";
import { useRerankingController } from "./useRerankingController";
import { useReranking } from "aihappey-reranking";
import { useTranslation } from "aihappey-i18n";
import { useStorageErrorMessage } from "../storage/storageErrorMessage";
import { useAppStore } from "aihappey-state";

function downloadFile(file: File, downloadName?: string) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName ?? file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export const RerankingPage = () => {
    const { Tabs, Tab } = useTheme();
    const { t } = useTranslation();
    const getStorageErrorMessage = useStorageErrorMessage();
    const [activeTab, setActiveTab] = useState<string>("current");
    const rerankingStore = useReranking();

    const {
        models,
        prompt,
        setPrompt,
        processing,
        canSend,
        docs,
        errors,
        warnings,
        conversionWarnings,
        addError,
        dismissError,
        dismissWarning,
        dismissConversionWarning,
        selectedModel,
        setSelectedModel,
        onSend,
        addFilesToLocalState,
        clearDocs,
        isOver,
        dropRef: drop,
        handleDrop,
        handleDragOver,
    } = useRerankingController();
    const selectedModelOption = models?.find((model) => model.id === selectedModel);
    const favoriteModelsByType = useAppStore((a: any) => a.favoriteModelsByType as Record<string, string[]> | undefined);
    const toggleFavoriteModelForType = useAppStore((a: any) => a.toggleFavoriteModelForType as (type: string, modelId: string) => void);
    const isFavorite = !!selectedModel && (favoriteModelsByType?.reranking ?? []).includes(selectedModel);

    const dropRef = useCallback((node: HTMLDivElement | null) => {
        if (node) drop(node);
    }, [drop]);

    const persistFiles = useMemo(() => {
        // Never persist blobs.
        return docs.map((d) => ({ name: d.fileName, text: d.text }));
    }, [docs]);

    const handleSend = useCallback(async () => {
        const res = await onSend();
        if (!res) return;
        try {
            await rerankingStore.add(prompt, persistFiles, res as any);
            // optimistic update already happens in provider; still safe to refresh in case store is out-of-sync
            rerankingStore.refresh();
        } catch (err) {
            addError(getStorageErrorMessage(err, "Failed to save reranking result"));
        }
    }, [addError, onSend, persistFiles, prompt, rerankingStore]);

    return (
        <div
            style={{
                background: "transparent",
                width: "100%",
                height: "100%",
                minHeight: "100vh",
                border: isOver ? "2px dotted" : undefined,
                borderColor: isOver ? "#888" : "transparent",
            }}
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <div style={{
                paddingLeft: 12, paddingRight: 12,
                display: "flex", alignItems: "center"
            }}>
                <ModelSelect
                    models={models ?? []}
                    modelTypes={["reranking"]}
                    value={selectedModel ?? ""}
                    onChange={setSelectedModel}
                />
                <div style={{ paddingLeft: 8 }}>
                    <ModelFavoriteToggleButton
                        variant="subtle"
                        size="small"
                        isFavorite={isFavorite}
                        modelName={selectedModelOption?.name ?? selectedModel}
                        onToggleFavorite={() => selectedModel && toggleFavoriteModelForType("reranking", selectedModel)}
                        disabled={!selectedModel}
                    />
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ paddingLeft: 16 }}>
                    <UserMenuInline />
                </div>
            </div>

            <ErrorAlerts errors={errors} dismissError={dismissError} />
            <WarningAlerts warnings={conversionWarnings} dismissWarning={dismissConversionWarning} />
            <RerankingWarnings warnings={warnings} dismissWarning={dismissWarning} />
        
            <div
                style={{
                    marginTop: 44,
                    padding: "0 12px",
                }}
            >
                <RerankingInput
                    value={prompt}
                    onChange={setPrompt}
                    onSend={handleSend}
                    onFilesSelected={(files) => {
                        void addFilesToLocalState(files);
                    }}
                    onClearFiles={clearDocs}
                    docsCount={docs.length}
                    processing={processing}
                    canSend={canSend}
                />
            </div>

            <div style={{ maxWidth: 1056, margin: "0 auto", padding: "0 12px" }}>
                <Tabs activeKey={activeTab} onSelect={setActiveTab}>
                    <Tab eventKey="current" title={t('current')}>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                gap: 16,
                                alignItems: "stretch",
                                marginTop: 16,
                            }}
                        >
                            {docs.map((d) => (
                                <RerankingDocumentCard
                                    key={d.id}
                                    fileName={d.fileName}
                                    text={d.text}
                                    rank={d.rank}
                                    relevanceScore={d.relevanceScore}
                                    onDownload={() => downloadFile(d.file, d.fileName)}
                                />
                            ))}
                        </div>
                    </Tab>

                    <Tab eventKey="history" title={t('saved', { total: rerankingStore.items.length })}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
                            {rerankingStore.items.map((item) => (
                                <RerankingCard
                                    key={item.id}
                                    query={item.query}
                                    files={item.files}
                                    reranking={item.reranking}
                                    onDelete={() => {
                                        void (async () => {
                                            try {
                                                await rerankingStore.delete(item.id);
                                            } catch (err) {
                                                addError(getStorageErrorMessage(err, "Delete failed"));
                                            }
                                        })();
                                    }}
                                />
                            ))}
                        </div>
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
};
