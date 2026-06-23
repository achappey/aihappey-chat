import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type AudioPlayerStoryArgs = {
  src: string;
  autoPlay?: boolean;
};

const AudioPlayerStory = (args: AudioPlayerStoryArgs) => {
  const { AudioPlayer } = useTheme() as unknown as Pick<AihUiTheme, "AudioPlayer">;
  return <AudioPlayer {...args} style={{ width: "100%", maxWidth: 420 }} />;
};

const meta = {
  title: "AudioPlayer",
  component: AudioPlayerStory,
  argTypes: {
    src: { control: { type: "text" } },
    autoPlay: { control: { type: "boolean" } },
  },
  args: {
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    autoPlay: false,
  },
} satisfies Meta<typeof AudioPlayerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

