import * as React from "react";
import { FormControl, FormHelperText, InputLabel, ListSubheader, MenuItem, Select as MuiSelect } from "@mui/material";
import { mapSize } from "./utils";

type SelectOptionData = { type: "option"; value: string; label: string; disabled?: boolean };
type SelectGroupData = { type: "group"; label: string; options: SelectOptionData[] };
type SelectNodeData = SelectOptionData | SelectGroupData;

function parseSelectNodes(children: React.ReactNode): SelectNodeData[] {
  const out: SelectNodeData[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<any>(child)) return;
    const element = child as React.ReactElement<any>;

    if (element.type === React.Fragment) {
      out.push(...parseSelectNodes(element.props.children));
      return;
    }

    if (element.type === "option") {
      out.push({
        type: "option",
        value: String(element.props.value ?? ""),
        label: String(element.props.children ?? element.props.value ?? ""),
        disabled: element.props.disabled,
      });
      return;
    }

    if (element.type === "optgroup") {
      out.push({
        type: "group",
        label: String(element.props.label ?? ""),
        options: flattenSelectOptions(parseSelectNodes(element.props.children)),
      });
    }
  });

  return out;
}

function flattenSelectOptions(nodes: SelectNodeData[]): SelectOptionData[] {
  const out: SelectOptionData[] = [];

  for (const node of nodes) {
    if (node.type === "option") out.push(node);
    else out.push(...node.options);
  }

  return out;
}

function renderSelectNodes(nodes: SelectNodeData[]): React.ReactNode {
  return nodes.map((node, index) => {
    if (node.type === "option") {
      return <MenuItem key={`option:${node.value}:${index}`} value={node.value} disabled={node.disabled}>{node.label}</MenuItem>;
    }

    return [
      <ListSubheader key={`group:${node.label}:${index}`}>{node.label}</ListSubheader>,
      ...node.options.map((item, itemIndex) => (
        <MenuItem key={`group:${node.label}:${item.value}:${itemIndex}`} value={item.value} disabled={item.disabled}>{item.label}</MenuItem>
      )),
    ];
  });
}

function getChangedMultiSelectValue(previous: string[], next: string[]) {
  return next.find((item) => !previous.includes(item)) ?? previous.find((item) => !next.includes(item)) ?? "";
}

export const Select = ({ value, values, onChange, label, hint, required, children, disabled, placeholder, size, multiselect, style, valueTitle, ...rest }: any) => {
  const nodes = React.useMemo(() => parseSelectNodes(children), [children]);
  const options = React.useMemo(() => flattenSelectOptions(nodes), [nodes]);
  const selected = multiselect ? values ?? [] : Array.isArray(values) ? values[0] : value ?? "";
  const renderValue = (selectedValue: unknown) => {
    if (valueTitle != null && valueTitle !== "") return valueTitle;

    if (Array.isArray(selectedValue)) {
      if (selectedValue.length === 0) return placeholder ?? "";
      return selectedValue
        .map((item) => options.find((option) => option.value === String(item))?.label ?? String(item))
        .join(", ");
    }

    const stringValue = String(selectedValue ?? "");
    return options.find((option) => option.value === stringValue)?.label ?? stringValue;
  };

  return (
    <FormControl fullWidth required={required} disabled={disabled} size={mapSize(size) === "large" ? "medium" : "small"} sx={style}>
      {label ? <InputLabel>{label}</InputLabel> : null}
      <MuiSelect
        value={selected}
        multiple={!!multiselect}
        label={label}
        displayEmpty={!!placeholder}
        renderValue={renderValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (multiselect) {
            const nextValues = Array.isArray(nextValue) ? nextValue.map(String) : String(nextValue).split(",");
            onChange?.(getChangedMultiSelectValue(values ?? [], nextValues));
            return;
          }

          onChange?.(nextValue);
        }}
        {...rest}
      >
        {placeholder ? <MenuItem value=""><em>{placeholder}</em></MenuItem> : null}
        {renderSelectNodes(nodes)}
      </MuiSelect>
      {hint ? <FormHelperText>{hint}</FormHelperText> : null}
    </FormControl>
  );
};

