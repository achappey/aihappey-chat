import {
  VideoSettingsForm,
  type VideoSettings,
} from "aihappey-components";
import { useFiles } from "aihappey-files";
import { useAppStore } from "aihappey-state";
import { useEffect, useMemo, useState } from "react";
import { useStorageErrorMessage } from "../storage/storageErrorMessage";
import {
  isValidVideoImageAttachment,
  stripVideoFrameImagePrefix,
  stripVideoInputReferencePrefix,
  VIDEO_INPUT_REFERENCE_PREFIX,
  videoFrameImageNamePrefix,
  videoFrameTypes,
  type VideoFrameType,
} from "../videos/videoAttachments";

type VideoSettingsFileInfo = {
  id: string;
  name: string;
  mediaType?: string;
  previewUrl?: string;
};

type VideoFrameImageInfo = {
  frameType: VideoFrameType;
  file?: VideoSettingsFileInfo;
};

const readImagePreviewFiles = async (
  read: (id: string) => Promise<{ data: Blob } | undefined>,
  items: { id: string; name: string }[],
  labelFor: (name: string) => string
) => {
  const objectUrls: string[] = [];
  const files = await Promise.all(
    items.map(async (item): Promise<VideoSettingsFileInfo | undefined> => {
      const stored = await read(item.id);
      if (!stored) return undefined;

      const previewUrl = isValidVideoImageAttachment(stored.data)
        ? URL.createObjectURL(stored.data)
        : undefined;
      if (previewUrl) objectUrls.push(previewUrl);

      return {
        id: item.id,
        name: labelFor(item.name),
        mediaType: stored.data.type || "image/*",
        previewUrl,
      };
    })
  );

  return {
    files: files.filter((file): file is VideoSettingsFileInfo => !!file),
    objectUrls,
  };
};

export const VideoSettingsGeneralTab = ({ onEditProviderKeys }: any) => {
  const n = useAppStore((s: any) => s.n);
  const seed = useAppStore((s: any) => s.seed);
  const aspectRatio = useAppStore((s: any) => s.aspectRatio);
  const duration = useAppStore((s: any) => s.duration);
  const resolution = useAppStore((s: any) => s.resolution);
  const fps = useAppStore((s: any) => s.fps);
  const maxVideosPerCall = useAppStore((s: any) => s.maxVideosPerCall);
  const setN = useAppStore((s: any) => s.setN);
  const setSeed = useAppStore((s: any) => s.setSeed);
  const setAspectRatio = useAppStore((s: any) => s.setAspectRatio);
  const setDuration = useAppStore((s: any) => s.setDuration);
  const setResolution = useAppStore((s: any) => s.setResolution);
  const setFps = useAppStore((s: any) => s.setFps);
  const setMaxVideosPerCall = useAppStore((s: any) => s.setMaxVideosPerCall);
  const files = useFiles();
  const getStorageErrorMessage = useStorageErrorMessage();
  const [inputReferences, setInputReferences] = useState<VideoSettingsFileInfo[]>([]);
  const [frameImages, setFrameImages] = useState<VideoFrameImageInfo[]>([]);

  const inputReferenceItems = useMemo(
    () => (files.items ?? []).filter((file) => file.name.startsWith(VIDEO_INPUT_REFERENCE_PREFIX)),
    [files.items]
  );

  const frameImageItems = useMemo(
    () =>
      videoFrameTypes.map((frameType) => ({
        frameType,
        item: (files.items ?? [])
          .filter((file) => file.name.startsWith(videoFrameImageNamePrefix(frameType)))
          .sort((a, b) => b.createdAt - a.createdAt)[0],
      })),
    [files.items]
  );

  useEffect(() => {
    let cancelled = false;
    let objectUrls: string[] = [];

    void readImagePreviewFiles(
      files.read,
      inputReferenceItems,
      stripVideoInputReferencePrefix
    ).then((result) => {
      objectUrls = result.objectUrls;
      if (!cancelled) setInputReferences(result.files);
    });

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files.read, inputReferenceItems]);

  useEffect(() => {
    let cancelled = false;
    let objectUrls: string[] = [];

    const run = async () => {
      const next: VideoFrameImageInfo[] = [];

      for (const { frameType, item } of frameImageItems) {
        if (!item) {
          next.push({ frameType });
          continue;
        }

        const result = await readImagePreviewFiles(
          files.read,
          [item],
          (name) => stripVideoFrameImagePrefix(name, frameType)
        );
        objectUrls.push(...result.objectUrls);
        next.push({ frameType, file: result.files[0] });
      }

      if (!cancelled) setFrameImages(next);
    };

    void run();
    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files.read, frameImageItems]);

  const onAddInputReferences = async (selected: File[]) => {
    const imageFiles = selected.filter(isValidVideoImageAttachment);
    if (!imageFiles.length) return;

    try {
      await Promise.all(
        imageFiles.map((file) =>
          files.create({
            name: `${VIDEO_INPUT_REFERENCE_PREFIX}${Date.now()}_${file.name}`,
            mimeType: file.type || "application/octet-stream",
            data: file,
          })
        )
      );
      files.refresh();
    } catch (err) {
      console.error(getStorageErrorMessage(err, "Failed to save video reference image"));
    }
  };

  const onRemoveInputReference = async (id: string) => {
    try {
      await files.delete(id);
      files.refresh();
    } catch (err) {
      console.error(getStorageErrorMessage(err, "Failed to remove video reference image"));
    }
  };

  const onSetFrameImage = async (frameType: VideoFrameType, selected: File[]) => {
    const file = selected.find(isValidVideoImageAttachment);
    if (!file) return;

    try {
      await Promise.all(
        (files.items ?? [])
          .filter((item) => item.name.startsWith(videoFrameImageNamePrefix(frameType)))
          .map((item) => files.delete(item.id))
      );

      await files.create({
        name: `${videoFrameImageNamePrefix(frameType)}${file.name}`,
        mimeType: file.type || "application/octet-stream",
        data: file,
      });
      files.refresh();
    } catch (err) {
      console.error(getStorageErrorMessage(err, "Failed to save video frame image"));
    }
  };

  const onRemoveFrameImage = async (frameType: VideoFrameType) => {
    try {
      await Promise.all(
        (files.items ?? [])
          .filter((item) => item.name.startsWith(videoFrameImageNamePrefix(frameType)))
          .map((item) => files.delete(item.id))
      );
      files.refresh();
    } catch (err) {
      console.error(getStorageErrorMessage(err, "Failed to remove video frame image"));
    }
  };

  const onChange = (next: VideoSettings) => {
    if (next.n !== n) setN(next.n);
    if (next.seed !== seed) setSeed(next.seed);
    if (next.aspectRatio !== aspectRatio) setAspectRatio(next.aspectRatio);
    if (next.duration !== duration) setDuration(next.duration);
    if (next.resolution !== resolution) setResolution(next.resolution);
    if (next.fps !== fps) setFps(next.fps);
    if (next.maxVideosPerCall !== maxVideosPerCall) setMaxVideosPerCall(next.maxVideosPerCall);
  };

  const settings: VideoSettings = {
    n,
    seed,
    aspectRatio,
    duration,
    resolution,
    fps,
    maxVideosPerCall,
  };

  return (
    <VideoSettingsForm
      value={settings}
      onChange={onChange}
      inputReferences={inputReferences}
      frameImages={frameImages}
      onAddInputReferences={(fs) => void onAddInputReferences(fs)}
      onRemoveInputReference={(id) => void onRemoveInputReference(id)}
      onSetFrameImage={(frameType, fs) => void onSetFrameImage(frameType, fs)}
      onRemoveFrameImage={(frameType) => void onRemoveFrameImage(frameType)}
    />
  );
};
