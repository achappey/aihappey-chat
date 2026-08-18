import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useConversations } from "aihappey-conversations";
import { useImages } from "aihappey-images";
import { useTranscriptions } from "aihappey-transcriptions";
import { useSpeech } from "aihappey-speech";
import { useReranking } from "aihappey-reranking";
import { useVideos } from "aihappey-videos";
import { useJobs } from "aihappey-jobs";
import { useFiles } from "aihappey-files";
import { useSkills } from "aihappey-skills";
import { useStructuredOutputs } from "aihappey-structured-outputs";
import { useLocalTools } from "aihappey-tools";
import { usePlugins } from "aihappey-plugins";
import { useAppStore } from "aihappey-state";
import type { IconToken } from "aihappey-types";
import {
  createExportArchive,
  downloadExport,
  EXPORT_CATEGORY_IDS,
  type ExportSources,
  type ExportTargetId,
} from "./exportEngine";

type RunningState = { target: ExportTargetId; progress: number } | undefined;

const EXPORT_ICONS: Record<ExportTargetId, IconToken> = {
  all: "download",
  conversations: "chat",
  images: "images",
  transcriptions: "transcription",
  speech: "speech",
  reranks: "reranking",
  videos: "videos",
  jobs: "jobs",
  agents: "robot",
  plugins: "plugins",
  files: "folder",
  skills: "skills",
  structuredOutputs: "structuredOutputs",
  tools: "tool",
};

export const ExportSettings = () => {
  const { Button, ProgressBar, Alert } = useTheme();
  const { t } = useTranslation();
  const conversations = useConversations();
  const images = useImages();
  const transcriptions = useTranscriptions();
  const speech = useSpeech();
  const reranks = useReranking();
  const videos = useVideos();
  const jobs = useJobs();
  const files = useFiles();
  const skills = useSkills();
  const structuredOutputs = useStructuredOutputs();
  const tools = useLocalTools();
  const plugins = usePlugins();
  const agents = useAppStore((state) => state.agents) ?? [];
  const [running, setRunning] = useState<RunningState>();
  const [error, setError] = useState<string>();
  const abortRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => () => abortRef.current?.abort(), []);

  const sources = useMemo<ExportSources>(() => ({
    conversations: conversations.items,
    images: images.items,
    transcriptions: transcriptions.items,
    speech: speech.items,
    reranks: reranks.items,
    videos: videos.items,
    jobs: jobs.items,
    agents,
    plugins: {
      items: plugins.items,
      read: plugins.read,
    },
    files: files.items,
    skills: {
      items: skills.items,
      listVersions: async (skillId) => {
        const versions: any[] = [];
        let after: string | undefined;
        do {
          const page = await skills.versions.list(skillId, { limit: 100, after });
          versions.push(...page.data);
          after = page.has_more ? page.last_id : undefined;
        } while (after);
        return versions;
      },
      downloadVersion: async (skillId, version) => {
        const response = await skills.versions.content.retrieve(version, { skill_id: skillId });
        return response.ok ? response.blob() : undefined;
      },
    },
    structuredOutputs: structuredOutputs.items,
    tools: tools.items,
  }), [
    agents,
    conversations.items,
    files.items,
    images.items,
    jobs.items,
    plugins.items,
    plugins.read,
    reranks.items,
    skills,
    speech.items,
    structuredOutputs.items,
    tools.items,
    transcriptions.items,
    videos.items,
  ]);

  const start = async (target: ExportTargetId) => {
    if (running) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setError(undefined);
    setRunning({ target, progress: 0 });
    try {
      const blob = await createExportArchive(target, sources, controller.signal, (progress) => {
        setRunning((current) => current?.target === target ? { target, progress } : current);
      });
      downloadExport(blob, target);
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError")) {
        console.error("Export failed", cause);
        setError(t("settingsModal.exportFailed") ?? "The export could not be prepared.");
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = undefined;
      setRunning((current) => current?.target === target ? undefined : current);
    }
  };

  const rows: ExportTargetId[] = ["all", ...EXPORT_CATEGORY_IDS];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {error && <Alert variant="danger">{error}</Alert>}
      {rows.map((target) => {
        const isRunning = running?.target === target;
        const title = t(`settingsModal.exportItems.${target}`) ?? target;
        return (
          <div
            key={target}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              padding: target === "all" ? "2px 0 8px" : "2px 0",
              marginBottom: target === "all" ? 4 : 0,
              borderBottom: "1px solid rgba(127,127,127,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 9 }}>
                <Button
                  type="button"
                  variant="transparent"
                  size="small"
                  icon={EXPORT_ICONS[target]}
                  aria-hidden="true"
                  tabIndex={-1}
                  style={{ pointerEvents: "none", padding: 0, minWidth: 24 }}
                />
                <strong>{title}</strong>
              </div>
              <Button
                type="button"
                variant={isRunning ? "subtle" : target === "all" ? "primary" : "subtle"}
                size={target === "all" ? undefined : "small"}
                icon={isRunning ? "dismiss" : "download"}
                disabled={!!running && !isRunning}
                onClick={() => isRunning ? abortRef.current?.abort() : void start(target)}
              >
                {isRunning ? (t("cancel") ?? "Cancel") : (t("download") ?? "Download")}
              </Button>
            </div>
            {isRunning && (
              <div role="status" aria-live="polite">
                <ProgressBar
                  value={running.progress}
                  animated={running.progress < 100}
                  label={`${t("settingsModal.exporting") ?? "Exporting"} ${running.progress}%`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
