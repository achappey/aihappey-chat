import React from "react";
import type { ComponentRenderProps } from "@json-render/react";

type ComponentProps = ComponentRenderProps<Record<string, any>>;

const AdaptiveCard = ({ children }: ComponentProps) => (
  <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>{children}</div>
);

const TextBlock = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  return <p style={{ margin: 0 }}>{String(p.text ?? "")}</p>;
};

const Image = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  return <img src={p.url} alt={p.altText ?? ""} style={{ maxWidth: "100%" }} />;
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
  const facts = Array.isArray(p.facts) ? p.facts : [];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 6 }}>
      {facts.map((f: any, i: number) => (
        <React.Fragment key={i}>
          <strong>{String(f?.title ?? "")}</strong>
          <span>{String(f?.value ?? "")}</span>
        </React.Fragment>
      ))}
    </div>
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
  return <p>{inlines.map((x: any) => String(x?.text ?? "")).join("")}</p>;
};

const InputText = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  return <input type="text" placeholder={p.placeholder} defaultValue={p.value ?? ""} />;
};

const InputNumber = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  return <input type="number" min={p.min} max={p.max} defaultValue={p.value ?? ""} />;
};

const InputDate = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  return <input type="date" min={p.min} max={p.max} defaultValue={p.value ?? ""} />;
};

const InputTime = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  return <input type="time" min={p.min} max={p.max} defaultValue={p.value ?? ""} />;
};

const InputToggle = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  return (
    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input type="checkbox" defaultChecked={String(p.value ?? p.valueOff) === String(p.valueOn ?? "true")} />
      <span>{String(p.title ?? p.label ?? "")}</span>
    </label>
  );
};

const InputChoiceSet = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const choices = Array.isArray(p.choices) ? p.choices : [];
  return (
    <select defaultValue={p.value ?? ""}>
      {choices.map((c: any, i: number) => (
        <option key={i} value={c?.value}>
          {String(c?.title ?? c?.value ?? "")}
        </option>
      ))}
    </select>
  );
};

const ActionOpenUrl = ({ element, on }: ComponentProps) => {
  const p = element.props ?? {};
  const press = on("press");
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        if (press.bound || press.shouldPreventDefault) {
          e.preventDefault();
        }
        press.emit();
      }}
    >
      {String(p.title ?? "Open")}
    </a>
  );
};

const ActionSubmit = ({ element, emit }: ComponentProps) => {
  const p = element.props ?? {};
  return <button type="button" onClick={() => emit("press")}>{String(p.title ?? "Submit")}</button>;
};

const ActionShowCard = ({ element, emit }: ComponentProps) => {
  const p = element.props ?? {};
  return <button type="button" onClick={() => emit("press")}>{String(p.title ?? "Show")}</button>;
};

const ActionToggleVisibility = ({ element, emit }: ComponentProps) => {
  const p = element.props ?? {};
  return <button type="button" onClick={() => emit("press")}>{String(p.title ?? "Toggle")}</button>;
};

const ActionExecute = ({ element, emit }: ComponentProps) => {
  const p = element.props ?? {};
  return <button type="button" onClick={() => emit("press")}>{String(p.title ?? "Execute")}</button>;
};

export const adaptiveCardsComponentRegistry = {
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

