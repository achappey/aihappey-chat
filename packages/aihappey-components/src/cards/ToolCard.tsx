import React, { useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { LimitedTextField } from "../fields/LimitedTextField";
import { ViewButton } from "../buttons/ViewButton";
import { ToolDetailsModal } from "../modals/ToolDetailsModal";

export type ToolCardSource = "plugin" | "local" | "model-context";

export type ToolCardProps = {
    /** Stable key (caller should use this as React key). */
    id: string;
    /** Tool name, e.g. `local_file_list` or `read_resource`. */
    name: string;
    /** Human title shown to users (if missing, falls back to `name`). */
    title?: string;
    description?: string;
    /** Where the tool comes from (plugin / custom local / MCP server). */
    source: ToolCardSource;
    /** Optional secondary label (e.g. plugin name or server name). */
    sourceDetail?: string;
    /** Optional enabled status (meaning depends on source). */
    enabled?: boolean;
    annotations?: {
        readOnlyHint?: boolean;
        destructiveHint?: boolean;
        idempotentHint?: boolean;
        openWorldHint?: boolean;
    };

    /** JSON Schema object (not string) when available. */
    inputSchema?: any;

    /**
     * Custom tool source code (typically the `execute` function string).
     * Only shown in details when `source === "local"`.
     */
    executeSource?: string;

    /** Optional toggle rendered in the card header. Intended for enable/disable controls. */
    toggleChecked?: boolean;
    onToggle?: (checked: boolean) => void;

    /** Optional: execute tool (wired by app layer). If provided, modal will show Execute button. */
    onExecute?: (toolName: string, args: any) => Promise<any>;
};

export const ToolCard = ({
    id,
    name,
    title,
    description,
    source,
    sourceDetail,
    enabled,
    annotations,
    inputSchema,
    executeSource,
    toggleChecked,
    onToggle,
    onExecute,
}: ToolCardProps) => {
    const { Card, Switch } = useTheme();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [output, setOutput] = useState<any>(undefined);
    const [executing, setExecuting] = useState(false);

    const handleExecute = async (toolName: string, args: any) => {
        if (!onExecute) return undefined;
        setExecuting(true);
        try {
            const result = await onExecute(toolName, args);
            setOutput(result);
            return result;
        } finally {
            setExecuting(false);
        }
    };

    // If a `toggleChecked` value is provided, we always render the switch.
    // When `onToggle` is not provided, the switch is shown in a read-only disabled state.
    const headerActions =
        typeof toggleChecked === "boolean"
            ? (
                <Switch
                    id={`tool-toggle-${id}`}
                    size="small"
                    checked={toggleChecked}
                    disabled={!onToggle}
                    onChange={onToggle ?? (() => undefined)}
                />
            )
            : undefined;

    const actions = (
        <ViewButton
            size="small"
            variant="transparent"
            onClick={() => setDetailsOpen(true)}
        />
    );

    return (
        <>
            <Card
                title={title ?? name}
                size="small"
                headerActions={headerActions}
                actions={actions}
            >
                <LimitedTextField text={description ?? ""} />
            </Card>

            <ToolDetailsModal
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                name={name}
                title={title}
                description={description}
                source={source}
                sourceDetail={sourceDetail}
                enabled={enabled}
                annotations={annotations}
                inputSchema={inputSchema}
                executeSource={executeSource}
                onExecute={onExecute ? handleExecute : undefined}
                output={output}
                executing={executing}
            />
        </>
    );
};

