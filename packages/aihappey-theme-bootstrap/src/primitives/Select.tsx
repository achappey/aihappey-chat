import * as React from "react";
import { createPortal } from "react-dom";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";

type BootstrapDropdownProps = Omit<
  React.ComponentProps<typeof Dropdown>,
  "children" | "onSelect"
>;

type BootstrapDropdownMenuProps = React.ComponentProps<typeof Dropdown.Menu>;

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
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;

  /** Called with the clicked option value (string). */
  onChange: (val: string) => void;

  disabled?: boolean;
  size?: "small" | "medium" | "large";
  placeholder?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  "aria-label"?: string;
}

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string | undefined {
  const value = classNames.filter(Boolean).join(" ");
  return value || undefined;
}

const PortalDropdownMenu: React.FC<BootstrapDropdownMenuProps & {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}> = ({
  children,
  anchorRef,
  ...props
}) => {
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    // Stay outside clipping form containers, but inside a modal's focus trap.
    setPortalContainer(anchorRef.current?.closest<HTMLElement>('[role="dialog"]') ?? document.body);
  }, [anchorRef]);

  const menu = <Dropdown.Menu {...props}>{children}</Dropdown.Menu>;

  return portalContainer ? createPortal(menu, portalContainer) : menu;
};

const optionText = (children: React.ReactNode): string => React.Children.toArray(children)
  .map(child => React.isValidElement(child) ? optionText((child.props as any).children) : String(child))
  .join("");

function renderBootstrapOptions(
  children: React.ReactNode,
  selectedValues: string[],
  query = ""
): React.ReactNode[] {
  return React.Children.toArray(children).flatMap((child): React.ReactNode[] => {
    if (!React.isValidElement(child)) return [];
    const el = child as React.ReactElement<any>;

    if (el.type === React.Fragment) {
      return renderBootstrapOptions(el.props.children, selectedValues, query);
    }
    if (el.type === "option") {
      const optValue = String(el.props.value);
      const searchText = `${optionText(el.props.children)} ${el.props["data-search-text"] ?? optValue}`.toLowerCase();
      if (query && !searchText.includes(query)) return [];
      return [
        <Dropdown.Item
          key={optValue}
          eventKey={optValue}
          active={selectedValues.includes(optValue)}
          disabled={el.props.disabled}
        >
          {el.props.children}
        </Dropdown.Item>,
      ];
    } else if (el.type === "optgroup") {
      const options = renderBootstrapOptions(el.props.children, selectedValues, query);
      if (!options.length) return [];
      return [
        <React.Fragment key={el.props.label}>
          <Dropdown.Header>{el.props.label}</Dropdown.Header>
          {options}
        </React.Fragment>,
      ];
    }
    return [];
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
  searchable = false,
  searchPlaceholder = "Search...",
  noResultsText = "No results",
  onToggle,
  children,
  style,
  "aria-label": ariaLabel,
  ...dropdownProps
}) => {
  const { className: dropdownClassName, ...restDropdownProps } = dropdownProps;
  const toggleRef = React.useRef<HTMLButtonElement | null>(null);
  const [menuMinWidth, setMenuMinWidth] = React.useState<number>();
  const [query, setQuery] = React.useState("");

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
  const options = renderBootstrapOptions(children, selectedValues, searchable ? query.trim().toLowerCase() : "");

  React.useEffect(() => {
    const toggle = toggleRef.current;
    if (!toggle) return;

    const updateMenuMinWidth = () => {
      const nextWidth = Math.ceil(toggle.getBoundingClientRect().width);
      setMenuMinWidth((previousWidth) => (
        previousWidth === nextWidth ? previousWidth : nextWidth
      ));
    };

    updateMenuMinWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateMenuMinWidth);
      return () => window.removeEventListener("resize", updateMenuMinWidth);
    }

    const observer = new ResizeObserver(updateMenuMinWidth);
    observer.observe(toggle);
    window.addEventListener("resize", updateMenuMinWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateMenuMinWidth);
    };
  }, []);

  const dropdown = (
    <Dropdown
      {...restDropdownProps}
      className={joinClassNames("aihappey-bootstrap-select", dropdownClassName)}
      onSelect={(k) => k != null && onChange(k as string)}
      onToggle={(show, metadata) => {
        if (!show) setQuery("");
        onToggle?.(show, metadata);
      }}
      autoClose={multiselect ? "outside" : undefined}
    >
      <Dropdown.Toggle
        ref={toggleRef}
        variant="outline-secondary"
        size={bsSize}
        disabled={disabled}
        style={{ minWidth: 160, ...style }}
        aria-label={ariaLabel}
        aria-required={required || undefined}
      >
        {toggleContent}
      </Dropdown.Toggle>
      <PortalDropdownMenu
        anchorRef={toggleRef}
        className="aihappey-bootstrap-select-menu"
        popperConfig={{ strategy: "fixed" }}
        style={
          menuMinWidth != null
            ? { "--aihappey-bootstrap-select-menu-min-width": `${menuMinWidth}px` } as React.CSSProperties
            : undefined
        }
      >
        {searchable ? (
          <div style={{ padding: "0.25rem 0.5rem" }}>
            <Form.Control
              type="search"
              value={query}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              autoComplete="off"
              autoFocus
              disabled={disabled}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                // Dropdown intentionally ignores key navigation from inputs.
                // Move focus into the filtered menu explicitly; native item
                // keyboard activation and subsequent navigation stay intact.
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  event.stopPropagation();
                  const items = event.currentTarget.closest(".dropdown-menu")
                    ?.querySelectorAll<HTMLElement>(".dropdown-item:not(.disabled):not(:disabled)");
                  const item = event.key === "ArrowDown" ? items?.[0] : items?.[items.length - 1];
                  item?.focus();
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleRef.current?.click();
                } else if (event.key !== "Tab") {
                  event.stopPropagation();
                }
              }}
            />
          </div>
        ) : null}
        {options.length ? options : searchable ? <div role="status" style={{ padding: "0.25rem 1rem" }}>{noResultsText}</div> : null}
      </PortalDropdownMenu>
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
