import React, { useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

export type AudioPlayerProps = {
  src: string;
  autoPlay?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

const formatTime = (s: number) => {
  if (!Number.isFinite(s)) return "--:--";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export const AudioPlayer = ({
  src,
  autoPlay,
  className,
  style,
}: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    a.paused ? a.play() : a.pause();
  };

  return (
    <div
      className={`d-flex align-items-center gap-2 ${className ?? ""}`}
      style={style}
    >
      <audio ref={audioRef} src={src} autoPlay={autoPlay} preload="metadata" />

      <Button
        variant="outline-secondary"
        size="sm"
        onClick={toggle}
      >
        {playing ? "Pause" : "Play"}
      </Button>

      <Form.Range
        min={0}
        max={duration || 0}
        value={current}
        onChange={(e) => {
          if (audioRef.current) {
            audioRef.current.currentTime = Number(e.target.value);
          }
        }}
      />

      <small className="text-muted" style={{ minWidth: 80, textAlign: "right" }}>
        {formatTime(current)} / {formatTime(duration)}
      </small>
    </div>
  );
};
