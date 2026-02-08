import React from "react";
import { useTheme } from "aihappey-components";

type ComponentProps = {
  element: {
    props: Record<string, any>;
  };
  children?: React.ReactNode;
};

const AdaptiveCard = ({ element, children }: ComponentProps) => {
  const p = element.props ?? {};
  const { Card } = useTheme();
  return (
    <Card
      title={p.title}
      description={p.description}
      text={p.text}
      size={p.size}
      style={{ padding: 12 }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </Card>
  );
};

const TextBlock = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const { Text } = useTheme();

  const sizeMap: Record<string, 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000> = {
    small: 200,
    default: 300,
    medium: 400,
    large: 500,
    extraLarge: 700,
  };

  const weightMap: Record<string, "regular" | "medium" | "semibold" | "bold"> = {
    lighter: "regular",
    default: "regular",
    bolder: "bold",
  };

  const alignMap: Record<string, "start" | "center" | "end"> = {
    left: "start",
    center: "center",
    right: "end",
  };

  return (
    <Text
      as="p"
      size={sizeMap[String(p.size ?? "default")] ?? 300}
      weight={weightMap[String(p.weight ?? "default")] ?? "regular"}
      align={alignMap[String(p.horizontalAlignment ?? "left")] ?? "start"}
      wrap={p.wrap !== false}
      truncate={p.wrap === false}
    >
      {String(p.text ?? "")}
    </Text>
  );
};

const Image = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const { Image } = useTheme();

  const sizeMap: Record<string, number | string> = {
    auto: "auto",
    stretch: "100%",
    small: 64,
    medium: 128,
    large: 192,
  };

  return (
    <Image
      src={p.url}
      title={p.altText}
      width={sizeMap[String(p.size ?? "auto")]}
      fit="contain"
      bordered={p.style === "person"}
    />
  );
};

const Container = ({ children }: ComponentProps) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
);

const ColumnSet = ({ children }: ComponentProps) => (
  <div style={{ display: "flex", gap: 8 }}>{children}</div>
);

const Column = ({ children }: ComponentProps) => (
  <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
);

const FactSet = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const { Table } = useTheme();
  const facts = Array.isArray(p.facts) ? p.facts : [];

  return (
    <Table size="small" bordered>
      <tbody>
        {facts.map((f: any, i: number) => (
          <tr key={i}>
            <td>
              <strong>{String(f?.title ?? "")}</strong>
            </td>
            <td>{String(f?.value ?? "")}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

const ImageSet = ({ children }: ComponentProps) => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{children}</div>
);

const ActionSet = ({ children }: ComponentProps) => (
  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>{children}</div>
);

const RichTextBlock = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const inlines = Array.isArray(p.inlines) ? p.inlines : [];
  const { Text } = useTheme();
  return <Text as="p">{inlines.map((x: any) => String(x?.text ?? "")).join("")}</Text>;
};

const InputText = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const { Input, Text, TextArea } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {p.label ? <Text as="span">{String(p.label)}</Text> : null}
      {p.isMultiline ? (
        <TextArea placeholder={p.placeholder} value={String(p.value ?? "")} />
      ) : (
        <Input type="text" placeholder={p.placeholder} defaultValue={p.value ?? ""} />
      )}
    </div>
  );
};

const InputNumber = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const { Input, Text } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {p.label ? <Text as="span">{String(p.label)}</Text> : null}
      <Input type="number" min={p.min} max={p.max} placeholder={p.placeholder} defaultValue={p.value ?? ""} />
    </div>
  );
};

const InputDate = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const { Input, Text } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {p.label ? <Text as="span">{String(p.label)}</Text> : null}
      <Input type="date" min={p.min} max={p.max} defaultValue={p.value ?? ""} />
    </div>
  );
};

const InputTime = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const { Input, Text } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {p.label ? <Text as="span">{String(p.label)}</Text> : null}
      <Input type="time" min={p.min} max={p.max} defaultValue={p.value ?? ""} />
    </div>
  );
};

const InputToggle = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const { Switch } = useTheme();
  const [checked, setChecked] = React.useState(
    String(p.value ?? p.valueOff) === String(p.valueOn ?? "true"),
  );
  return <Switch id={p.id} label={String(p.title ?? p.label ?? "")} checked={checked} onChange={setChecked} />;
};

const InputChoiceSet = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const { Select, Input, Text } = useTheme();
  const choices = Array.isArray(p.choices) ? p.choices : [];

  if (p.style === "expanded") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {p.label ? <Text as="span">{String(p.label)}</Text> : null}
        {choices.map((c: any, i: number) => (
          <Input
            key={i}
            type={p.isMultiSelect ? "checkbox" : "radio"}
            name={String(p.id ?? "")}
            defaultChecked={String(c?.value ?? "") === String(p.value ?? "")}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {p.label ? <Text as="span">{String(p.label)}</Text> : null}
      <Select defaultValue={p.value ?? ""}>
        {p.placeholder ? <option value="">{String(p.placeholder)}</option> : null}
        {choices.map((c: any, i: number) => (
          <option key={i} value={c?.value}>
            {String(c?.title ?? c?.value ?? "")}
          </option>
        ))}
      </Select>
    </div>
  );
};

const ActionOpenUrl = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const { Button } = useTheme();
  return (
    <Button type="button" onClick={() => window.open(String(p.url ?? ""), "_blank", "noopener,noreferrer")}>
      {String(p.title ?? "Open")}
    </Button>
  );
};

const ActionSubmit = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const { Button } = useTheme();
  return <Button type="button">{String(p.title ?? "Submit")}</Button>;
};

const ActionShowCard = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const { Button } = useTheme();
  return <Button type="button">{String(p.title ?? "Show")}</Button>;
};

const ActionToggleVisibility = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const { Button } = useTheme();
  return <Button type="button">{String(p.title ?? "Toggle")}</Button>;
};

const ActionExecute = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const { Button } = useTheme();
  return <Button type="button">{String(p.title ?? "Execute")}</Button>;
};

export const adaptiveCardsAppComponentRegistry = {
  AdaptiveCard,
  TextBlock,
  Image,
  Container,
  ColumnSet,
  Column,
  FactSet,
  ImageSet,
  ActionSet,
  RichTextBlock,
  "Input.Text": InputText,
  "Input.Number": InputNumber,
  "Input.Date": InputDate,
  "Input.Time": InputTime,
  "Input.Toggle": InputToggle,
  "Input.ChoiceSet": InputChoiceSet,
  "Action.OpenUrl": ActionOpenUrl,
  "Action.Submit": ActionSubmit,
  "Action.ShowCard": ActionShowCard,
  "Action.ToggleVisibility": ActionToggleVisibility,
  "Action.Execute": ActionExecute,
};

