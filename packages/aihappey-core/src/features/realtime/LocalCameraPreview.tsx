import { useEffect, useRef } from "react";

export type LocalCameraPreviewProps = {
  stream: MediaStream | null;
};

export function LocalCameraPreview({ stream }: LocalCameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    void video.play().catch(() => undefined);

    return () => {
      if (video.srcObject === stream) video.srcObject = null;
    };
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      aria-label="Camera preview"
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 2,
        width: "clamp(120px, 24vw, 240px)",
        maxHeight: "32%",
        aspectRatio: "4 / 3",
        objectFit: "cover",
        borderRadius: 12,
        background: "#000",
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.35)",
        transform: "scaleX(-1)",
        pointerEvents: "none",
      }}
    />
  );
}
