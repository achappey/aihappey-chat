import React, { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type CarouselStoryArgs = {
  controls?: boolean;
  indicators?: boolean;
  withCaptions?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

const makeSlides = (withCaptions?: boolean) =>
  [
    { key: "1", label: "Slide 1", background: "#ccc" },
    { key: "2", label: "Slide 2", background: "#aaa" },
    { key: "3", label: "Slide 3", background: "#888" },
  ].map((s) => ({
    key: s.key,
    content: (
      <div
        style={{
          height: 200,
          background: s.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        {s.label}
      </div>
    ),
    caption: withCaptions ? `${s.label} caption` : undefined,
  }));

const CarouselControlledStory = (args: CarouselStoryArgs) => {
  const { Carousel } = useTheme() as unknown as Pick<AihUiTheme, "Carousel">;
  const [index, setIndex] = useState<number>(0);

  const slides = useMemo(() => makeSlides(args.withCaptions), [args.withCaptions]);

  return (
    <Carousel
      activeIndex={index}
      onSelect={setIndex}
      controls={args.controls}
      indicators={args.indicators}
      slides={slides}
      className={args.className}
      style={{ width: 480, ...(args.style ?? {}) }}
    />
  );
};

const CarouselUncontrolledStory = (args: CarouselStoryArgs) => {
  const { Carousel } = useTheme() as unknown as Pick<AihUiTheme, "Carousel">;
  const slides = useMemo(() => makeSlides(args.withCaptions), [args.withCaptions]);

  return (
    <Carousel
      controls={args.controls}
      indicators={args.indicators}
      slides={slides}
      className={args.className}
      style={{ width: 480, ...(args.style ?? {}) }}
    />
  );
};

const meta = {
  title: "Carousel",
  component: CarouselControlledStory,
} satisfies Meta<typeof CarouselControlledStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Controlled: Story = {
  args: {
    controls: true,
    indicators: true,
    withCaptions: false,
  },
};

export const ControlledWithCaptions: Story = {
  args: {
    controls: true,
    indicators: true,
    withCaptions: true,
  },
};

export const Uncontrolled: StoryObj<typeof CarouselUncontrolledStory> = {
  render: (args) => <CarouselUncontrolledStory {...args} />,
  args: {
    controls: true,
    indicators: true,
    withCaptions: true,
  },
};

