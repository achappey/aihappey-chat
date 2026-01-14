import type { JSX } from "react";

export type AudioPlayerProps = {
  src: string;
  autoPlay?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export type AudioPlayerComponent = (props: AudioPlayerProps) => JSX.Element;
