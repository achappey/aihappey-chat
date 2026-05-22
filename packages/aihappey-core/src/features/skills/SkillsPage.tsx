import { useCallback, useEffect, useMemo, useState } from "react";
import type { Provider } from "aihappey-types";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import { SkillCard, SkillDetailsModal, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import {
  useSkills,
  type SkillCatalogItem,
  type SkillDiagnostic,
  type SkillImportResult,
  type SkillVersion,
  type StoredSkill,
} from "aihappey-skills";
import { useAppStore } from "aihappey-state";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { PROVIDERS } from "../../runtime/providers/providers";
import { useChatContext } from "../chat/context/ChatContext";

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

function getFilenameFromResponse(response: Response, fallback: string) {
  const disposition = response.headers.get("Content-Disposition") ?? response.headers.get("content-disposition");
  const match = disposition?.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i);
  return match?.[1] ? decodeURIComponent(match[1].replace(/\"/g, "").trim()) : fallback;
}

function getProviderKeyFromSkillId(skillId: string) {
  const parts = skillId.split("/").filter(Boolean);
  return parts.length > 1 ? parts[0].toLowerCase() : null;
}

function hostnameOf(url?: string) {
  if (!url) return "remote";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export const SkillsPage = () => {
  const PAGE_SIZE = 50;
  const theme = useTheme();
  const { t } = useTranslation();
  const { config: chatConfig } = useChatContext();
  const skills = useSkills();
  const enabledSkillIds = useAppStore((s) => s.enabledSkillIds);
  const setEnabledSkillIds = useAppStore((s) => s.setEnabledSkillIds);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [detailsSkillId, setDetailsSkillId] = useState<string | null>(null);
  const [detailVersions, setDetailVersions] = useState<SkillVersion[]>([]);
  const [detailLocalSkill, setDetailLocalSkill] = useState<StoredSkill | undefined>(undefined);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [downloadingVersion, setDownloadingVersion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const q = normalizeText(search);

  const remoteSkillsHost = useMemo(
    () => hostnameOf(`${chatConfig.baseUrl}${chatConfig.endpoints.skills}`),
    [chatConfig.baseUrl, chatConfig.endpoints.skills]
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, activeTab]);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
    []
  );

  const getRemoteSkillIcons = useCallback(
    (item: SkillCatalogItem): Provider["icons"] | undefined => {
      if (item.origin !== "remote") return undefined;
      const providerKey = getProviderKeyFromSkillId(item.skillId);
      if (!providerKey) return undefined;
      return PROVIDERS[providerKey]?.icons;
    },
    [PROVIDERS]
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

  const localFiltered = useMemo(
    () => filtered.filter((item) => item.origin === "local"),
    [filtered]
  );

  const remoteFiltered = useMemo(
    () => filtered.filter((item) => item.origin === "remote"),
    [filtered]
  );

  const selectedSkill = useMemo(
    () => skills.items.find((item) => item.skillId === detailsSkillId || item.id === detailsSkillId),
    [detailsSkillId, skills.items]
  );

  const loadSkillDetails = useCallback(
    async (skillId: string, item?: SkillCatalogItem) => {
      setDetailsLoading(true);
      setDetailsError(null);
      try {
        const target = item ?? skills.items.find((entry) => entry.skillId === skillId || entry.id === skillId);
        const [versionsPage, localSkill] = await Promise.all([
          skills.versions.list(skillId),
          target?.isDownloaded ? skills.read(skillId) : Promise.resolve(undefined),
        ]);

        setDetailVersions(versionsPage.data ?? []);
        setDetailLocalSkill(localSkill);
      } catch {
        setDetailVersions([]);
        setDetailLocalSkill(undefined);
        setDetailsError(
          t("skillsPage.skillDetailsFailed") ?? "Could not load skill details right now."
        );
      } finally {
        setDetailsLoading(false);
      }
    },
    [skills, t]
  );

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
        const importedSkillIds = results.flatMap((item) => item.imported.map((skill) => skill.skillId));
        setEnabledSkillIds(Array.from(new Set([...enabledSkillIds, ...importedSkillIds])));
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
    },
    [enabledSkillIds, setEnabledSkillIds, skills, t]
  );

  const handleDownloadSkill = useCallback(
    async (item: SkillCatalogItem) => {
      try {
        const response = await skills.content.retrieve(item.skillId);
        if (!response.ok) {
          setFeedback(
            t("skillsPage.downloadFailed") ?? "Could not prepare the skill download."
          );
          return;
        }

        const blob = await response.blob();
        downloadBlob(
          blob,
          getFilenameFromResponse(response, `${item.name}-${item.version ?? item.defaultVersion}.zip`)
        );
      } catch {
        setFeedback(t("skillsPage.downloadFailed") ?? "Could not prepare the skill download.");
      }
    },
    [skills, t]
  );

  const handleDeleteSkill = useCallback(
    async (item: SkillCatalogItem) => {
      await skills.delete(item.skillId);
      if (item.origin === "local") {
        setEnabledSkillIds(enabledSkillIds.filter((id) => id !== item.skillId));
      }

      if (detailsSkillId === item.skillId) {
        setDetailLocalSkill(undefined);
        await loadSkillDetails(item.skillId);
      }
    },
    [detailsSkillId, enabledSkillIds, loadSkillDetails, setEnabledSkillIds, skills]
  );

  const handleOpenDetails = useCallback(
    async (item: SkillCatalogItem) => {
      setDetailsSkillId(item.skillId);
      await loadSkillDetails(item.skillId, item);
    },
    [loadSkillDetails]
  );

  const handleCloseDetails = useCallback(() => {
    setDetailsSkillId(null);
    setDetailVersions([]);
    setDetailLocalSkill(undefined);
    setDetailsError(null);
    setDownloadingVersion(null);
  }, []);

  const handleSetDefaultVersion = useCallback(
    async (version: string) => {
      if (!selectedSkill || selectedSkill.origin !== "local") return;

      try {
        await skills.update(selectedSkill.skillId, { default_version: version });
        setFeedback(
          t("skillsPage.defaultVersionUpdated", { version }) ??
          `Default version updated to ${version}.`
        );
        await loadSkillDetails(selectedSkill.skillId);
      } catch {
        setFeedback(
          t("skillsPage.defaultVersionUpdateFailed") ??
          "Could not update the default skill version."
        );
      }
    },
    [loadSkillDetails, selectedSkill, skills, t]
  );

  const handleDownloadRemoteVersion = useCallback(
    async (version: string) => {
      if (!selectedSkill) return;
      setDownloadingVersion(version);
      try {
        await skills.ensureDownloaded(selectedSkill.skillId, version);
        setFeedback(
          t("skillsPage.remoteVersionDownloaded", { version }) ??
          `Downloaded skill version ${version}.`
        );
        await loadSkillDetails(selectedSkill.skillId);
      } catch {
        setFeedback(
          t("skillsPage.remoteDownloadFailed") ??
          "A remote skill could not be downloaded right now."
        );
      } finally {
        setDownloadingVersion(null);
      }
    },
    [loadSkillDetails, selectedSkill, skills, t]
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

  const renderGrid = (items: SkillCatalogItem[]) => {
    const visible = items.slice(0, visibleCount);
    return (
      <>
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
          {items.length === 0 ? (
            <div style={{ color: "#888", gridColumn: "1 / -1", textAlign: "center" }}>
              {t("noResults")}
            </div>
          ) : (
            visible.map((item: SkillCatalogItem) => (
              <SkillCard
                key={item.id}
                skill={{
                  id: item.skillId,
                  name: item.name,
                  description: item.description,
                  icons: getRemoteSkillIcons(item),
                  fileCount: item.fileCount,
                  origin: item.origin,
                  downloadState: item.downloadState,
                  version: item.version,
                  latestVersion: item.latestVersion,
                  isDownloaded: item.isDownloaded,
                }}
                onView={() => {
                  void handleOpenDetails(item);
                }}
                onDownload={() => {
                  void handleDownloadSkill(item);
                }}
                onDelete={item.isDownloaded ? () => {
                  void handleDeleteSkill(item);
                } : undefined}
              />
            ))
          )}
        </div>
        {items.length > visibleCount && (
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginTop: 16,
              marginBottom: 24,
            }}
          >
            <theme.Button
              variant="subtle"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            >
              {t("showMore")}
            </theme.Button>
          </div>
        )}
      </>
    );
  };

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

          <theme.Tabs activeKey={activeTab} onSelect={(k: string) => setActiveTab(k)}>
            <theme.Tab eventKey="all" icon="cardList" title={`${t("all")} (${filtered.length})`}>
              <div style={{ paddingTop: 12 }}>{renderGrid(filtered)}</div>
            </theme.Tab>

            <theme.Tab eventKey={`remote:${remoteSkillsHost}`} title={`${remoteSkillsHost} (${remoteFiltered.length})`}>
              <div style={{ paddingTop: 12 }}>{renderGrid(remoteFiltered)}</div>
            </theme.Tab>

            <theme.Tab eventKey="local" title={`${t("local")} (${localFiltered.length})`}>
              <div style={{ paddingTop: 12 }}>{renderGrid(localFiltered)}</div>
            </theme.Tab>
          </theme.Tabs>

          <SkillDetailsModal
            open={!!detailsSkillId}
            skill={selectedSkill}
            versions={detailVersions}
            localSkill={detailLocalSkill}
            loadingVersions={detailsLoading}
            error={detailsError}
            downloadingVersion={downloadingVersion}
            onClose={handleCloseDetails}
            onSetDefaultVersion={selectedSkill?.origin === "local" ? handleSetDefaultVersion : undefined}
            onDownloadRemoteVersion={selectedSkill?.origin === "remote"
              ? handleDownloadRemoteVersion
              : undefined}
          />
        </div>
      </div>
    </div>
  );
};
