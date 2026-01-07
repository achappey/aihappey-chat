import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TimestampGranularitiesForm } from "aihappey-components";

const meta: Meta<typeof TimestampGranularitiesForm> = {
  title: "Forms/Settings/Transcriptions/TimestampGranularitiesForm",
  component: TimestampGranularitiesForm,
};

export default meta;
type Story = StoryObj<typeof TimestampGranularitiesForm>;

type Value = React.ComponentProps<typeof TimestampGranularitiesForm>["value"];
type Granularity = "segment" | "word";

const normalize = (val: unknown): Granularity[] => {
  const raw = Array.isArray(val) ? val : [];
  const set = new Set<Granularity>();

  for (const v of raw) {
    if (v === "segment" || v === "word") set.add(v);
  }

  const ordered: Granularity[] = [];
  if (set.has("segment")) ordered.push("segment");
  if (set.has("word")) ordered.push("word");
  return ordered;
};

const Template: React.FC<{
  initial?: Value;
  idPrefix?: string;
  overrides?: Partial<React.ComponentProps<typeof TimestampGranularitiesForm>>;
}> = ({ initial, idPrefix = "timestamp-granularities", overrides }) => {
  const [value, setValue] = useState<Value>(initial);

  return (
    <TimestampGranularitiesForm
      idPrefix={idPrefix}
      value={value}
      onChange={setValue}
      {...overrides}
    />
  );
};

export const Disabled: Story = {
  render: () => <Template initial={undefined} />,
};

export const EnabledDefaultSegment: Story = {
  render: () => <Template initial={["segment"]} />,
};

export const EnabledWordOnly: Story = {
  render: () => <Template initial={["word"]} />,
};

export const EnabledBoth: Story = {
  render: () => <Template initial={["segment", "word"]} />,
};

export const EnabledButEmptyValueDefaultsSegment: Story = {
  render: () => <Template initial={[]} />,
};

export const ExternallyControlledAndDisabledToggles: Story = {
  render: () => {
    const Controlled: React.FC = () => {
      const [enabled, setEnabled] = useState(true);
      const [selected, setSelected] = useState<Granularity[]>([
        "segment",
        "word",
      ]);

      // Simulate an external persistence model owned by the parent.
      const [value, setValue] = useState<Value>(selected);

      const setSelectedNormalized = (next: Granularity[]) => {
        const normalized = normalize(next);
        const nonEmpty: Granularity[] = normalized.length ? normalized : ["segment"];
        setSelected(nonEmpty);
        setValue(nonEmpty);
      };

      return (
        <TimestampGranularitiesForm
          idPrefix="timestamp-granularities-controlled"
          value={value}
          onChange={setValue}
          enabled={enabled}
          selected={selected}
          disableEnableToggle={true}
          disableSegmentToggle={false}
          disableWordToggle={true}
          onToggleEnabled={(nextEnabled: boolean) => {
            setEnabled(nextEnabled);
            setValue(nextEnabled ? (value ?? ["segment"]) : undefined);
          }}
          onToggleGranularity={(g: Granularity, isEnabled: boolean) => {
            setSelectedNormalized(
              isEnabled ? [...selected, g] : selected.filter((x) => x !== g)
            );
          }}
        />
      );
    };

    return <Controlled />;
  },
};

