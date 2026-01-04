import type { Meta, StoryObj } from "@storybook/react";
import { SettingsActionButtons } from "aihappey-components";

const meta = {
  title: "Buttons/SettingsActionButtons",
  component: SettingsActionButtons,
} satisfies Meta<typeof SettingsActionButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DownloadOnly: Story = {
  args: {
    onDownload: () => console.log("Download"),
  },
};

export const DownloadAndRestoreDefaults: Story = {
  args: {
    onDownload: () => console.log("Download"),
    onRestoreDefaults: () => console.log("Restore defaults"),
  },
};

export const Full: Story = {
  args: {
    onDownload: () => console.log("Download"),
    onRestoreDefaults: () => console.log("Restore defaults"),
    onClose: () => console.log("Close"),
  },
};

export const FullWithTranslations: Story = {
  args: {
    onDownload: () => console.log("Download"),
    onRestoreDefaults: () => console.log("Restore defaults"),
    onClose: () => console.log("Close")
  },
};

