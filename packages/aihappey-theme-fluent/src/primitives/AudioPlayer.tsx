import * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Slider,
  Tooltip,
  makeStyles,
} from "@fluentui/react-components";
import {
  Play24Regular,
  Pause24Regular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
  },
  slider: {
    flexGrow: 1,
  },
  time: {
    fontSize: "12px",
    opacity: 0.8,
    textAlign: "right",
  },
});

type AudioPlayerProps = {
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
  const styles = useStyles();
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
    <div className={`${styles.root} ${className ?? ""}`} style={style}>
      <audio ref={audioRef} src={src} autoPlay={autoPlay} preload="metadata" />

      <Tooltip content={playing ? "Pause" : "Play"} relationship="label">
        <Button
          appearance="subtle"
          icon={playing ? <Pause24Regular /> : <Play24Regular />}
          onClick={toggle}
        />
      </Tooltip>

      <Slider
        className={styles.slider}
        min={0}
        max={duration || 0}
        value={current}
        onChange={(_, data) => {
          if (audioRef.current) {
            audioRef.current.currentTime = data.value as number;
          }
        }}
      />

      <div className={styles.time}>
        {formatTime(current)} / {formatTime(duration)}
      </div>
    </div>
  );
};
