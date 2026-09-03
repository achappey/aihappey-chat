import { useEffect, useMemo, useState } from "react";
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
import { useVectorStores } from "aihappey-embeddings";
import { useAppStore } from "aihappey-state";
import type { ExportCategoryId } from "./export/exportEngine";
import { buildStorageBreakdown, type StorageCategoryUsage } from "./storageSize";

export type StorageUsage = {
  categories: StorageCategoryUsage[];
  total: number;
  failedCategories: ExportCategoryId[];
};

export function useStorageUsage() {
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
  const documentHubs = useVectorStores();
  const agents = useAppStore((state) => state.agents) ?? [];
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const immediateValues = useMemo(() => ({
    images: images.items,
    transcriptions: transcriptions.items,
    speech: speech.items,
    reranks: reranks.items,
    videos: videos.items,
    jobs: jobs.items,
    agents,
    files: files.items,
    structuredOutputs: structuredOutputs.items,
    tools: tools.items,
    documentHubs: documentHubs.items,
  }), [
    agents, documentHubs.items, files.items, images.items, jobs.items, reranks.items,
    speech.items, structuredOutputs.items, tools.items, transcriptions.items, videos.items,
  ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const measure = async () => {
      const values: Partial<Record<ExportCategoryId, unknown>> = { ...immediateValues };
      const failedCategories: ExportCategoryId[] = [];
      const tasks: Array<[ExportCategoryId, () => Promise<unknown>]> = [
        ["conversations", () => conversations.getStore("local").loadAll()],
        ["plugins", () => Promise.all(plugins.items.map((item) => plugins.read(item.id)))],
        ["skills", () => Promise.all(
          skills.items
            .filter((item) => item.isDownloaded !== false)
            .map((item) => skills.read(item.skillId)),
        )],
      ];

      await Promise.all(tasks.map(async ([id, load]) => {
        try {
          values[id] = await load();
        } catch {
          failedCategories.push(id);
        }
      }));

      if (cancelled) return;
      const categories = buildStorageBreakdown(values);
      setStorage({
        categories,
        total: categories.reduce((total, category) => total + category.bytes, 0),
        failedCategories,
      });
      setLoading(false);
    };

    void measure();
    return () => { cancelled = true; };
  }, [
    conversations, immediateValues, plugins.items, plugins.read, skills.items, skills.read,
  ]);

  return { storage, loading };
}
