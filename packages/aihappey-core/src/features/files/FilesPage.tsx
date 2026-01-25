import { useCallback, useMemo, useState } from "react";

import * as Components from "aihappey-components";
import { FileCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useFiles } from "aihappey-files";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";

import { NativeTypes } from "react-dnd-html5-backend";
import { useDrop } from "react-dnd";

function normalizeText(v: unknown) {
    return String(v ?? "").trim().toLowerCase();
}

export const FilesPage = () => {
    const { SearchBox, Paragraph } = useTheme();
    const { t } = useTranslation();
    const files = useFiles();

    const [search, setSearch] = useState("");
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
        },
        [files]
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
                    <OverviewPageHeader title={t("files")} />

                    <Paragraph style={{ textAlign: "center" }}>{t("filesPage.description")}</Paragraph>

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
                            gridTemplateColumns: "1fr 1fr",
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
                            filtered.map((f) => (
                                <div key={f.id} style={{ maxWidth: 320, minWidth: 320, width: "100%" }}>
                                    <FileCard
                                        file={f}
                                        onDownload={() => downloadFile(f.id)}
                                        onDelete={() => files.delete(f.id)}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

