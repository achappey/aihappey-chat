import type * as React from "react";
import type { JSX } from "react";

/**
 * Carousel/slider primitive for displaying a sequence of slides.
 */
export type CarouselProps = {
  id?: string;
  activeIndex?: number;
  onSelect?: (newIndex: number) => void;
  interval?: number;
  controls?: boolean;
  indicators?: boolean;
  slides: Array<{
    key: string;
    content: React.ReactNode;
    caption?: React.ReactNode;
  }>;
  className?: string;
  style?: React.CSSProperties;
};

export type CarouselComponent = (props: CarouselProps) => JSX.Element;
