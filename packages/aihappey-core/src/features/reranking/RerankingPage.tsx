import React from "react";
import { ModelSelect } from "../models/ModelSelect";
import { UserMenuInline } from "../user-settings/UserMenuInline";
import { RerankingInput } from "./RerankingInput";
import { ErrorAlerts, RerankingDocumentCard, WarningAlerts } from "aihappey-components";
import { RerankingWarnings } from "./RerankingWarnings";
import { useRerankingController } from "./useRerankingController";

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
        dismissError,
        dismissWarning,
        dismissConversionWarning,
        selectedModel,
        setSelectedModel,
        onSend,
        addFilesToLocalState,
        clearDocs,
        isOver,
        dropRef,
        handleDrop,
        handleDragOver,
    } = useRerankingController();

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
                    onSend={onSend}
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
            </div>
        </div>
    );
};

