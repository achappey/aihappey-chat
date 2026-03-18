import { useCallback, useMemo, useState } from "react";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import { SkillCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import {
  useSkills,
  type SkillCatalogItem,
  type SkillDiagnostic,
  type SkillImportResult,
} from "aihappey-skills";
import { useAppStore } from "aihappey-state";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";

function normalizeText(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const SkillsPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const skills = useSkills();
  const enabledSkillNames = useAppStore((s) => s.enabledSkillNames);
  const setEnabledSkillNames = useAppStore((s) => s.setEnabledSkillNames);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const q = normalizeText(search);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
    []
  );

  const filtered = useMemo(() => {
    const items = Array.isArray(skills.items) ? skills.items : [];
    const out = q
      ? items.filter((item) => {
        const hay = normalizeText(`${item.name} ${item.description}`);
        return hay.includes(q);
      })
      : items;

    return out
      .slice()
      .sort((a: SkillCatalogItem, b: SkillCatalogItem) => collator.compare(a.name, b.name));
  }, [collator, q, skills.items]);

  const onImportFiles = useCallback(
    async (files: File[]) => {
      const archives = files.filter((file) => file.name.toLowerCase().endsWith(".zip"));
      if (archives.length === 0) {
        setFeedback(
          t("skillsPage.importZipOnly") ?? "Only ZIP archives can be imported as skills."
        );
        return;
      }

      const results = await Promise.all(
        archives.map((file) => skills.importArchive(file, "local-zip"))
      );
      const importedCount = results.reduce(
        (sum: number, item: SkillImportResult) => sum + item.imported.length,
        0
      );
      const diagnostics = results.flatMap(
        (item: SkillImportResult): SkillDiagnostic[] => item.diagnostics
      );

      if (importedCount > 0) {
        const importedNames = results.flatMap((item) => item.imported.map((skill) => skill.name));
        setEnabledSkillNames([...enabledSkillNames, ...importedNames]);
        setFeedback(
          diagnostics.length > 0
            ? (t("skillsPage.importedWithDiagnostics", {
              count: importedCount,
              diagnostics: diagnostics.length,
            }) ??
              `Imported ${importedCount} skill(s) with ${diagnostics.length} diagnostic message(s).`)
            : (t("skillsPage.imported", { count: importedCount }) ??
              `Imported ${importedCount} skill(s).`)
        );
      } else {
        setFeedback(
          diagnostics[0]?.message ??
          (t("skillsPage.importNoValidSkills") ??
            "No valid skills were found in the uploaded ZIP archive.")
        );
      }
      skills.refresh();
    },
    [enabledSkillNames, setEnabledSkillNames, skills, t]
  );

  const handleDownloadSkill = useCallback(
    async (id: string) => {
      try {
        const archive = await skills.exportArchive(id);
        if (!archive) {
          setFeedback(
            t("skillsPage.downloadFailed") ?? "Could not prepare the skill download."
          );
          return;
        }

        downloadBlob(archive.blob, archive.filename);
      } catch {
        setFeedback(t("skillsPage.downloadFailed") ?? "Could not prepare the skill download.");
      }
    },
    [skills, t]
  );

  const handleDeleteSkill = useCallback(
    async (item: SkillCatalogItem) => {
      await skills.delete(item.id);
      const remaining = await skills.list();
      if (!remaining.some((entry) => entry.name === item.name)) {
        setEnabledSkillNames(enabledSkillNames.filter((name) => name !== item.name));
      }
    },
    [enabledSkillNames, setEnabledSkillNames, skills]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const [{ isOver }, drop] = useDrop({
    accept: [NativeTypes.FILE],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const dropRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) drop(node);
    },
    [drop]
  );

  const handleFileDrop = useCallback(
    async (item: any) => {
      const list: FileList | undefined = item?.dataTransfer?.files;
      if (!list || list.length === 0) return;
      await onImportFiles(Array.from(list));
    },
    [onImportFiles]
  );

  return (
    <div
      ref={dropRef}
      onDrop={handleFileDrop}
      onDragOver={handleDragOver}
      style={{
        border: isOver ? "2px dotted" : undefined,
        borderColor: isOver ? "#888" : "transparent",
        height: "100%",
      }}
    >
      <div style={{ background: "transparent" }}>
        <div
          style={{
            width: 760,
            maxWidth: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <OverviewPageHeader officialUrl={"https://agentskills.io"}
            docsUrl="https://agentskills.io/specification"
            title={t("skills")} />

          <theme.Text as="p" align={"center"}>
            {t("skillsPage.description") ??
              "Import local ZIP archives containing Agent Skills, review stored skills, and toggle them on or off for future use."}
          </theme.Text>

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ width: 360, maxWidth: "100%" }}>
              <theme.SearchBox
                value={search}
                onChange={setSearch}
                placeholder={t("searchPlaceholder")}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 16,
              width: "100%",
              maxWidth: 760,
              marginBottom: 24,
              justifyItems: "stretch",
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ color: "#888", gridColumn: "1 / -1", textAlign: "center" }}>
                {t("noResults")}
              </div>
            ) : (
              filtered.map((item: SkillCatalogItem) => (
                <SkillCard
                  key={item.id}
                  skill={{
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    fileCount: item.fileCount,
                    origin: item.origin,
                    downloadState: item.downloadState,
                    version: item.version,
                    latestVersion: item.latestVersion,
                    isDownloaded: item.isDownloaded,
                  }}
                  onDownload={() => {
                    void handleDownloadSkill(item.id);
                  }}
                  onDelete={item.isDownloaded ? () => {
                    void handleDeleteSkill(item);
                  } : undefined}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
