import { useMemo, useState } from "react";
import { StickyHeaderActionBar, StructuredOutputCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useStructuredOutputs, type StructuredOutputsItem } from "aihappey-structured-outputs";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { StructuredOutputEditModal, type StructuredOutputEditValues } from "./StructuredOutputEditModal";

function normalizeText(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

export const StructuredOutputsPage = () => {
  const { SearchBox, Text } = useTheme();
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const structuredOutputs = useStructuredOutputs();

  const [search, setSearch] = useState("");
  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null);
  const [editingItem, setEditingItem] = useState<StructuredOutputsItem | undefined>();
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const q = normalizeText(search);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
    []
  );

  const filtered = useMemo(() => {
    const items = Array.isArray(structuredOutputs.items)
      ? structuredOutputs.items
      : [];

    const out = q
      ? items.filter((item) => {
        const hay = normalizeText(`${item.name} ${item.json_schema}`);
        return hay.includes(q);
      })
      : items;

    return out
      .slice()
      .sort((a, b) => collator.compare(a.name ?? "", b.name ?? ""));
  }, [collator, q, structuredOutputs.items]);

  const openCreate = () => {
    setEditingItem(undefined);
    setEditorError(null);
    setEditorMode("create");
  };

  const openEdit = (item: StructuredOutputsItem) => {
    setEditingItem(item);
    setEditorError(null);
    setEditorMode("edit");
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorMode(null);
    setEditingItem(undefined);
    setEditorError(null);
  };

  const saveEditor = async (values: StructuredOutputEditValues) => {
    setSaving(true);
    setEditorError(null);
    try {
      if (editorMode === "edit" && editingItem) {
        await structuredOutputs.update(editingItem.id, values.name, values.json_schema);
        setFeedback(t("structuredOutputsPage.editor.updated"));
      } else {
        await structuredOutputs.add(values.name, values.json_schema);
        setFeedback(t("structuredOutputsPage.editor.created"));
      }
      setEditorMode(null);
      setEditingItem(undefined);
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : t("structuredOutputsPage.editor.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "transparent" }}>
      <StickyHeaderActionBar actionLabel={t("add")} onAction={openCreate} />
      <div
        style={{
          width: 700,
          maxWidth: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingLeft: isDesktop ? 0 : 12,
          paddingRight: isDesktop ? 0 : 12,
          boxSizing: "border-box",
        }}
      >
        <OverviewPageHeader title={t("structuredOutputs")} />

        <Text as="p" align={"center"}>
          {t("structuredOutputsPage.description")}
        </Text>

        {feedback ? <Text as="p" align="center">{feedback}</Text> : null}

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ width: 360, maxWidth: "100%" }}>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder={t("searchPlaceholder")}
              autoFocus={isDesktop}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "repeat(2, minmax(0, 1fr))" : "1fr",
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
            filtered.map((item) => (
              <div
                key={item.id}
                style={{
                  maxWidth: isDesktop ? 320 : "100%",
                  minWidth: isDesktop ? 320 : 0,
                  width: "100%",
                }}
              >
                <StructuredOutputCard item={item} onEdit={() => openEdit(item)} />
              </div>
            ))
          )}
        </div>
      </div>
      <StructuredOutputEditModal
        open={editorMode !== null}
        mode={editorMode ?? "create"}
        item={editingItem}
        saving={saving}
        error={editorError}
        onClose={closeEditor}
        onSave={saveEditor}
      />
    </div>
  );
};
