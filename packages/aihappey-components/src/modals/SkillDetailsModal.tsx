import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useTheme } from "../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { VersionBadge } from "../badges/VersionBadge";

type SkillDetailsCatalogItem = {
  skillId: string;
  name: string;
  description: string;
  origin: "local" | "remote";
  version?: string;
  defaultVersion: string;
  latestVersion: string;
  isDownloaded: boolean;
  downloadedVersion?: string;
};

type SkillDetailsVersion = {
  id: string;
  version: string;
  description: string;
};

type SkillDetailsStoredSkill = {
  frontmatter?: unknown;
  diagnostics?: unknown[];
  body: string;
};

export type SkillDetailsModalProps = {
  open: boolean;
  skill?: SkillDetailsCatalogItem;
  versions: SkillDetailsVersion[];
  localSkill?: SkillDetailsStoredSkill;
  loadingVersions?: boolean;
  error?: string | null;
  downloadingVersion?: string | null;
  onClose: () => void;
  onEdit?: () => void;
  onSetDefaultVersion?: (version: string) => void | Promise<void>;
  onDownloadRemoteVersion?: (version: string) => void | Promise<void>;
};

export const SkillDetailsModal = ({
  open,
  skill,
  versions,
  localSkill,
  loadingVersions,
  error,
  downloadingVersion,
  onClose,
  onEdit,
  onSetDefaultVersion,
  onDownloadRemoteVersion,
}: SkillDetailsModalProps) => {
  const { Modal, Button, Badge, Card, Tabs, Tab, Select } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!open) return;
    setActiveTab("overview");
  }, [open]);

  const tx = (key: string, fallback: string, options?: Record<string, unknown>) => {
    const value = t(key, options);
    return value && value !== key ? value : fallback;
  };

  const canSetDefaultVersion = !!onSetDefaultVersion && skill?.origin === "local" && versions.length > 0;
  const selectedDefaultVersion = skill?.defaultVersion ?? skill?.version ?? "";
  const versionLabel = useMemo(
    () => versions.find((item) => item.version === selectedDefaultVersion)?.version ?? selectedDefaultVersion,
    [selectedDefaultVersion, versions]
  );

  const cardGridStyle: React.CSSProperties = {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  };

  const badgeRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  };

  const markdownContainerStyle: React.CSSProperties = {
    paddingTop: 12,
    maxHeight: 520,
    overflow: "auto",
  };

  return (
    <Modal
      show={open}
      onHide={onClose}
      title={skill?.name ?? (t("skills") ?? "Skills")}
      size="large"
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          {onEdit && skill?.origin === "local" ? (
            <Button variant="primary" onClick={onEdit}>{tx("edit", "Edit")}</Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>{tx("close", "Close")}</Button>
        </div>
      }
    >
      {!skill ? (
        <div style={{ color: "#888" }}>{tx("noResults", "No results")}</div>
      ) : (
        <Tabs activeKey={activeTab} onSelect={setActiveTab}>
          <Tab eventKey="overview" icon="settings" title={t("general")}>
            <div style={{ display: "grid", gap: 12, paddingTop: 12 }}>

              <Card
                title={skill.skillId}
                description={
                  <div style={badgeRowStyle}>
                    {skill.version ? (
                      <VersionBadge version={skill.version} />
                    ) : null}
                    <VersionBadge
                      version={tx(
                        "skillsPage.latestVersionBadge",
                        `Latest ${skill.latestVersion}`,
                        { version: skill.latestVersion }
                      )}
                    />
                  </div>
                }
              >
                <div>{skill.description}</div>
              </Card>
            </div>
          </Tab>

          <Tab eventKey="versions" icon="version" title={t("versions")}>
            <div style={{ display: "grid", gap: 12, paddingTop: 12 }}>
              {canSetDefaultVersion ? (
                <Card
                  title={tx("default", "Default")}
                  description={tx(
                    "skillsPage.details.selectDefaultVersion",
                    "Choose which downloaded version is used by default."
                  )}
                >
                  <div style={{ maxWidth: 320 }}>
                    <Select
                      label={tx("skillsPage.details.defaultVersion", "Default version")}
                      values={selectedDefaultVersion ? [selectedDefaultVersion] : []}
                      valueTitle={selectedDefaultVersion || undefined}
                      onChange={(value: string) => {
                        void onSetDefaultVersion?.(String(value));
                      }}
                    >
                      {versions.map((item) => (
                        <option key={item.id} value={item.version}>
                          {item.version}
                        </option>
                      ))}
                    </Select>
                  </div>
                </Card>
              ) : null}

              {loadingVersions ? (
                <Card title={tx("loading", "Loading…")}>
                  <div style={{ color: "#888" }}>{tx("loading", "Loading…")}</div>
                </Card>
              ) : null}

              {error ? (
                <Card title={tx("error", "Error")}>
                  <div style={{ color: "#c00" }}>{error}</div>
                </Card>
              ) : null}

              {!loadingVersions && versions.length === 0 ? (
                <Card title={tx("versions", "Versions")}>
                  <div style={{ color: "#888" }}>{tx("noResults", "No results")}</div>
                </Card>
              ) : null}

              {versions.map((item) => {
                const isDefault = skill.defaultVersion === item.version;
                const isDownloaded = skill.downloadedVersion === item.version;

                return (
                  <Card
                    key={item.id}
                    title={item.version}
                    description={
                      <div style={badgeRowStyle}>
                        {isDefault ? (
                          <Badge size="small" bg="informative">
                            {t("default")}
                          </Badge>
                        ) : null}
                        {isDownloaded ? (
                          <Badge size="small" bg="success">
                            {tx("downloaded", "Downloaded")}
                          </Badge>
                        ) : null}
                      </div>
                    }
                    actions={
                      onDownloadRemoteVersion ? (
                        <Button
                          icon="download"
                          size="small"
                          variant="transparent"
                          title={
                            downloadingVersion === item.version
                              ? tx("loading", "Loading…")
                              : tx("download", "Download")
                          }
                          onClick={() => {
                            void onDownloadRemoteVersion(item.version);
                          }}
                          disabled={downloadingVersion === item.version}
                        ></Button>
                      ) : undefined
                    }
                  >
                    <div style={{ color: "#888" }}>{item.description}</div>
                  </Card>
                );
              })}
            </div>
          </Tab>

          <Tab eventKey="content" icon="docs" title={"SKILL.md"}>
            {localSkill ? (
              <div style={markdownContainerStyle}>
                <ReactMarkdown>{localSkill.body}</ReactMarkdown>
              </div>
            ) : (
              <Card title={tx("content", "Content")}>
                <div style={{ color: "#888" }}>
                  {tx(
                    "skillsPage.remoteDownloadToInspect",
                    "Download a remote version to inspect its local SKILL.md content."
                  )}
                </div>
              </Card>
            )}
          </Tab>
        </Tabs>
      )}
    </Modal>
  );
};
