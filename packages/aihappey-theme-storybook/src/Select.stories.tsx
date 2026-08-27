import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type SelectStoryArgs = {
  placeholder?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
  initialValue?: string;
  searchable?: boolean;
};

const COMPLETION_OPTIONS = [
  "a.boekman@fakton.com",
  "a.dejong@fakton.com",
  "b.jansen@fakton.com",
  "c.vandijk@fakton.com",
  "d.smit@fakton.com",
  "e.devries@fakton.com",
  "f.bakker@fakton.com",
  "g.visser@fakton.com",
  "h.meijer@fakton.com",
  "i.deboer@fakton.com",
  "j.mulder@fakton.com",
];

const SelectStory = ({ initialValue = "1", ...args }: SelectStoryArgs) => {
  const { Select } = useTheme() as unknown as Pick<AihUiTheme, "Select">;
  const [values, setValues] = useState([initialValue]);
  const [changeCount, setChangeCount] = useState(0);

  useEffect(() => {
    setValues([initialValue]);
    setChangeCount(0);
  }, [initialValue]);

  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 320 }}>
      <Select
        {...args}
        values={values}
        valueTitle={`Selected: ${values.join(", ")}`}
        onChange={(value: string) => {
          setValues([value]);
          setChangeCount((count) => count + 1);
        }}
      >
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
      </Select>
      <small>Change calls: {changeCount}</small>
    </div>
  );
};

const AsyncCompletionSelect = ({ inModal = false }: { inModal?: boolean }) => {
  const { Select, Modal } = useTheme() as unknown as Pick<AihUiTheme, "Select" | "Modal">;
  const [value, setValue] = useState("");
  const [options, setOptions] = useState(COMPLETION_OPTIONS);
  const requestRef = React.useRef(0);

  const select = (
    <Select
      value={value}
      freeform
      label="userPrincipalName"
      placeholder="Select..."
      searchPlaceholder="Search directory..."
      noResultsText="No results"
      onChange={setValue}
      onFilter={async (query: string) => {
        const request = ++requestRef.current;
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (request !== requestRef.current) return;
        const normalized = query.trim().toLowerCase();
        setOptions(
          normalized
            ? COMPLETION_OPTIONS.filter((option) => option.toLowerCase().includes(normalized))
            : COMPLETION_OPTIONS
        );
      }}
    >
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </Select>
  );

  if (!inModal) return <div style={{ width: 420, maxWidth: "100%" }}>{select}</div>;
  return <Modal show onHide={() => console.log("hide")} title="Owned devices">{select}</Modal>;
};

const meta = {
  title: "Select",
  component: SelectStory,
  argTypes: {
    placeholder: { control: { type: "text" } },
    label: { control: { type: "text" } },
    hint: { control: { type: "text" } },
    disabled: { control: { type: "boolean" } },
    searchable: { control: { type: "boolean" } },
    initialValue: { control: { type: "select" }, options: ["1", "2", "3"] },
  },
  args: {
    placeholder: "Select an option",
    label: "Demo select",
    hint: "Toggle value and verify the current selection is visible",
    disabled: false,
    searchable: false,
    initialValue: "1",
  },
} satisfies Meta<typeof SelectStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Searchable: Story = {
  args: {
    searchable: true,
    placeholder: "Select an option",
    hint: "Type to filter by option label or value",
  },
};

export const AsyncCompletion: Story = {
  render: () => <AsyncCompletionSelect />,
};

export const AsyncCompletionInModal: Story = {
  render: () => <AsyncCompletionSelect inModal />,
};
