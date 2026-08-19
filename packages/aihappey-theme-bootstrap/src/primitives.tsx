import {
  Placeholder as RBPlaceholder,
  Card as RBCard,
  Button as RBButton,
  Alert as RBAlert,
  Spinner as RBSpinner,
  ProgressBar as RBProgressBar,
  Form,
  Badge,
  CloseButton,
  Modal,
  Nav,
  Tab,
  Table,
  Tabs,
} from "react-bootstrap";
import type { ComponentProps, JSX } from "react";
import type { AihUiTheme, IconToken } from "aihappey-types";
import { Chat } from "./primitives/Chat";
import { Select } from "./primitives/Select";
import { Drawer } from "./primitives/Drawer";
import { Image } from "./primitives/Image";
import { Range, Slider } from "./primitives/Slider";
import { Carousel } from "./primitives/Carousel";
import React from "react";

// Typography primitives
const Header = ({
  level = 1,
  className,
  children,
}: {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  children: React.ReactNode;
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return <Tag className={className}>{children}</Tag>;
};

import { UserMenu } from "./primitives/UserMenu";
import { Toolbar, ToolbarButton, ToolbarDivider } from "./primitives/Toolbar";
import { Navigation } from "./primitives/Navigation";
import Tags from "./primitives/Tags";
import { SearchBox } from "./primitives/SearchBox";
import { Menu } from "./primitives/Menu";
import { Toast } from "./primitives/Toast";
import { Breadcrumb } from "./primitives/Breadcrumb";
import { DataGrid } from "./primitives/DataGrid";
import { JsonViewer } from "./primitives/JsonViewer";
import { Toaster } from "./primitives/Toaster";
import { iconMap } from "./primitives/IconMap";
import { SplitButton } from "./primitives/SplitButton";
import { X } from "react-bootstrap-icons";
import { BootstrapSettings } from "./primitives/BootstrapSettings";
import { AudioPlayer } from "./primitives/AudioPlayer";
import { Text as TextPrimitive } from "./primitives/Text";
import { Accordion } from "./primitives/Accordion";
import { AvatarGroup } from "./primitives/AvatarGroup";
import { useDarkMode } from "usehooks-ts";

const TextArea = React.forwardRef<HTMLTextAreaElement, any>(({ rows, readOnly, value, onChange, style, className, ...rest }, ref) => {
  const { isDarkMode } = useDarkMode();

  return (
    <Form.Control
      as="textarea"
      rows={rows}
      ref={ref}
      disabled={readOnly}
      value={value}
      className={className}
      style={{
        ...style,
        backgroundColor: isDarkMode ? "#1b1f22" : "rgb(248, 249, 250)",
        color: isDarkMode ? "#ffffff" : undefined,
        borderColor: isDarkMode ? "#495057" : undefined
      }}
      onChange={(e) => onChange?.(e.target.value)}
      {...rest}
    />
  );
});

const BootstrapTabs = (props: Parameters<AihUiTheme["Tabs"]>[0]): JSX.Element => {
  const { activeKey, onSelect, vertical, fill, className, style, children, ...rest } = props;
  const handleSelect = (k: string | null) => {
    if (onSelect && typeof onSelect === "function" && k) {
      onSelect(k as string);
    }
  };

  if (!vertical) {
    return (
      <Tabs
        {...(rest as any)}
        activeKey={activeKey}
        className={className}
        fill={fill}
        style={style}
        onSelect={handleSelect}
      >
        {children}
      </Tabs>
    );
  }

  const tabItems = React.Children.toArray(children).filter(
    React.isValidElement
  ) as React.ReactElement<any>[];
  const activeTab = tabItems.find((child) => child.props.eventKey === activeKey);

  return (
    <Tab.Container activeKey={activeKey} onSelect={handleSelect}>
      <div
        className={className}
        style={{
          display: "flex",
          gap: 16,
          width: "100%",
          ...style,
        }}
      >
        <Nav
          variant="pills"
          className="flex-column flex-shrink-0"
          style={{ minWidth: 220 }}
          role="tablist"
        >
          {tabItems.map((child) => {
            const { eventKey, title, icon, disabled } = child.props;
            return (
              <Nav.Item key={eventKey}>
                <Nav.Link
                  eventKey={eventKey}
                  disabled={disabled}
                  className="d-flex align-items-center gap-2"
                >
                  {icon && iconMap[icon as IconToken]}
                  <span>{title}</span>
                </Nav.Link>
              </Nav.Item>
            );
          })}
        </Nav>
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeTab?.props.children}
        </div>
      </div>
    </Tab.Container>
  );
};

export const bootstrapTheme: AihUiTheme = {
  AvatarGroup,
  Header,
  DataGrid,
  JsonViewer,
  AudioPlayer,
  Accordion,
  Breadcrumb,
  Skeleton: ({
    width,
    height,
    circle,
    animation = "pulse",
    className,
    style,
  }: {
    width?: number | string;
    height?: number | string;
    circle?: boolean;
    animation?: "pulse" | "wave";
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <RBPlaceholder
      as="span"
      animation={animation === "wave" ? "wave" : "glow"}
      className={className}
      style={{
        ...style,
        ...(width != null ? { width } : {}),
        ...(height != null ? { height } : {}),
        ...(circle ? { borderRadius: "50%" } : {}),
        display: "inline-block",
        overflow: "hidden",
      }}
    >
      <RBPlaceholder
        as="span"
        xs={12}
        bg="secondary"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          minHeight: height == null && style?.height == null ? "1em" : undefined,
          ...(circle ? { borderRadius: "50%" } : {}),
        }}
      />
    </RBPlaceholder>
  ),
  Toast,
  SplitButton,
  Toaster,
  ToggleButton: ({
    checked = false,
    onClick,
    variant = "primary",
    size,
    icon,
    iconPosition = "left",
    children,
    className,
    style,
    ...rest
  }: ComponentProps<"button"> & {
    checked?: boolean;
    onClick?: any;
    variant?: string;
    size?: string;
    icon?: IconToken;
    iconPosition?: "left" | "right";
    children?: React.ReactNode;
  }): JSX.Element => {
    const isSubtle = variant === "subtle" || variant === "transparent";
    const hasChildren = React.Children.count(children) > 0;
    const mappedVariant = isSubtle
      ? checked
        ? "primary"
        : "link"
      : checked
        ? variant
        : `outline-${variant}`;
    const buttonSize = size === "large" ? undefined : size as any;
    const iconOnlyExtent = size === "large" ? 42 : 38;
    const iconOnlyStyles: React.CSSProperties | undefined = icon && !hasChildren
      ? {
        width: iconOnlyExtent,
        height: iconOnlyExtent,
        padding: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }
      : undefined;
    const buttonClassName = [
      className,
      isSubtle && !checked ? "text-body text-decoration-none" : undefined,
    ].filter(Boolean).join(" ") || undefined;

    return (
      <RBButton
        variant={mappedVariant}
        size={buttonSize}
        onClick={onClick}
        aria-pressed={checked}
        {...(rest as any)}
        className={buttonClassName}
        style={{
          ...iconOnlyStyles,
          ...(style ?? {}),
        }}
      >
        {icon && iconPosition === "left" && (
          <span className={hasChildren ? "me-2" : undefined}>{iconMap[icon]}</span>
        )}
        {children}
        {icon && iconPosition === "right" && (
          <span className={hasChildren ? "ms-2" : undefined}>{iconMap[icon]}</span>
        )}
      </RBButton>
    );
  },
  Button: ({
    variant = "primary",
    size,
    icon,
    iconPosition = "left",
    children,
    ...rest
  }: ComponentProps<"button"> & {
    variant?: string;
    size?: string;
    icon?: IconToken;
    iconPosition?: "left" | "right";
    children?: React.ReactNode;
  }): JSX.Element => {
    const isSubtle = variant === "subtle";
    const hasChildren = React.Children.count(children) > 0;
    const mappedVariant = isSubtle ? "link" : variant;
    const buttonSize = size === "large" ? undefined : size as any;
    const iconOnlyExtent = size === "large" ? 42 : 38;
    const iconOnlyStyles: React.CSSProperties | undefined = icon && !hasChildren
      ? {
        width: iconOnlyExtent,
        height: iconOnlyExtent,
        padding: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }
      : undefined;
    const className = [
      (rest as any).className,
      isSubtle ? "text-body text-decoration-none" : undefined,
    ].filter(Boolean).join(" ") || undefined;

    return (
      <RBButton
        variant={mappedVariant}
        size={buttonSize}
        {...(rest as any)}
        className={className}
        style={{
          ...iconOnlyStyles,
          ...((rest as any).style ?? {}),
        }}
      >
        {icon && iconPosition === "left" && (
          <span className={hasChildren ? "me-2" : undefined}>{iconMap[icon]}</span>
        )}
        {children}
        {icon && iconPosition === "right" && (
          <span className={hasChildren ? "ms-2" : undefined}>{iconMap[icon]}</span>
        )}
      </RBButton>
    );
  },
  UserMenu,
  Select,
  Navigation: Navigation as any,
  SearchBox: SearchBox as any,
  Tags: Tags as any,
  ToolbarButton: ToolbarButton as any,
  ToolbarDivider: ToolbarDivider as any,
  Menu: Menu as any,
  Image,
  ThemeSettings: BootstrapSettings,
  Alert: ({ variant, className, title, onDismiss, children }): JSX.Element => (
    <>
      <RBAlert variant={variant == "error" ? "danger" : variant as any} className={className}>
        <RBAlert.Heading>{title}</RBAlert.Heading>
        {children}

        {onDismiss && <div className="d-flex justify-content-end">
          <RBButton onClick={onDismiss} variant="light">
            <X />
          </RBButton>
        </div>}

      </RBAlert>
    </>
  ),
  Text: TextPrimitive,
  Spinner: ({ size = "sm", className }): JSX.Element => (
    <RBSpinner animation="border" size={size as any} className={className} />
  ),

  ProgressBar: ({
    value,
    label,
    variant,
    striped,
    animated,
    className,
  }: {
    value?: number;
    label?: string;
    variant?: string;
    striped?: boolean;
    animated?: boolean;
    className?: string;
  }) => {
    const now = value ?? (animated ? 100 : 0);

    return (
      <RBProgressBar
        now={now}
        label={label}
        variant={variant as any}
        striped={striped ?? animated}
        animated={animated}
        className={className}
      />
    );
  },
  Modal: (props) => {
    // Only allow "sm" | "lg" | "xl" for size
    const { size, title, children, actions, contentClassName, ...rest } = props as any;
    const { isDarkMode } = useDarkMode();
    const allowed =
      size === "sm" || size === "lg" || size === "xl" ? size : undefined;
    const modalContentClassName = ["bg-body", "text-body", contentClassName]
      .filter(Boolean)
      .join(" ");
    return (
      <Modal size={allowed} contentClassName={modalContentClassName} data-bs-theme={isDarkMode ? "dark" : "light"} {...rest}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{children}</Modal.Body>
        {actions && <Modal.Footer>{actions}</Modal.Footer>}
      </Modal>
    );
  },
  Tabs: BootstrapTabs,
  Tab: ({ icon, title, ...props }: any) => (
    <Tab
      {...props}
      title={icon ? <span className="d-inline-flex align-items-center gap-2">{iconMap[icon as IconToken]}{title}</span> : title}
    />
  ),
  Badge: ({ icon, text, children, ...props }: any) => (
    <Badge {...props}>
      {icon ? <span className="me-1">{iconMap[icon as IconToken]}</span> : null}
      {children ?? text}
    </Badge>
  ),
  Table: (props) => <Table {...props} />,
  CloseButton: (props) => <CloseButton {...props} />,

  Chat,

  // Added Switch primitive
  Switch: ({ id, label, checked, onChange, className }) => (
    <Form.Check
      type="switch"
      id={id}
      label={label}
      checked={checked}
      className={className}
      onChange={(e) => onChange(e.target.checked)}
    />
  ),
  TextArea: TextArea as any,
  //TextArea: (props) => <TextArea {...props} />,
  // Added TextArea primitive
  /*TextArea: ({ rows, readOnly, value, onChange, style, className }) => (
    
    <Form.Control
      as="textarea"
      rows={rows}
      disabled={readOnly}
      value={value}
      style={style}
      className={className}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  ),
*/
  Card: ({
    title,
    text,
    headerActions,
    children,
    actions,
  }: {
    title: string;
    text?: string;
    headerActions?: JSX.Element,
    children?: React.ReactNode;
    actions?: JSX.Element;
  }): JSX.Element => (
    <RBCard>
      {headerActions && <RBCard.Header>{headerActions}</RBCard.Header>}
      <RBCard.Body>
        <RBCard.Title>{title}</RBCard.Title>
        <RBCard.Text>{children ?? text}</RBCard.Text>
      </RBCard.Body>
      {actions && <RBCard.Footer className="text-muted">{actions}</RBCard.Footer>}
    </RBCard>
  ),

  Drawer,
  Toolbar: Toolbar as any,

  Input: (props: ComponentProps<"input"> & {
    label?: string;
    orientation?: "horizontal" | "vertical";
    hint?: string;
  }): JSX.Element => {
    // Only pass string size ("sm" | "lg") if present, not number
    const { size, value, label, hint, ...rest } = props;
    const sizeProp =
      typeof size === "string" && (size === "sm" || size === "lg")
        ? size
        : undefined;
    // Convert readonly string[] to string[] if needed
    let valueProp = value;
    if (Array.isArray(value) && Object.isFrozen(value)) {
      valueProp = Array.from(value);
    }
    // Only pass value if not a readonly array, to avoid TS error
    if (Array.isArray(valueProp) && Object.isFrozen(valueProp)) {
      return <Form.Control {...(rest as any)} size={sizeProp} />;
    }
    return (
      <Form.Group controlId={label}>
        <Form.Label>{label}</Form.Label>
        <Form.Control
          {...(rest as any)}
          size={sizeProp}
          value={valueProp as string | number | string[] | undefined}
        />
        <Form.Text id="emailHelp" muted>
          {hint}
        </Form.Text>
      </Form.Group>
    );
  },
  Carousel,
  Slider,
  Range,
};
