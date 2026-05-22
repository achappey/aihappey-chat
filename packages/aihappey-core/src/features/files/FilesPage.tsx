import { useCallback, useEffect, useMemo, useState } from "react";

import { ErrorAlerts, FileCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useFiles } from "aihappey-files";
import type { StoredFile } from "aihappey-files";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { useStorageErrorMessage } from "../storage/storageErrorMessage";
import { FileDetailModal } from "./FileDetailModal";

import { NativeTypes } from "react-dnd-html5-backend";
import { useDrop } from "react-dnd";

function normalizeText(v: unknown) {
    return String(v ?? "").trim().toLowerCase();
}

export const FilesPage = () => {
    const PAGE_SIZE = 50;
    const { Button, SearchBox, Text } = useTheme();
    const { t } = useTranslation();
    const files = useFiles();
    const getStorageErrorMessage = useStorageErrorMessage();
    const [errors, setErrors] = useState<{ id: string; message: string }[]>([]);
    const [selectedFileId, setSelectedFileId] = useState<string | undefined>(undefined);
    const [selectedFile, setSelectedFile] = useState<StoredFile | undefined>(undefined);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const q = normalizeText(search);

    const collator = useMemo(
        () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
        []
    );

    const filtered = useMemo(() => {
        const items = Array.isArray(files.items) ? files.items : [];
        const out = q
            ? items.filter((f) => {
                const mime = (f as any)?.data?.type || "";
                const hay = normalizeText(`${(f as any).name} ${mime}`);
                return hay.includes(q);
            })
            : items;

        return out
            .slice()
            .sort((a, b) => collator.compare(a.name ?? "", b.name ?? ""));
    }, [collator, files.items, q]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }, []);

    const addError = useCallback((message: string) => {
        setErrors((prev) => [...prev, { id: crypto.randomUUID(), message }]);
    }, []);

    const dismissError = useCallback((id: string) => {
        setErrors((prev) => prev.filter((e) => e.id !== id));
    }, []);

    const closeFileDetails = useCallback(() => {
        setSelectedFileId(undefined);
        setSelectedFile(undefined);
        setDetailsLoading(false);
    }, []);

    // DnD preview
    const [{ isOver }, drop] = useDrop({
        accept: [NativeTypes.FILE],
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    });

    const dropRef = useCallback((node: HTMLDivElement | null) => {
        if (node) drop(node);
    }, [drop]);


    const handleFileDrop = useCallback(
        async (item: any) => {
            const list: FileList | undefined = item?.dataTransfer?.files;
            if (!list || list.length === 0) return;

            const selected = Array.from(list);
            try {
                await Promise.all(
                    selected.map(async (f) => {
                        await files.create({
                            name: f.name,
                            mimeType: f.type || "application/octet-stream",
                            data: f,
                        });
                    })
                );

                files.refresh();
            } catch (err) {
                addError(getStorageErrorMessage(err, "Failed to save file"));
            }
        },
        [addError, files, getStorageErrorMessage]
    );

    const downloadFile = useCallback(
        async (id: string) => {
            const stored = await files.read(id);
            if (!stored) return;

            const url = URL.createObjectURL(stored.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = stored.name;
            a.click();
            URL.revokeObjectURL(url);
        },
        [files]
    );

    const deleteFile = useCallback(
        async (id: string) => {
            try {
                await files.delete(id);
                if (selectedFileId === id) {
                    closeFileDetails();
                }
            } catch (err) {
                addError(getStorageErrorMessage(err, "Delete failed"));
                throw err;
            }
        },
        [addError, closeFileDetails, files, getStorageErrorMessage, selectedFileId]
    );

    useEffect(() => {
        if (!selectedFileId) {
            setSelectedFile(undefined);
            setDetailsLoading(false);
            return;
        }

        let cancelled = false;
        setDetailsLoading(true);

        void files.read(selectedFileId)
            .then((stored) => {
                if (cancelled) return;
                setSelectedFile(stored);
                if (!stored) {
                    addError("Failed to load file details");
                }
            })
            .catch((err) => {
                if (cancelled) return;
                addError(getStorageErrorMessage(err, "Failed to load file"));
            })
            .finally(() => {
                if (!cancelled) {
                    setDetailsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [addError, files, getStorageErrorMessage, selectedFileId]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [search]);

    const selectedFileName = useMemo(
        () => selectedFile?.name ?? files.items.find((item) => item.id === selectedFileId)?.name,
        [files.items, selectedFile, selectedFileId]
    );

    return (
        <div
            ref={dropRef}
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            style={{
                border: isOver ? "2px dotted" : undefined,
                height: "100%",
                borderColor: isOver ? "#888" : "transparent",
            }}
        >
            <div style={{
                background: "transparent",
                height: "100%"
            }}>
                <div
                    style={{
                        width: 700,
                        maxWidth: "100%",
                        margin: "0 auto",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <ErrorAlerts errors={errors} dismissError={dismissError} />

                    <OverviewPageHeader title={t("files")} />

                    <Text as="p" align={"center" }>{t("filesPage.description")}</Text>

                    <div
                        style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: 16,
                        }}
                    >
                        <div style={{ width: 360, maxWidth: "100%" }}>
                            <SearchBox value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} />
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                         gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: 16,
                            width: "100%",
                            maxWidth: 700,
                            marginBottom: 24,
                            justifyItems: "center",
                        }}
                    >
                        {filtered.length === 0 ? (
                            <div style={{ color: "#888", gridColumn: "1 / -1", textAlign: "center" }}>
                                {t("noResults")}
                            </div>
                        ) : (
                            filtered.slice(0, visibleCount).map((f) => (
                                <div key={f.id} style={{ maxWidth: 320, minWidth: 320, width: "100%" }}>
                                    <FileCard
                                        file={f}
                                        onView={() => setSelectedFileId(f.id)}
                                        onDownload={() => downloadFile(f.id)}
                                        onDelete={() => {
                                            void deleteFile(f.id);
                                        }}
                                    />
                                </div>
                            ))
                        )}
                    </div>

                    {filtered.length > visibleCount && (
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "center",
                                marginTop: 16,
                                marginBottom: 24,
                            }}
                        >
                            <Button
                                variant="subtle"
                                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                            >
                                {t("showMore")}
                            </Button>
                        </div>
                    )}

                    <FileDetailModal
                        open={selectedFileId != undefined}
                        file={selectedFile ?? undefined}
                        fileName={selectedFileName}
                        loading={detailsLoading}
                        onClose={closeFileDetails}
                        onDownload={selectedFileId ? () => void downloadFile(selectedFileId) : undefined}
                        onDelete={selectedFileId ? async () => await deleteFile(selectedFileId) : undefined}
                    />
                </div>
            </div>
        </div>
    );
};

