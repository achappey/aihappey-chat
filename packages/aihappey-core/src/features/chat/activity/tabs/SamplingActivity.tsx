import React, { useMemo } from "react";
import { SamplingCard } from "../content/SamplingCard";
import { SamplingRequest, useAppStore } from "aihappey-state";
import { samplingRuntime, useOpenSamplings } from "../../../../runtime/mcp/samplingRuntime";

export const SamplingActivity: React.FC = () => {
  const sampling = useAppStore((a) => a.sampling);
  const openSampling = useOpenSamplings(samplingRuntime)
  const mergedSampling = useMemo<SamplingRequest[]>(() => {
    const running: SamplingRequest[] =
      openSampling.map(s => ([
        s.createdAt,
        s.serverUrl,
        s.request,
        null as any, // running
      ]));

    const completed: SamplingRequest[] =
      Object.values(sampling);

    // runtime items are always the newest → place them first
    return [...running, ...completed.slice(running.length)];
  }, [sampling]);


  if (!mergedSampling.length) {
    return null;
  }

  return (
    <div
      className="p-3"
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      {mergedSampling.map((n, i: number) => (
        <SamplingCard key={i} notif={n} />
      ))}
    </div>
  );
};
