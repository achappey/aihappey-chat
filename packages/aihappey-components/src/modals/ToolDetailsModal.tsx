import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../theme/ThemeContext";
import type { ToolCardSource } from "../cards/ToolCard";
import { CopyToClipboardButton } from "../buttons/CopyToClipboardButton";
import { ToolForm } from "../forms/tools/ToolForm";

export type ToolDetailsModalProps = {
    open: boolean;
    onClose: () => void;

    name: string;
    title?: string;
    description?: string;

    source?: ToolCardSource;
    sourceDetail?: string;
    enabled?: boolean;

    annotations?: {
        readOnlyHint?: boolean;
        destructiveHint?: boolean;
        idempotentHint?: boolean;
        openWorldHint?: boolean;
    };

    /** JSON Schema object (not string) when available. */
    inputSchema?: any;

    /** Optional: execute tool with provided args (typically wired from app layer). */
    onExecute?: (toolName: string, args: any) => Promise<any>;
    /** Optional: latest output for this tool execution (controlled by parent). */
    output?: any;
    /** Optional: execution loading flag (controlled by parent). */
    executing?: boolean;

    /** Custom tool source code (typically the stored tool `execute` function string). */
    executeSource?: string;

    size?: "small" | "medium" | "large";
};

export const ToolDetailsModal: React.FC<ToolDetailsModalProps> = ({
    open,
    onClose,
    name,
    title,
    description,
    source,
    sourceDetail,
    enabled,
    annotations,
    inputSchema,
    onExecute,
    output,
    executing,
    executeSource,
    size = "large",
}) => {
    const { t } = useTranslation();
    const { Modal, Button, Badge, JsonViewer, Tabs, Tab, Alert } = useTheme();

    const toolTitle = title ?? name;

    const hasDescription = !!(description && String(description).trim());
    const hasInput = !!inputSchema;
    const hasCode = source === "local" && !!(executeSource && String(executeSource).trim());
    const hasOutput = output !== undefined && output !== null;

    const isToolEnabled = enabled !== false;

    const defaultTab = "general";
    const [activeTab, setActiveTab] = useState<string>(defaultTab);

    const [values, setValues] = useState<Record<string, any>>({});
    const [isValid, setIsValid] = useState<boolean>(false);

    useEffect(() => {
        if (!open) return;
        // When opening, reset to the default tab (and avoid landing on a missing tab).
        setActiveTab(defaultTab);
    }, [defaultTab, open]);

    useEffect(() => {
        if (!open) return;
        // Reset form when opening or switching tools.
        setValues({});
        setIsValid(false);
    }, [name, open]);

    const flags = useMemo(() => {
        const ro = !!annotations?.readOnlyHint;
        const idem = !!annotations?.idempotentHint;
        const des = !!annotations?.destructiveHint;
        const ow = !!annotations?.openWorldHint;
        return { ro, idem, des, ow, hasAny: ro || idem || des || ow };
    }, [annotations]);


    const handleExecute = useCallback(async () => {
        if (!onExecute) return;
        await onExecute(name, values);
        setActiveTab("output");
    }, [name, onExecute, values]);

    return (
        <Modal
            show={open}
            size={size}
            onHide={onClose}
            title={toolTitle}
            actions={
                <div style={{ display: "flex", gap: 8 }}>
                    <Button
                        variant="primary"
                        disabled={!isToolEnabled || !onExecute || !hasInput || !isValid || !!executing}
                        onClick={handleExecute}
                    >
                        {t("execute")}
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                        {t("close")}
                    </Button>
                </div>
            }
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Tabs activeKey={activeTab} onSelect={setActiveTab}>
                    <Tab eventKey="general" title={t("general")}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 12 }}>

                            {!isToolEnabled && (
                                <Alert variant="warning">
                                    {t("disabled")}
                                </Alert>
                            )}

                            {hasDescription && <div>{description}</div>}

                            {!hasInput ? (
                                <Alert variant="warning">
                                    {t("input")}: {t("none")}
                                </Alert>
                            ) : (
                                <ToolForm
                                    inputSchema={inputSchema}
                                    values={values}
                                    onChange={setValues}
                                    disabled={!isToolEnabled || !!executing}
                                    onValidationChange={(v) => setIsValid(v.isValid)}
                                />
                            )}
                        </div>
                    </Tab>

                    {hasCode && (
                        <Tab eventKey="code" title={t("code")}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <pre
                                    style={{
                                        margin: 0,
                                        padding: 12,
                                        border: "1px solid rgba(0,0,0,0.1)",
                                        borderRadius: 8,
                                        background: "rgba(0,0,0,0.03)",
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        lineHeight: 1.5,
                                        overflow: "auto",
                                        maxHeight: 420,
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {String(executeSource ?? "")}
                                </pre>
                            </div>
                        </Tab>
                    )}

                    <Tab eventKey="output" title={t("output")} disabled={!hasOutput}>
                        {hasOutput ? <JsonViewer value={output} /> : <div style={{ color: "#888" }}>{t("noResults")}</div>}
                    </Tab>


                </Tabs>
            </div>
        </Modal>
    );
};

