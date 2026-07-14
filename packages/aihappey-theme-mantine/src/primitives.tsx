import * as React from "react";
import {
  Accordion as MantineAccordion,
  ActionIcon,
  Alert as MantineAlert,
  Avatar,
  Badge as MantineBadge,
  Box,
  Breadcrumbs,
  Button as MantineButton,
  Card as MantineCard,
  CloseButton as MantineCloseButton,
  Divider,
  Drawer as MantineDrawer,
  Group,
  Image as MantineImage,
  Indicator,
  Input as MantineInput,
  Menu as MantineMenu,
  Modal as MantineModal,
  MultiSelect as MantineMultiSelect,
  NavLink,
  Paper,
  Progress,
  RangeSlider as MantineRangeSlider,
  ScrollArea,
  Select as MantineSelect,
  Skeleton as MantineSkeleton,
  Slider as MantineSlider,
  Stack,
  Switch as MantineSwitch,
  Table as MantineTable,
  Tabs as MantineTabs,
  Text as MantineText,
  Textarea,
  Tooltip,
  UnstyledButton,
  type MantineColor,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { format } from "timeago.js";
import type {
  AccordionProps,
  AihUiTheme,
  AvatarGroupComponent,
  AvatarGroupItemProps,
  AvatarGroupPopoverProps,
  AvatarGroupProps,
  AvatarProps,
  ChatMessage,
  DataGridProps,
  IconToken,
  MenuItemProps,
  MenuProps,
  NavigationItem,
  SplitButtonMenuItem,
} from "aihappey-types";
import type { TextProps } from "aihappey-types/src/theme/Text";
import type { ToastProps } from "aihappey-types/src/theme/Toast";
import type { UserMenuProps } from "aihappey-types/src/theme/UserMenu";

type IconProps = { size?: number | string; style?: React.CSSProperties };
type IconComponent = (props: IconProps) => React.JSX.Element;
type SelectOptionData = { type: "option"; value: string; label: string; disabled?: boolean };
type SelectGroupData = { type: "group"; group: string; items: SelectOptionData[] };
type SelectNodeData = SelectOptionData | SelectGroupData;

const iconStyle: React.CSSProperties = { display: "inline-block", lineHeight: 1 };

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
        group: String(element.props.label ?? ""),
        items: flattenSelectOptions(parseSelectNodes(element.props.children)),
      });
    }
  });

  return out;
}

function flattenSelectOptions(nodes: SelectNodeData[]): SelectOptionData[] {
  const out: SelectOptionData[] = [];

  for (const node of nodes) {
    if (node.type === "option") out.push(node);
    else out.push(...node.items);
  }

  return out;
}

function toMantineSelectData(nodes: SelectNodeData[]) {
  return nodes.map((node) => {
    if (node.type === "option") {
      const { type, ...option } = node;
      return option;
    }

    return {
      group: node.group,
      items: node.items.map(({ type, ...option }) => option),
    };
  });
}

function getChangedMultiSelectValue(previous: string[], next: string[]) {
  return next.find((item) => !previous.includes(item)) ?? previous.find((item) => !next.includes(item)) ?? "";
}

function makeIcon(symbol: React.ReactNode): IconComponent {
  return ({ size = 16, style }) => (
    <span aria-hidden style={{ ...iconStyle, fontSize: size, width: size, height: size, ...style }}>
      {symbol}
    </span>
  );
}

export const iconMap: Record<IconToken, IconComponent> = {
  add: makeIcon("+"),
  edit: makeIcon("✎"),
  delete: makeIcon("🗑"),
  send: makeIcon("➤"),
  robot: makeIcon("🤖"),
  jobs: makeIcon("💼"),
  customize: makeIcon("⚙"),
  trending: makeIcon("↗"),
  mcpServer: makeIcon("🔌"),
  prompts: makeIcon("✨"),
  search: makeIcon("⌕"),
  check: makeIcon("✓"),
  eye: makeIcon("👁"),
  completed: makeIcon("✓"),
  image: makeIcon("▧"),
  cardList: makeIcon("☷"),
  chat: makeIcon("💬"),
  aiImage: makeIcon("▧"),
  table: makeIcon("▦"),
  transcription: makeIcon("🎙"),
  language: makeIcon("文"),
  model_provider: makeIcon("◉"),
  gateway_router: makeIcon("⇄"),
  inference_compute: makeIcon("◎"),
  media_voice: makeIcon("🔊"),
  search_data: makeIcon("▣"),
  app_tools: makeIcon("▤"),
  storage: makeIcon("▣"),
  endpoint: makeIcon("⇥"),
  client: makeIcon("▢"),
  providers: makeIcon("🔌"),
  speech: makeIcon("🔊"),
  skills: makeIcon("✦"),
  speechSettings: makeIcon("⚙"),
  transcriptionSettings: makeIcon("⚙"),
  imageSettings: makeIcon("⚙"),
  videoSettings: makeIcon("⚙"),
  video: makeIcon("▶"),
  videos: makeIcon("▶"),
  structuredOutputs: makeIcon("{}"),
  webApps: makeIcon("▢"),
  components: makeIcon("▦"),
  reranking: makeIcon("⇅"),
  labs: makeIcon("⚗"),
  rerankingSettings: makeIcon("⚙"),
  realtime: makeIcon("●"),
  realtimeSettings: makeIcon("⚙"),
  catalog: makeIcon("▥"),
  brain: makeIcon("◌"),
  download: makeIcon("↓"),
  print: makeIcon("⎙"),
  pricing: makeIcon("$"),
  explainTool: makeIcon("✦"),
  mail: makeIcon("✉"),
  theme: makeIcon("◒"),
  formula: makeIcon("ƒ"),
  chatSettings: makeIcon("⚙"),
  databaseGear: makeIcon("▣"),
  code: makeIcon("</>"),
  chart: makeIcon("▥"),
  arena: makeIcon("👥"),
  openLink: makeIcon("↗"),
  attachment: makeIcon("📎"),
  warning: makeIcon("⚠"),
  stop: makeIcon("■"),
  up: makeIcon("↑"),
  down: makeIcon("↓"),
  resources: makeIcon("▤"),
  images: makeIcon("▧"),
  folder: makeIcon("▰"),
  priority: makeIcon("!"),
  temperature: makeIcon("℃"),
  dismiss: makeIcon("×"),
  agentSettings: makeIcon("⚙"),
  preview: makeIcon("👁"),
  navigationMenu: makeIcon("☰"),
  contextMenu: makeIcon("⋮"),
  globe: makeIcon("◎"),
  connect: makeIcon("🔌"),
  refresh: makeIcon("↻"),
  sequential: makeIcon("→"),
  concurrent: makeIcon("⇄"),
  groupchat: makeIcon("👥"),
  handoff: makeIcon("↪"),
  disconnect: makeIcon("⍉"),
  contextWindow: makeIcon("▣"),
  docs: makeIcon("▤"),
  terms: makeIcon("§"),
  privacy: makeIcon("◈"),
  console: makeIcon(">_"),
  maxOutputTokens: makeIcon("↓"),
  panelExpand: makeIcon("▸"),
  panelContract: makeIcon("◂"),
  bookOpen: makeIcon("▤"),
  toolResult: makeIcon("{}"),
  server: makeIcon("▣"),
  copyClipboard: makeIcon("⧉"),
  connector: makeIcon("🔌"),
  link: makeIcon("🔗"),
  tool: makeIcon("🔧"),
  personalization: makeIcon("⚙"),
  settings: makeIcon("⚙"),
  sources: makeIcon("🔗"),
  chevronDown: makeIcon("⌄"),
  chevronUp: makeIcon("⌃"),
  chevronLeft: makeIcon("‹"),
  chevronRight: makeIcon("›"),
  logout: makeIcon("⇥"),
  star: makeIcon("☆"),
  starFilled: makeIcon("★"),
};

function renderIcon(icon?: IconToken, size = 16) {
  const Icon = icon ? iconMap[icon] : undefined;
  return Icon ? <Icon size={size} /> : undefined;
}

function mapButtonVariant(variant?: string): any {
  if (variant === "outline") return "outline";
  if (variant === "ghost" || variant === "subtle") return "subtle";
  if (variant === "transparent") return "transparent";
  if (variant === "secondary") return "default";
  return "filled";
}

function mapColor(variant?: string): MantineColor | undefined {
  if (variant === "danger" || variant === "destructive" || variant === "error") return "red";
  if (variant === "success") return "green";
  if (variant === "warning") return "yellow";
  if (variant === "secondary") return "gray";
  if (variant === "informative" || variant === "info") return "blue";
  return undefined;
}

function mapSize(size?: string): any {
  if (size === "large" || size === "lg") return "lg";
  if (size === "small" || size === "sm") return "sm";
  return "sm";
}

function mapActionIconSize(size?: string): any {
  if (size === "large" || size === "lg") return "md";
  if (size === "small" || size === "sm") return "sm";
  return "sm";
}

export const Button = ({ variant = "primary", size, icon, iconPosition = "left", children, style, ...rest }: any) => {
  const hasChildren = React.Children.count(children) > 0;
  const leftSection = icon && iconPosition === "left" ? renderIcon(icon) : undefined;
  const rightSection = icon && iconPosition === "right" ? renderIcon(icon) : undefined;

  if (icon && !hasChildren) {
    return (
      <ActionIcon
        variant={mapButtonVariant(variant) as any}
        color={mapColor(variant)}
        size={mapActionIconSize(size)}
        style={{ flex: "0 0 auto", ...style }}
        title={rest.title}
        aria-label={rest["aria-label"] ?? rest.title ?? String(icon)}
        {...rest}
      >
        {renderIcon(icon, size === "large" || size === "lg" ? 17 : 15)}
      </ActionIcon>
    );
  }

  return (
    <MantineButton
      variant={mapButtonVariant(variant)}
      color={mapColor(variant)}
      size={mapSize(size)}
      leftSection={leftSection}
      rightSection={rightSection}
      style={style}
      {...rest}
    >
      {children}
    </MantineButton>
  );
};

export const ToggleButton = ({ checked = false, variant, ...props }: any) => (
  <Button variant={checked ? variant ?? "primary" : "outline"} aria-pressed={checked} data-state={checked ? "on" : "off"} {...props} />
);

export const CloseButton = (props: any) => <MantineCloseButton {...props} />;

export const Header = ({ level = 1, className, children }: any) => {
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  return <Tag className={className}>{children}</Tag>;
};

export const Text = ({ as = "span", wrap = true, italic, weight, align, truncate, underline, strikethrough, block, font, size, children, style }: TextProps) => (
  <MantineText
    component={as as any}
    fs={italic ? "italic" : undefined}
    fw={weight === "bold" ? 700 : weight === "semibold" ? 600 : weight === "medium" ? 500 : undefined}
    ta={align}
    td={underline ? "underline" : strikethrough ? "line-through" : undefined}
    truncate={truncate}
    ff={font === "monospace" ? "monospace" : undefined}
    size={size ? `${Math.max(10, size / 10)}px` : undefined}
    style={{ display: block ? "block" : undefined, whiteSpace: wrap ? undefined : "nowrap", ...style }}
  >
    {children}
  </MantineText>
);

export const Input = ({ label, hint, orientation, required, size, ...rest }: any) => (
  <MantineInput.Wrapper label={label} description={hint} required={required} withAsterisk={required} style={rest.style}>
    <MantineInput {...rest} style={undefined} size={mapSize(size)} />
  </MantineInput.Wrapper>
);

export const TextArea = ({ label, hint, required, rows, readOnly, value, onChange, style, className, ...rest }: any) => (
  <Textarea
    label={label}
    description={hint}
    required={required}
    rows={rows}
    readOnly={readOnly}
    value={value}
    className={className}
    style={style}
    onChange={(event) => onChange?.(event.currentTarget.value)}
    {...rest}
  />
);

export const Select = ({ value, values, onChange, label, hint, required, children, disabled, placeholder, size, multiselect, ...rest }: any) => {
  const nodes = React.useMemo(() => parseSelectNodes(children), [children]);
  const data = React.useMemo(() => toMantineSelectData(nodes), [nodes]);

  const selected = Array.isArray(values) ? values[0] : value;
  if (multiselect) {
    const selectedValues = Array.isArray(values) ? values : value ? [value] : [];
    return (
      <MantineMultiSelect
        label={label}
        description={hint}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        data={data}
        value={selectedValues}
        size={mapSize(size)}
        onChange={(next) => onChange?.(getChangedMultiSelectValue(selectedValues, next))}
        {...rest}
      />
    );
  }

  return (
    <MantineSelect
      label={label}
      description={hint}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      data={data}
      value={selected ?? null}
      size={mapSize(size)}
      onChange={(next) => onChange?.(next ?? "")}
      {...rest}
    />
  );
};

export const SearchBox = ({ value, onChange, placeholder, className, autoFocus }: any) => (
  <MantineInput
    value={value}
    placeholder={placeholder}
    className={className}
    autoFocus={autoFocus}
    leftSection={renderIcon("search")}
    onChange={(event) => onChange(event.currentTarget.value)}
  />
);

export const Alert = ({ variant, title, onDismiss, className, children }: any) => (
  <MantineAlert color={mapColor(variant) ?? (variant === "info" ? "blue" : undefined)} title={title} className={className} withCloseButton={!!onDismiss} onClose={onDismiss}>
    {children}
  </MantineAlert>
);

export const Spinner = ({ size = "sm", label, className }: any) => <MantineText className={className}>{label ? `${label} ` : null}<span aria-busy="true">…</span></MantineText>;

export const ProgressBar = ({ value, label, variant, striped, animated, className }: any) => (
  <Box className={className}>
    <Progress value={value ?? (animated ? 100 : 0)} color={mapColor(variant)} striped={striped ?? animated} animated={animated} />
    {label ? <MantineText size="xs" mt={4}>{label}</MantineText> : null}
  </Box>
);

export const Skeleton = (props: any) => <MantineSkeleton {...props} radius={props.circle ? "50%" : props.radius} />;

export const Card = ({ title, text, description, image, headerActions, children, actions, className, style, selected }: any) => (
  <MantineCard withBorder shadow={selected ? "md" : "sm"} className={className} style={style}>
    {image}
    <Group justify="space-between" align="flex-start" mb="xs">
      <MantineText fw={600}>{title}</MantineText>
      {headerActions}
    </Group>
    {description ? <MantineText c="dimmed" size="sm" mb="xs">{description}</MantineText> : null}
    {children ?? (text ? <MantineText size="sm">{text}</MantineText> : null)}
    {actions ? <Group mt="md">{actions}</Group> : null}
  </MantineCard>
);

export const Accordion = ({ items, openItems, defaultOpenItems, onToggle, multiple, variant, className, style }: AccordionProps) => (
  <MantineAccordion
    multiple={multiple}
    value={openItems as any}
    defaultValue={defaultOpenItems as any}
    onChange={(next) => onToggle?.(Array.isArray(next) ? next : next ? [next] : [])}
    variant={variant === "flush" ? "contained" : "default"}
    className={className}
    style={style}
  >
    {items.map((item) => (
      <MantineAccordion.Item key={item.key} value={item.key} className={item.className}>
        <MantineAccordion.Control disabled={item.disabled}>{item.header}</MantineAccordion.Control>
        <MantineAccordion.Panel>{item.content}</MantineAccordion.Panel>
      </MantineAccordion.Item>
    ))}
  </MantineAccordion>
);

export const Modal = ({
  title,
  children,
  actions,
  isOpen,
  open,
  show,
  onClose,
  onHide,
  onOpenChange,
  size,
  centered,
  modalType,
  ...rest
}: any) => {
  const opened = !!(show ?? open ?? isOpen);
  const handleClose = () => {
    onOpenChange?.(false);
    onClose?.();
    onHide?.();
  };

  return (
    <MantineModal
      opened={opened}
      onClose={handleClose}
      title={title}
      size={size === "large" ? "lg" : size === "small" ? "sm" : size}
      centered={centered}
      closeOnClickOutside={modalType !== "alert"}
      {...rest}
    >
      {children}
      {actions ? <Group justify="flex-end" mt="md">{actions}</Group> : null}
    </MantineModal>
  );
};

export const Drawer = ({ open, onClose, title, children, headerNavigation, position = "end", size = "small" }: any) => (
  <MantineDrawer opened={open} onClose={onClose} title={title} position={position === "start" ? "left" : position === "end" ? "right" : position} size={size === "small" ? "sm" : size === "medium" ? "md" : size === "large" ? "lg" : "100%"}>
    {headerNavigation}
    {children}
  </MantineDrawer>
);

export const Tabs = ({ activeKey, onSelect, vertical, fill, children, className, style }: any) => (
  <MantineTabs value={activeKey} onChange={(key) => key && onSelect?.(key)} orientation={vertical ? "vertical" : "horizontal"} className={className} style={style}>
    <MantineTabs.List grow={fill}>{React.Children.map(children, (child) => React.isValidElement<any>(child) ? <MantineTabs.Tab value={child.props.eventKey} disabled={child.props.disabled} leftSection={renderIcon(child.props.icon)}>{child.props.title}</MantineTabs.Tab> : null)}</MantineTabs.List>
    {React.Children.map(children, (child) => React.isValidElement<any>(child) ? <MantineTabs.Panel value={child.props.eventKey} pt="sm">{child.props.children}</MantineTabs.Panel> : null)}
  </MantineTabs>
);

export const Tab = ({ children }: any) => <>{children}</>;

function mapBadgeSize(size?: string): any {
  if (size === "large" || size === "lg") return "md";
  if (size === "extra-small" || size === "xs") return "xs";
  if (size === "medium" || size === "md") return "md";
  return "sm";
}

function mapBadgeVariant(appearance?: string, variant?: string): any {
  if (variant === "outline" || appearance === "outline") return "outline";
  if (appearance === "ghost" || appearance === "subtle" || appearance === "tint") return "light";
  return variant ?? "light";
}

export const Badge = ({ bg, color, appearance, variant, size, icon, text, children, style, ...rest }: any) => (
  <MantineBadge
    color={mapColor(color ?? bg) ?? color ?? bg}
    variant={mapBadgeVariant(appearance, variant)}
    size={mapBadgeSize(size)}
    radius="xl"
    leftSection={icon ? <Box component="span" style={{ display: "inline-flex", alignItems: "center", lineHeight: 1 }}>{renderIcon(icon, 12)}</Box> : undefined}
    style={{ textTransform: "none", letterSpacing: 0, fontWeight: 650, verticalAlign: "middle", ...style }}
    {...rest}
  >
    {children ?? text}
  </MantineBadge>
);

export const Table = ({ striped, bordered, hover, children, className }: any) => <MantineTable striped={striped} withTableBorder={bordered} highlightOnHover={hover} className={className}>{children}</MantineTable>;

export const Switch = ({ id, label, checked, onChange, className, disabled }: any) => <MantineSwitch id={id} label={label} checked={checked} disabled={disabled} className={className} onChange={(event) => onChange?.(event.currentTarget.checked)} />;

export const Image = ({ fit, ...props }: any) => <MantineImage fit={fit === "default" ? undefined : fit} {...props} />;

export const Slider = ({ value, min, max, step, onChange, label, marks, disabled, className, style }: any) => (
  <Box className={className} style={style}>
    {label ? <MantineText size="sm">{label}</MantineText> : null}
    <MantineSlider value={value} min={min} max={max} step={step} onChange={onChange} marks={marks} disabled={disabled} />
  </Box>
);

export const Range = ({ value, min = 0, max = 100, step = 1, onChange, label, marks, disabled, className, style, showValue, valueFormat }: any) => {
  const nextValue = Array.isArray(value) ? [Number(value[0] ?? min), Number(value[1] ?? max)] : [min, max];
  const formatValue = (v: number) => valueFormat ? valueFormat(v) : String(v);

  return (
    <Box className={className} style={style}>
      {label ? <MantineText size="sm">{label}{showValue ? ` ${formatValue(nextValue[0])} – ${formatValue(nextValue[1])}` : ""}</MantineText> : null}
      <MantineRangeSlider value={nextValue as [number, number]} min={min} max={max} step={step} onChange={(next) => onChange?.([next[0], next[1]])} marks={marks} disabled={disabled} label={valueFormat} />
    </Box>
  );
};

export const Breadcrumb = ({ items, className }: any) => (
  <Breadcrumbs className={className}>{items.map((item: any) => item.href ? <a key={item.key ?? item.href} href={item.href} onClick={item.onClick}>{item.label}</a> : <span key={item.key ?? String(item.label)}>{item.label}</span>)}</Breadcrumbs>
);

export function DataGrid<T>({ columns, data, rowKey, className, style }: DataGridProps<T>) {
  return (
    <MantineTable striped highlightOnHover className={className} style={style}>
      <MantineTable.Thead><MantineTable.Tr>{columns.map((column) => <MantineTable.Th key={column.key} style={{ width: column.width }}>{column.header}</MantineTable.Th>)}</MantineTable.Tr></MantineTable.Thead>
      <MantineTable.Tbody>{data.map((row, rowIndex) => <MantineTable.Tr key={rowKey(row)}>{columns.map((column) => <MantineTable.Td key={column.key}>{column.render(row, rowIndex)}</MantineTable.Td>)}</MantineTable.Tr>)}</MantineTable.Tbody>
    </MantineTable>
  );
}

function parseJsonValue(input: unknown): { ok: true; value: any } | { ok: false } {
  if (input !== undefined && (typeof input === "object" || typeof input === "number" || typeof input === "boolean")) return { ok: true, value: input };

  let current = String(input ?? "");
  if (!current.trim()) return { ok: false };

  for (let i = 0; i < 3; i += 1) {
    try {
      const parsed = JSON.parse(current);
      if (typeof parsed === "string" && /^[\s\r\n]*[\[{]/.test(parsed) && parsed !== current) {
        current = parsed;
        continue;
      }
      return { ok: true, value: parsed };
    } catch {
      return { ok: false };
    }
  }

  return { ok: true, value: current };
}

const JsonPrimitive = ({ value }: { value: any }) => {
  const color =
    typeof value === "string"
      ? "blue"
      : typeof value === "number"
        ? "grape"
        : typeof value === "boolean"
          ? "teal"
          : "dimmed";

  return <MantineText component="span" c={color} ff="monospace" size="sm">{JSON.stringify(value)}</MantineText>;
};

const JsonValue = ({ value, label }: { value: any; label?: React.ReactNode }) => {
  if (typeof value === "object" && value !== null) {
    const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const) : Object.entries(value);
    const summary = Array.isArray(value) ? `[Array] (${value.length} items)` : "{Object}";

    return (
      <Box component="details" open style={{ margin: 0 }}>
        <Box component="summary" style={{ cursor: "pointer", listStylePosition: "inside" }}>
          {label ? <MantineText component="strong" ff="monospace" size="sm">{label}: </MantineText> : null}
          <MantineText component="span" c="dimmed" ff="monospace" size="sm">{summary}</MantineText>
        </Box>
        <Box component="ul" style={{ margin: "4px 0 4px 18px", paddingLeft: 14 }}>
          {entries.map(([key, child]) => (
            <Box component="li" key={key} style={{ margin: "2px 0" }}>
              <JsonValue value={child} label={key} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box component="span">
      {label ? <MantineText component="strong" ff="monospace" size="sm">{label}: </MantineText> : null}
      <JsonPrimitive value={value} />
    </Box>
  );
};

export const JsonViewer = ({ value, data, title, className, style }: any) => {
  const parsed = parseJsonValue(value ?? data);

  if (!parsed.ok) {
    return <MantineText c="red" className={className} style={style}>Invalid JSON</MantineText>;
  }

  return (
    <Paper withBorder p="sm" radius="sm" className={className} style={{ overflowX: "auto", ...style }}>
      {title ? <MantineText fw={600} mb="xs">{title}</MantineText> : null}
      <Box style={{ fontFamily: "var(--mantine-font-family-monospace)", fontSize: "var(--mantine-font-size-sm)", lineHeight: 1.55 }}>
        <JsonValue value={parsed.value} />
      </Box>
    </Paper>
  );
};

export const Toolbar = ({ children, ariaLabel, className }: any) => <Group role="toolbar" aria-label={ariaLabel} gap="xs" className={className}>{children}</Group>;
export const ToolbarButton = (props: any) => <Button variant={props.variant ?? "subtle"} {...props} />;
export const ToolbarDivider = () => <Divider orientation="vertical" />;

function renderMenuItems(items: MenuItemProps[] | SplitButtonMenuItem[]) {
  return items.map((item: any) => item.children?.length ? (
    <MantineMenu.Sub key={item.key}>
      <MantineMenu.Sub.Target><MantineMenu.Sub.Item leftSection={renderIcon(item.icon)} color={item.danger ? "red" : undefined} disabled={item.disabled}>{item.label}</MantineMenu.Sub.Item></MantineMenu.Sub.Target>
      <MantineMenu.Sub.Dropdown>{renderMenuItems(item.children)}</MantineMenu.Sub.Dropdown>
    </MantineMenu.Sub>
  ) : (
    <MantineMenu.Item key={item.key} leftSection={renderIcon(item.icon)} color={item.danger ? "red" : undefined} disabled={item.disabled} onClick={item.onClick}>{item.label}</MantineMenu.Item>
  ));
}

export const Menu = ({ items, trigger, align = "right", direction = "bottom", className }: MenuProps) => (
  <MantineMenu position={`${direction === "top" ? "top" : "bottom"}-${align === "left" ? "start" : "end"}` as any} withinPortal>
    <MantineMenu.Target>{trigger ?? <MantineButton variant="subtle">More</MantineButton>}</MantineMenu.Target>
    <MantineMenu.Dropdown className={className}>{renderMenuItems(items)}</MantineMenu.Dropdown>
  </MantineMenu>
);

export const SplitButton = ({ label, onClick, menuItems, variant = "primary", size, icon, iconPosition = "left", disabled, align, className, stopPropagation = true }: any) => (
  <MantineButton.Group className={className}>
    <Button variant={variant} size={size} icon={icon} iconPosition={iconPosition} disabled={disabled} onClick={(event: any) => { if (stopPropagation) event.stopPropagation(); onClick?.(event); }}>{label}</Button>
    <MantineMenu position={align === "left" ? "bottom-start" : "bottom-end"} withinPortal>
      <MantineMenu.Target><ActionIcon variant={mapButtonVariant(variant) as any} color={mapColor(variant)} size={mapSize(size) === "lg" ? 42 : 36} disabled={disabled}>{renderIcon("chevronDown")}</ActionIcon></MantineMenu.Target>
      <MantineMenu.Dropdown>{renderMenuItems(menuItems)}</MantineMenu.Dropdown>
    </MantineMenu>
  </MantineButton.Group>
);

export const Toast = ({ id, variant, message, show, autohide, onClose }: ToastProps) => {
  React.useEffect(() => {
    if (!show) return;
    notifications.show({ id, color: mapColor(variant) ?? "blue", message, autoClose: autohide ?? 4000, onClose });
  }, [id, variant, message, show, autohide, onClose]);
  return <></>;
};

export const Toaster = ({ toasts }: any) => <>{toasts?.map((toast: any) => <Toast key={toast.id} {...toast} />)}</>;

export const Tags = ({ items = [], size = "small", onRemove }: any) => (
  <Group gap="xs">
    {items.map((item: any) => <MantineBadge key={item.key} size={size === "extra-small" ? "xs" : size === "medium" ? "md" : "sm"} leftSection={renderIcon(item.icon, 12)} rightSection={onRemove ? <UnstyledButton onClick={() => onRemove(item.key)}>×</UnstyledButton> : undefined}>{item.label}</MantineBadge>)}
  </Group>
);

export const AudioPlayer = ({ src, autoPlay, controls = true, className }: any) => <audio src={src} autoPlay={autoPlay} controls={controls} className={className} />;

export const Carousel = ({ items = [], className, style }: any) => (
  <Group className={className} style={style} wrap="nowrap" gap="md" align="stretch">{items.map((item: any, index: number) => <Paper key={item.key ?? index} withBorder p="sm">{item.content ?? item.children ?? item}</Paper>)}</Group>
);

const avatarSize = (size?: number) => size ?? 32;

export const AvatarGroup = (({ children, layout, size, style, ...rest }: AvatarGroupProps) => (
  <Avatar.Group spacing={layout === "spread" ? "sm" : -8} style={style} {...rest as any}>{React.Children.map(children, (child) => {
    if (!React.isValidElement<any>(child)) return child;
    const avatarChild = child as React.ReactElement<any>;
    return React.cloneElement(avatarChild, { size: avatarChild.props.size ?? size } as any);
  })}</Avatar.Group>
)) as AvatarGroupComponent;

AvatarGroup.Avatar = ({ image, icon, initials, name, shape, size, children, ...rest }: AvatarProps) => <Avatar src={image?.src} alt={image?.alt ?? name} radius={shape === "square" ? "sm" : "xl"} size={avatarSize(size)} {...rest as any}>{children ?? icon ?? initials ?? name?.slice(0, 2).toUpperCase()}</Avatar>;
AvatarGroup.Item = ({ overflowLabel, ...props }: AvatarGroupItemProps) => <Tooltip label={overflowLabel ?? props.name ?? props.initials}><AvatarGroup.Avatar {...props} /></Tooltip>;
AvatarGroup.Popover = ({ children, count, indicator, size, overflowLabel, ...rest }: AvatarGroupPopoverProps & { size?: number; overflowLabel?: string }) => {
  const hiddenLabels = React.Children.toArray(children)
    .map((child) => {
      if (!React.isValidElement<any>(child)) return undefined;
      const props = child.props as any;
      return props.overflowLabel ?? props.name ?? props.title;
    })
    .filter(Boolean)
    .join("\n");

  return (
    <Tooltip label={overflowLabel ?? hiddenLabels ?? `+${count ?? 0}`} multiline>
      <Avatar color="blue" radius="xl" size={avatarSize(size)} style={{ fontSize: Math.max(9, avatarSize(size) / 2.2), fontWeight: 700 }} {...rest as any}>
        +{count ?? 0}
      </Avatar>
    </Tooltip>
  );
};
AvatarGroup.partitionItems = <T,>({ items, maxInlineItems = 5 }: { items: readonly T[]; maxInlineItems?: number }) => ({ inlineItems: items.slice(0, maxInlineItems), overflowItems: items.length > maxInlineItems ? items.slice(maxInlineItems) : undefined });

export const Chat = ({ messages = [], renderMessage, renderReactions, locale, aiGeneratedLabel, aiGeneratedWarning, disableProviderLogo }: any) => (
  <Stack gap="sm">
    {messages.map((msg: ChatMessage) => {
      const isUser = msg.role === "user";
      const isAssistant = msg.role === "assistant";
      const streaming = msg.content?.some((part: any) => part.type === "text" && part.state === "streaming");
      const providerLogo = !disableProviderLogo && isAssistant && msg.providerIcon?.src ? msg.providerIcon : undefined;
      const messageIcon = !isUser && msg.messageIcon ? renderIcon(msg.messageIcon, 14) : undefined;
      return (
        <Paper key={msg.id} withBorder radius="md" p="sm" maw="90%" style={{ alignSelf: isUser ? "flex-end" : "flex-start" }}>
          <Group justify="space-between" gap="xs" mb={4}>
            <Group gap="xs">{providerLogo ? <Avatar src={providerLogo.src} alt={providerLogo.alt ?? msg.providerName ?? msg.providerKey} radius="sm" size="sm" /> : messageIcon ? <Avatar size="sm">{messageIcon}</Avatar> : null}<MantineText size="sm" fw={600}>{msg.author ?? (isUser ? "You" : "Assistant")}</MantineText>{isAssistant && aiGeneratedWarning ? <Tooltip label={aiGeneratedWarning}><MantineBadge variant="outline" size="xs">{aiGeneratedLabel}</MantineBadge></Tooltip> : null}</Group>
            <MantineText size="xs" c="dimmed">{msg.createdAt ? format(msg.createdAt, locale) : ""}</MantineText>
          </Group>
          {renderMessage(msg)}
          {(streaming || renderReactions) ? (
            <Box mt="xs" style={{ display: "flex", alignItems: "center", minHeight: 30, overflow: "visible" }}>
              {streaming ? <Progress size="xs" value={100} animated style={{ width: "100%" }} /> : renderReactions?.(msg)}
            </Box>
          ) : null}
        </Paper>
      );
    })}
  </Stack>
);

const navItemMatchesActive = (item: NavigationItem, activeKey?: string): boolean => {
  if (!activeKey) return false;
  const itemValue = item.eventKey ?? item.key;
  if (itemValue === activeKey || item.key === activeKey || item.eventKey === activeKey) return true;
  return Array.isArray(item.children) && item.children.some((child: NavigationItem) => navItemMatchesActive(child, activeKey));
};

const renderNavItem = (item: NavigationItem, activeKey?: string, onSelect?: (key: string) => void, path = "nav", index = 0): React.ReactNode => {
  const key = `${path}:${item.key ?? item.eventKey ?? index}:${index}`;

  if (item.key === "divider") return <Divider key={key} my={4} />;
  if (item.key?.startsWith?.("section:")) return <MantineText key={key} c="dimmed" size="sm" px="sm" py={6}>{item.label}</MantineText>;

  const itemValue = item.eventKey ?? item.key;
  const selected = !!activeKey && (itemValue === activeKey || item.key === activeKey || item.eventKey === activeKey);
  const childSelected = Array.isArray(item.children) && item.children.some((child: NavigationItem) => navItemMatchesActive(child, activeKey));

  return (
    <NavLink
      key={key}
      label={<span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, width: "100%" }}><span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>{item.badge ? <MantineText component="span" size="xs" c="dimmed" style={{ marginLeft: "auto", flex: "0 0 auto" }}>{item.badge}</MantineText> : null}</span>}
      leftSection={renderIcon(item.icon)}
      active={selected}
      defaultOpened={childSelected}
      disabled={item.disabled}
      onClick={(event) => { item.onClick?.(event); if (!item.children?.length) onSelect?.(itemValue); }}
    >
      {item.children?.map((child: NavigationItem, childIndex: number) => renderNavItem(child, activeKey, onSelect, key, childIndex))}
    </NavLink>
  );
};

export const Navigation = ({ items = [], activeKey, onSelect, appTitle, className, style }: any) => (
  <ScrollArea className={className} style={style}>
    <Stack gap={2}>
      {appTitle ? <MantineText fw={700} p="sm">{appTitle}</MantineText> : null}
      {items.map((item: NavigationItem, index: number) => renderNavItem(item, activeKey, onSelect, "nav", index))}
    </Stack>
  </ScrollArea>
);

export const UserMenu = ({ email, onCustomize, onSettings, onLogout, showApiKeysItem, onApiKeys, showChatEndpointsItem, chatEndpointOptions = [], selectedChatEndpoint, chatEndpointsDisabled, onSelectChatEndpoint, providers = [], providersDisabled, className, labels }: UserMenuProps) => (
  <MantineMenu withinPortal position="bottom-end">
    <MantineMenu.Target><ActionIcon variant="subtle" aria-label="User menu" className={className}>{renderIcon("customize")}</ActionIcon></MantineMenu.Target>
    <MantineMenu.Dropdown>
      {email ? <MantineMenu.Label>{email}</MantineMenu.Label> : null}
      {onCustomize ? <MantineMenu.Item leftSection={renderIcon("personalization")} onClick={onCustomize}>{labels?.customize ?? "Customize"}</MantineMenu.Item> : null}
      <MantineMenu.Item leftSection={renderIcon("settings")} onClick={onSettings}>{labels?.settings ?? "Settings"}</MantineMenu.Item>
      {showApiKeysItem ? <MantineMenu.Item leftSection={renderIcon("settings")} onClick={onApiKeys}>{labels?.apiKeys ?? "API keys"}</MantineMenu.Item> : null}
      {showChatEndpointsItem ? <MantineMenu.Label>{labels?.chatEndpoint ?? "Chat endpoint"}</MantineMenu.Label> : null}
      {showChatEndpointsItem && chatEndpointOptions.length > 0
        ? chatEndpointOptions.map((option) => (
          <MantineMenu.Item
            key={option.value}
            disabled={!!chatEndpointsDisabled || !!option.disabled}
            onClick={() => onSelectChatEndpoint?.(option.value)}
          >
            {option.value === selectedChatEndpoint ? "✓ " : ""}
            {option.label}
          </MantineMenu.Item>
        ))
        : null}
      {showChatEndpointsItem && chatEndpointOptions.length === 0 ? <MantineMenu.Item disabled>{labels?.noChatEndpoints ?? "No chat endpoints available"}</MantineMenu.Item> : null}
      {providers.length ? <MantineMenu.Label>Providers</MantineMenu.Label> : null}
      {providers.map((provider) => <MantineMenu.Item key={provider} disabled={providersDisabled}>{provider}</MantineMenu.Item>)}
      <MantineMenu.Divider />
      <MantineMenu.Item color="red" leftSection={renderIcon("logout")} onClick={onLogout}>{labels?.logout ?? "Logout"}</MantineMenu.Item>
    </MantineMenu.Dropdown>
  </MantineMenu>
);

export const ThemeSettings = () => <MantineText size="sm" c="dimmed">Mantine theme settings are provided by MantineProvider props.</MantineText>;

export const mantineTheme: AihUiTheme = {
  AvatarGroup,
  DataGrid,
  Header,
  JsonViewer,
  Breadcrumb,
  Button: Button as any,
  ToggleButton: ToggleButton as any,
  UserMenu,
  Input: Input as any,
  Image: Image as any,
  Card,
  Alert,
  Accordion,
  Spinner,
  Modal: Modal as any,
  Tabs: Tabs as any,
  Tab: Tab as any,
  Badge: Badge as any,
  Table: Table as any,
  CloseButton: CloseButton as any,
  Select,
  SearchBox,
  ProgressBar,
  Switch,
  TextArea,
  AudioPlayer,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  Chat,
  Text,
  SplitButton,
  Drawer,
  Navigation,
  Menu,
  Tags,
  Toast,
  Toaster,
  Skeleton,
  Carousel,
  Slider,
  Range,
  ThemeSettings,
};

