
import z from "zod";

const SpacingEnum = z.enum(["none", "xs", "sm", "md", "lg", "xl"]);

const SlideSchema = z.object({
  key: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  imageSrc: z.string().optional(),
});

const TableColumnSchema = z.object({
  key: z.string(),
  header: z.string(),
  fieldPath: z.string().optional(),
  format: z.enum(["number", "currency", "percent"]).optional(),
  precision: z.number().int().min(0).max(6).optional(),
  sortable: z.boolean().optional(),
  width: z.union([z.string(), z.number()]).optional(),
});

export const componentDefinitions = {
  Container: {
    description: "Generic layout container. Use for vertical or horizontal stacks and spacing between elements.",
    props: z.object({
      direction: z.enum(["row", "column"]).default("column"),
      gap: z.number().optional(),
      align: z.enum(["flex-start", "center", "flex-end", "stretch"]).optional(),
      justify: z
        .enum([
          "flex-start",
          "center",
          "flex-end",
          "space-between",
          "space-around",
          "space-evenly",
        ])
        .optional(),
      wrap: z.boolean().optional(),
      padding: SpacingEnum.optional(),
      width: z.union([z.string(), z.number()]).optional(),
      maxWidth: z.union([z.string(), z.number()]).optional(),
    }),
    slots: ["default"],
  },
  Stack: {
    description: "Vertical layout container with spacing between children.",
    props: z.object({
      gap: z.number().optional(),
      align: z.enum(["flex-start", "center", "flex-end", "stretch"]).optional(),
      padding: SpacingEnum.optional(),
    }),
    slots: ["default"],
  },
  Row: {
    description: "Horizontal layout container with optional wrapping.",
    props: z.object({
      gap: z.number().optional(),
      align: z.enum(["flex-start", "center", "flex-end", "stretch"]).optional(),
      justify: z
        .enum([
          "flex-start",
          "center",
          "flex-end",
          "space-between",
          "space-around",
          "space-evenly",
        ])
        .optional(),
      wrap: z.boolean().optional(),
    }),
    slots: ["default"],
  },
  Grid: {
    description: "Grid layout for cards or tiles. Use columns or minColumnWidth for responsive grids.",
    props: z.object({
      columns: z.number().int().min(1).optional(),
      minColumnWidth: z.number().int().min(120).optional(),
      gap: z.number().optional(),
      width: z.union([z.string(), z.number()]).optional(),
    }),
    slots: ["default"],
  },
  Text: {
    description: "Inline or block text.",
    props: z.object({
      as: z.enum(["b", "em", "h1", "h2", "h3", "h4", "h5", "h6", "i", "p", "pre", "span", "strong"]).optional(),
      size: z
        .union([
          z.literal(100),
          z.literal(200),
          z.literal(300),
          z.literal(400),
          z.literal(500),
          z.literal(600),
          z.literal(700),
          z.literal(800),
          z.literal(900),
          z.literal(1000),
        ])
        .optional(),
      weight: z.enum(["bold", "medium", "regular", "semibold"]).optional(),
      italic: z.boolean().optional(),
      underline: z.boolean().optional(),
      strikethrough: z.boolean().optional(),
      truncate: z.boolean().optional(),
      wrap: z.boolean().optional(),
      block: z.boolean().optional(),
      font: z.enum(["base", "numeric", "monospace"]).optional(),
      text: z.string().optional(),
    }),
    slots: ["default"],
  },
  Card: {
    description: "Card container with title and description. Use as primary group container, avoid nesting cards inside cards.",
    props: z.object({
      title: z.string(),
      description: z.string().optional(),
      text: z.string().optional(),
      size: z.enum(["small", "medium", "large"]).optional(),
    }),
    slots: ["default"],
  },
  Badge: {
    description: "Small status badge with optional variant.",
    props: z.object({
      text: z.string().optional(),
      variant: z.string().optional(),
      appearance: z.string().optional(),
    }),
    slots: ["default"],
  },
  ProgressBar: {
    description: "Progress indicator. Provide either a static value or a dynamic valuePath. Prefer valuePath for state-driven UI.",
    props: z.object({
      label: z.string().optional(),
      variant: z.string().optional(),
      striped: z.boolean().optional(),
      animated: z.boolean().optional(),
      value: z.number().min(0).max(100).optional(),
      valuePath: z.string().optional(),
    }),
  },
  Skeleton: {
    description: "Loading placeholder.",
    props: z.object({
      width: z.union([z.string(), z.number()]).optional(),
      height: z.union([z.string(), z.number()]).optional(),
      circle: z.boolean().optional(),
      animation: z.enum(["pulse", "wave"]).optional(),
    }),
  },
  Spinner: {
    description: "Loading spinner.",
    props: z.object({
      size: z.string().optional(),
      label: z.string().optional(),
    }),
  },
  Image: {
    description: "Image with optional sizing and fit mode.",
    props: z.object({
      src: z.string(),
      title: z.string().optional(),
      width: z.union([z.string(), z.number()]).optional(),
      height: z.union([z.string(), z.number()]).optional(),
      fit: z.enum(["none", "center", "contain", "cover", "default"]).optional(),
      bordered: z.boolean().optional(),
      shadow: z.boolean().optional(),
    }),
  },
  Carousel: {
    description: "Carousel for image or content slides.",
    props: z.object({
      slides: z.array(SlideSchema),
      interval: z.number().optional(),
      controls: z.boolean().optional(),
      indicators: z.boolean().optional(),
    }),
  },
  Table: {
    description: "Simple data table using columns plus either inline data or a dynamic dataPath. Prefer dataPath for state-driven tables and use column.fieldPath for nested values.",
    props: z.object({
      columns: z.array(TableColumnSchema),
      data: z.array(z.record(z.string(), z.unknown())).optional(),
      dataPath: z.string().optional(),
      rowKeyPath: z.string().optional(),
      emptyText: z.string().optional(),
      striped: z.boolean().optional(),
      bordered: z.boolean().optional(),
      hover: z.boolean().optional(),
      size: z.string().optional(),
    }),
  },
  DataGrid: {
    description: "Advanced data grid with sortable columns. Provide either inline data or a dynamic dataPath. Prefer dataPath for state-driven grids and rowKeyPath when row.id is not stable.",
    props: z.object({
      columns: z.array(TableColumnSchema),
      data: z.array(z.record(z.string(), z.unknown())).optional(),
      dataPath: z.string().optional(),
      rowKeyPath: z.string().optional(),
      emptyText: z.string().optional(),
      selectionMode: z.enum(["single", "multiselect", "none"]).optional(),
    }),
  },
  Chart: {
    description: "Chart.js block. Provide inline labels/datasets/options for static charts, or labelsPath/datasetsPath/optionsPath for state-driven charts. Prefer explicit *Path props for AI-generated dynamic charts.",
    props: z.object({
      type: z.string(),
      labels: z.any().optional(),
      labelsPath: z.string().optional(),
      datasets: z.any().optional(),
      datasetsPath: z.string().optional(),
      options: z.any().optional(),
      optionsPath: z.string().optional(),
      height: z.number().optional(),
    }),
  },
  Metric: {
    description: "Metric display. Provide either a static value or a dynamic valuePath. Prefer valuePath for dashboards and use format for display.",
    props: z.object({
      label: z.string(),
      value: z.union([z.number(), z.string()]).optional(),
      valuePath: z.string(),
      format: z.enum(["number", "currency", "percent"]).optional(),
      precision: z.number().int().min(0).max(6).optional(),
    }),
  },
  AudioPlayer: {
    description: "Audio player for a remote or base64 audio source.",
    props: z.object({
      src: z.string(),
    }),
  },
};
