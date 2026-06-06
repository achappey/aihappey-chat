import * as React from "react";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";

type BootstrapDropdownProps = Omit<
  React.ComponentProps<typeof Dropdown>,
  "children" | "onSelect"
>;

interface SelectProps extends BootstrapDropdownProps {
  /** Preferred API (matches Fluent theme): current selected values. */
  values?: string[];
  /** Legacy API (some call sites still pass this). */
  value?: string;

  /** Optional override for the toggle display text. */
  valueTitle?: string;
  /** Optional label/hint wrapper (matches other form primitives). */
  label?: string;
  hint?: string;
  required?: boolean;

  /** Multi-select is supported by keeping the menu open; parent owns toggle logic. */
  multiselect?: boolean;

  /** Accepted for API parity with Fluent theme (currently no typeahead UI here). */
  freeform?: boolean;
  onFilter?: (query: string) => Promise<void> | void;

  /** Called with the clicked option value (string). */
  onChange: (val: string) => void;

  disabled?: boolean;
  size?: "small" | "medium" | "large";
  placeholder?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  "aria-label"?: string;
}

function renderBootstrapOptions(
  children: React.ReactNode,
  selectedValues: string[]
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return null;
    const el = child as React.ReactElement<any>;

    if (el.type === React.Fragment) {
      return renderBootstrapOptions(el.props.children, selectedValues);
    }
    if (el.type === "option") {
      const optValue = String(el.props.value);
      return (
        <Dropdown.Item
          key={optValue}
          eventKey={optValue}
          active={selectedValues.includes(optValue)}
          disabled={el.props.disabled}
        >
          {el.props.children}
        </Dropdown.Item>
      );
    } else if (el.type === "optgroup") {
      return (
        <React.Fragment key={el.props.label}>
          <Dropdown.Header>{el.props.label}</Dropdown.Header>
          {renderBootstrapOptions(el.props.children, selectedValues)}
        </React.Fragment>
      );
    }
    return null;
  });
}

function findLabel(children: React.ReactNode, value: string): React.ReactNode {
  let result: React.ReactNode | null = null;
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const el = child as React.ReactElement<any>;
    if (el.type === React.Fragment) {
      const inner = findLabel(el.props.children, value);
      if (inner != null) result = inner;
    } else if (el.type === "option") {
      if (el.props.value === value) result = el.props.children;
    } else if (el.type === "optgroup") {
      const inner = findLabel(el.props.children, value);
      if (inner != null) result = inner;
    }
  });
  return result ?? value;
}

export const Select: React.FC<SelectProps> = ({
  values,
  value,
  onChange,
  disabled,
  size,
  valueTitle,
  label,
  hint,
  required,
  multiselect,
  placeholder,
  children,
  style,
  "aria-label": ariaLabel,
  ...dropdownProps
}) => {
  const selectedValues = React.useMemo(() => {
    if (Array.isArray(values) && values.length > 0) return values;
    if (typeof value === "string" && value.length > 0) return [value];
    return [];
  }, [values, value]);

  const toggleContent = React.useMemo(() => {
    if (valueTitle != null && valueTitle !== "") return valueTitle;
    if (selectedValues.length === 0) return placeholder ?? "Select...";
    return selectedValues.map((v, idx) => (
      <React.Fragment key={v}>
        {idx > 0 ? ", " : null}
        {findLabel(children, v)}
      </React.Fragment>
    ));
  }, [children, placeholder, selectedValues, valueTitle]);

  const bsSize = size === "small" ? "sm" : size === "large" ? "lg" : undefined;

  const dropdown = (
    <Dropdown
      onSelect={(k) => k != null && onChange(k as string)}
      autoClose={multiselect ? "outside" : undefined}
      {...dropdownProps}
    >
      <Dropdown.Toggle
        variant="outline-secondary"
        size={bsSize}
        disabled={disabled}
        style={{ minWidth: 160, ...style }}
        aria-label={ariaLabel}
        aria-required={required || undefined}
      >
        {toggleContent}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {renderBootstrapOptions(children, selectedValues)}
      </Dropdown.Menu>
    </Dropdown>
  );

  return label ? (
    <Form.Group>
      <Form.Label>
        {label}
        {required ? " *" : null}
      </Form.Label>
      {dropdown}
      {hint ? (
        <Form.Text muted>{hint}</Form.Text>
      ) : null}
    </Form.Group>
  ) : (
    dropdown
  );
};
