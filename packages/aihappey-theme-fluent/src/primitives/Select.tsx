import * as React from "react";
import {
  Dropdown,
  Option,
  OptionGroup,
  Combobox,
  DropdownProps,
  Field,
} from "@fluentui/react-components";
import type { IconToken } from "aihappey-types";
import { Fragment, useState } from "react";
import { iconMap } from "./Button";
import { useDarkMode } from "usehooks-ts";

interface SelectProps
  extends Omit<DropdownProps, "children" | "onChange" | "value"> {
  values: string[];
  valueTitle?: string;
  label?: string;
  hint?: string;
  multiselect?: boolean
  required?: boolean;
  freeform?: boolean;
  onChange: (e: any) => void;
  disabled?: boolean;
  icon?: IconToken;
  onFilter?: (query: string) => Promise<void>;
  children: React.ReactNode;
  style?: React.CSSProperties;
  "aria-label"?: string;
}

// Recursively render Option/OptionGroup for Fluent
function renderFluentOptions(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return null;
    const el = child as React.ReactElement<any>;

    if (el.type === Fragment) {
      return renderFluentOptions(el.props.children);
    }
    if (el.type === "option") {
      return (
        <Option key={el.props.value} value={el.props.value}>
          {el.props.children}
        </Option>
      );
    } else if (el.type === "optgroup") {
      return (
        <OptionGroup key={el.props.label} label={el.props.label}>
          {renderFluentOptions(el.props.children)}
        </OptionGroup>
      );
    }
    return null;
  });
}

export const Select: React.FC<SelectProps> = ({
  values,
  onChange,
  multiselect,
  disabled,
  size,
  valueTitle,
  label,
  hint,
  required,
  freeform = false,
  onFilter,
  icon,
  children,
  style,
  "aria-label": ariaLabel,
  ...rest
}) => {
  const { isDarkMode } = useDarkMode();
  const IconElement = icon ? iconMap[icon as IconToken] : undefined;
  const [inputValue, setInputValue] = useState("");
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
  };

  React.useEffect(() => {
    if (freeform && onFilter) onFilter(inputValue);
  }, [inputValue, freeform]);

  const handleOptionSelect = (_: any, data: any) => {
    if (data.optionValue) {
      onChange(data.optionValue);
      if (freeform) setInputValue(data.optionText ?? data.optionValue);
    }
  };
  //{...(rest as any)}
  const dropDownElement = (
    <Combobox
      selectedOptions={values}
      value={freeform ? inputValue : valueTitle ?? values?.join(", ") ?? ""}
      size={size}
      multiselect={multiselect}
      freeform={freeform}
      autoComplete="off"
      spellcheck="false"
      expandIcon={IconElement ? <IconElement /> : undefined}
      onOptionSelect={handleOptionSelect}
      disabled={disabled}
      onInput={handleInputChange}
      style={{ backgroundColor: isDarkMode ? "#141414" : undefined, ...style }}
      aria-label={ariaLabel}
      {...(rest as any)}
    >
      {renderFluentOptions(children)}
    </Combobox>
  );

  return label ? (
    <Field label={label} hint={hint} required={required}>
      {dropDownElement}
    </Field>
  ) : (
    dropDownElement
  );
};
