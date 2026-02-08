import React, { useState } from "react";

type ComponentProps = {
  element: {
    props: Record<string, any>;
  };
  children?: React.ReactNode;
};

const StringField = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontWeight: 600 }}>
        {p.label} {p.required ? "*" : ""}
      </label>
      <input
        type={p.format === "email" ? "email" : p.format === "password" ? "password" : "text"}
        defaultValue={p.defaultValue ?? ""}
        placeholder={p.placeholder}
      />
    </div>
  );
};

const NumberField = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontWeight: 600 }}>
        {p.label} {p.required ? "*" : ""}
      </label>
      <input type="number" defaultValue={p.defaultValue ?? ""} min={p.minimum} max={p.maximum} />
    </div>
  );
};

const BooleanField = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  return (
    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input type="checkbox" defaultChecked={!!p.defaultValue} />
      <span>{p.label}</span>
    </label>
  );
};

const EnumField = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontWeight: 600 }}>
        {p.label} {p.required ? "*" : ""}
      </label>
      <select defaultValue={p.defaultValue ?? ""}>
        <option value="">Select...</option>
        {(p.options ?? []).map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label ?? opt.value}
          </option>
        ))}
      </select>
    </div>
  );
};

const ArrayField = ({ children }: ComponentProps) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
);

const ObjectField = ({ element, children }: ComponentProps) => {
  const p = element.props ?? {};
  return (
    <fieldset style={{ border: "1px solid #ddd", padding: 12 }}>
      <legend>{p.label}</legend>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </fieldset>
  );
};

const ResponseDisplay = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  return (
    <div style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}>
      <strong>Status:</strong> {String(p.status ?? "")}
      {p.statusText ? ` ${String(p.statusText)}` : ""}
    </div>
  );
};

const SchemaTable = ({ element }: ComponentProps) => {
  const p = element.props ?? {};
  const rows = Array.isArray(p.data) ? p.data : [];
  const keys = rows.length ? Object.keys(rows[0] ?? {}) : [];
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>{keys.map((k) => <th key={k} style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>{k}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row: any, i: number) => (
          <tr key={i}>{keys.map((k) => <td key={k}>{String(row?.[k] ?? "")}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
};

const Form = ({ element, children }: ComponentProps) => {
  const p = element.props ?? {};
  const [submitCount, setSubmitCount] = useState(0);
  return (
    <form
      style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 680 }}
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitCount((v) => v + 1);
      }}
    >
      {p.title ? <h3>{String(p.title)}</h3> : null}
      {p.description ? <p>{String(p.description)}</p> : null}
      {children}
      <button type="submit">{p.method === "POST" ? "Create" : "Submit"}</button>
      {submitCount > 0 ? <small>Submitted {submitCount}x</small> : null}
    </form>
  );
};

export const openapiComponentRegistry = {
  Form,
  StringField,
  NumberField,
  BooleanField,
  EnumField,
  ArrayField,
  ObjectField,
  ResponseDisplay,
  SchemaTable,
};

