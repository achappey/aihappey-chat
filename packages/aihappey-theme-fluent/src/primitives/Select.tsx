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
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
  onChange: (e: any) => void;
  disabled?: boolean;
  icon?: IconToken;
  onFilter?: (query: string) => Promise<void>;
  children: React.ReactNode;
  style?: React.CSSProperties;
  "aria-label"?: string;
}

const optionText = (children: React.ReactNode): string => React.Children.toArray(children)
  .map(child => React.isValidElement(child) ? optionText((child.props as any).children) : String(child))
  .join("");

// Filter recursively so empty groups disappear without losing selection state.
function renderFluentOptions(children: React.ReactNode, query = ""): React.ReactNode[] {
  return React.Children.toArray(children).flatMap((child): React.ReactNode[] => {
    if (!React.isValidElement(child)) return [];
    const el = child as React.ReactElement<any>;

    if (el.type === Fragment) {
      return renderFluentOptions(el.props.children, query);
    }
    if (el.type === "option") {
      const text = optionText(el.props.children);
      const searchText = `${text} ${el.props["data-search-text"] ?? el.props.value}`.toLowerCase();
      if (query && !searchText.includes(query)) return [];
      return [
        <Option key={el.props.value} value={el.props.value} text={text} disabled={el.props.disabled}>
          {el.props.children}
        </Option>,
      ];
    } else if (el.type === "optgroup") {
      const options = renderFluentOptions(el.props.children, query);
      if (!options.length) return [];
      return [
        <OptionGroup key={el.props.label} label={el.props.label}>
          {options}
        </OptionGroup>,
      ];
    }
    return [];
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
  searchable = false,
  searchPlaceholder,
  noResultsText = "No results",
  onFilter,
  onOpenChange,
  icon,
  children,
  style,
  "aria-label": ariaLabel,
  ...rest
}) => {
  const { isDarkMode } = useDarkMode();
  const IconElement = icon ? iconMap[icon as IconToken] : undefined;
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState<string | undefined>();
  const localSearch = searchable && !freeform;
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (localSearch) setQuery(val);
    else setInputValue(val);
  };

  React.useEffect(() => {
    if (freeform && onFilter) onFilter(inputValue);
  }, [inputValue, freeform]);

  const handleOptionSelect = (_: any, data: any) => {
    if (data?.optionValue !== undefined) {
      onChange(data.optionValue);
      if (freeform) setInputValue(data.optionText ?? data.optionValue);
      if (localSearch) setQuery(undefined);
    }
  };

  const options = renderFluentOptions(children, localSearch ? (query ?? "").trim().toLowerCase() : "");
  const selectedText = valueTitle ?? values?.join(", ") ?? "";
  const dropDownElement = (
    <Combobox
      {...(rest as any)}
      selectedOptions={values}
      value={freeform ? inputValue : localSearch ? query ?? selectedText : selectedText}
      placeholder={searchable ? searchPlaceholder ?? rest.placeholder : rest.placeholder}
      size={size}
      multiselect={multiselect}
      freeform={freeform}
      autoComplete="off"
      spellcheck="false"
      expandIcon={IconElement ? <IconElement /> : undefined}
      onOptionSelect={handleOptionSelect}
      disabled={disabled}
      onInput={handleInputChange}
      onOpenChange={(event, data) => {
        if (!data.open) setQuery(undefined);
        onOpenChange?.(event, data);
      }}
      style={{ backgroundColor: isDarkMode ? "#141414" : undefined, ...(label ? {} : style) }}
      aria-label={ariaLabel}
    >
      {options.length ? options : searchable ? <div role="status">{noResultsText}</div> : null}
    </Combobox>
  );

  return label ? (
    <Field label={label}
      hint={hint}
      style={style}
      required={required}>
      {dropDownElement}
    </Field>
  ) : (
    dropDownElement
  );
};
