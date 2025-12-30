import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ElicitationField } from "aihappey-components";

type FieldSchema = {
  type: "boolean" | "string" | "number" | "integer";
  title?: string;
  description?: string;
  format?: "email" | "uri" | "date" | "date-time";
  oneOf?: Array<{ const: string; title: string }>;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
};

const meta = {
  title: "Fields/ElicitationField",
  component: ElicitationField,
  args: {
    fieldName: "field",
    required: false,
    field: { type: "string", title: "Field" } as any,
    value: "",
    // keep required prop satisfied; Controlled will also call it (actions panel)
    onChange: (() => {}) as any,
  },
  argTypes: {
    field: { control: "object" },
    value: { control: false }, // value is controlled by the wrapper (avoid confusing controls)
    onChange: { action: "change", control: false },
  },
} satisfies Meta<typeof ElicitationField>;

export default meta;
type Story = StoryObj<typeof meta>;

function extractNextValue(input: any): any {
  // handles: native events, checkbox-like events, direct values
  if (input && typeof input === "object" && "target" in input) {
    const t: any = (input as any).target;
    if (typeof t?.checked === "boolean") return t.checked;
    if ("value" in t) return t.value;
  }
  return input;
}

const Controlled: React.FC<React.ComponentProps<typeof ElicitationField>> = (args) => {
  const [value, setValue] = useState<any>(args.value);

  // reset when switching stories
  useEffect(() => {
    setValue(args.value);
  }, [args.value]);

  return (
    <div style={{ maxWidth: 480 }}>
      <ElicitationField
        {...args}
        value={value}
        onChange={(v: any) => {
          const next = extractNextValue(v);
          setValue(next);
          args.onChange?.(next); // logs to Storybook Actions
        }}
      />
    </div>
  );
};

export const BooleanSwitch: Story = {
  args: {
    fieldName: "isActive",
    required: false,
    value: true,
    field: {
      type: "boolean",
      title: "Active",
      description: "Enable or disable this feature",
    } as FieldSchema,
  },
  render: (args) => <Controlled {...args} />,
};

export const SelectOneOf: Story = {
  args: {
    fieldName: "priority",
    required: true,
    value: "Medium",
    // NOTE: your component uses Select.value = option.title (not option.const),
    // so this story uses const==title so the select shows the correct value.
    field: {
      type: "string",
      title: "Priority",
      description: "Select a priority level",
      oneOf: [
        { const: "Low", title: "Low" },
        { const: "Medium", title: "Medium" },
        { const: "High", title: "High" },
      ],
    } as FieldSchema,
  },
  render: (args) => <Controlled {...args} />,
};

export const TextAreaDefault: Story = {
  args: {
    fieldName: "description",
    required: false,
    value: "",
    field: {
      type: "string",
      title: "Description",
      description: "Free-form description",
    } as FieldSchema,
  },
  render: (args) => <Controlled {...args} />,
};

export const NumberField: Story = {
  args: {
    fieldName: "amount",
    required: false,
    value: 5,
    field: {
      type: "number",
      title: "Amount",
      minimum: 0,
      maximum: 10,
    } as FieldSchema,
  },
  render: (args) => <Controlled {...args} />,
};

export const IntegerField: Story = {
  args: {
    fieldName: "count",
    required: false,
    value: 1,
    field: {
      type: "integer",
      title: "Count",
      minimum: 0,
      maximum: 100,
    } as FieldSchema,
  },
  render: (args) => <Controlled {...args} />,
};

export const EmailField: Story = {
  args: {
    fieldName: "email",
    required: true,
    value: "",
    field: {
      type: "string",
      format: "email",
      title: "Email",
    } as FieldSchema,
  },
  render: (args) => <Controlled {...args} />,
};

export const UrlField: Story = {
  args: {
    fieldName: "website",
    required: false,
    value: "https://example.com",
    field: {
      type: "string",
      format: "uri",
      title: "Website",
    } as FieldSchema,
  },
  render: (args) => <Controlled {...args} />,
};

export const DateField: Story = {
  args: {
    fieldName: "startDate",
    required: false,
    value: "2025-12-30",
    field: {
      type: "string",
      format: "date",
      title: "Start date",
    } as FieldSchema,
  },
  render: (args) => <Controlled {...args} />,
};

export const DateTimeField: Story = {
  args: {
    fieldName: "eventTime",
    required: false,
    // HTML datetime-local expects "YYYY-MM-DDTHH:mm" (no timezone)
    value: "2025-12-30T13:37",
    field: {
      type: "string",
      format: "date-time",
      title: "Event time",
    } as FieldSchema,
  },
  render: (args) => <Controlled {...args} />,
};

export const WithLengthConstraints: Story = {
  args: {
    fieldName: "username",
    required: true,
    value: "",
    field: {
      type: "string",
      title: "Username",
      minLength: 3,
      maxLength: 12,
    } as FieldSchema,
  },
  render: (args) => <Controlled {...args} />,
};

export const DecimalWithMinMax: Story = {
  args: {
    fieldName: "ratio",
    required: false,
    value: 0.5,
    field: {
      type: "number",
      title: "Ratio",
      minimum: 0,
      maximum: 1,
    } as FieldSchema,
  },
  render: (args) => <Controlled {...args} />,
};
