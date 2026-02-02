import { VideoSettingsForm, type VideoSettings } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import { useMemo } from "react";

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
    />
  );
};
