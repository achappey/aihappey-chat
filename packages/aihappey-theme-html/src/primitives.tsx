import * as React from "react";
import { format } from "timeago.js";
import {
  Activity,
  AppWindow,
  ArrowDown,
  ArrowDownAZ,
  ArrowDownToLine,
  ArrowRight,
  ArrowUp,
  Beaker,
  Bot,
  Brain,
  BrainCircuit,
  Briefcase,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDollarSign,
  CircleStop,
  Code,
  Code2,
  Copy,
  Database,
  DatabaseZap,
  EllipsisVertical,
  Eye,
  FileCode2,
  FileKey,
  FileText,
  Folder,
  Globe,
  Image as ImageIcon,
  ImagePlay,
  Images,
  KeyRound,
  Languages,
  Link,
  List,
  Mail,
  Maximize2,
  Menu as MenuIcon,
  Mic,
  MonitorCog,
  Network,
  Paintbrush,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Pencil,
  Pin,
  PinOff,
  Plug,
  PlugZap,
  Puzzle,
  Radio,
  RefreshCw,
  Router,
  Search as SearchIcon,
  Send,
  Server,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Split,
  Star,
  Table as TableIcon,
  Thermometer,
  Trash2,
  UserCog,
  Users,
  Video,
  Volume2,
  WandSparkles,
  Wrench,
  X,
  type LucideProps,
} from "lucide-react";
import type { AihUiTheme, ChatMessage, GenericDataGridColumn, IconToken } from "aihappey-types";
import type { UserMenuProps, ProviderCapability } from "aihappey-types/src/theme/UserMenu";

type IconComponent = React.ComponentType<LucideProps>;

function PlusIcon(props: LucideProps) {
  return <X {...props} style={{ transform: "rotate(45deg)", ...(props.style ?? {}) }} />;
}

function WarningIcon(props: LucideProps) {
  return <ShieldCheck {...props} />;
}

function StarFilledIcon(props: LucideProps) {
  return <Star {...props} fill="currentColor" />;
}

export const iconMap: Record<IconToken, IconComponent> = {
  add: PlusIcon,
  edit: Pencil,
  delete: Trash2,
  send: Send,
  robot: Bot,
  jobs: Briefcase,
  customize: UserCog,
  trending: Activity,
  mcpServer: PlugZap,
  prompts: WandSparkles,
  search: SearchIcon,
  check: Check,
  eye: Eye,
  completed: Check,
  image: ImageIcon,
  cardList: List,
  chat: Bot,
  aiImage: ImagePlay,
  table: TableIcon,
  transcription: Mic,
  language: Languages,
  model_provider: BrainCircuit,
  gateway_router: Router,
  inference_compute: Network,
  media_voice: Volume2,
  search_data: DatabaseZap,
  app_tools: MonitorCog,
  storage: Database,
  endpoint: Split,
  client: AppWindow,
  providers: Plug,
  speech: Volume2,
  skills: Sparkles,
  speechSettings: Settings,
  transcriptionSettings: Settings,
  imageSettings: Settings,
  videoSettings: Settings,
  video: Video,
  videos: Video,
  structuredOutputs: FileCode2,
  webApps: AppWindow,
  components: Puzzle,
  reranking: ArrowDownAZ,
  labs: Beaker,
  rerankingSettings: Settings,
  realtime: Radio,
  realtimeSettings: Settings,
  catalog: ShoppingBag,
  brain: Brain,
  download: ArrowDownToLine,
  print: FileText,
  pricing: CircleDollarSign,
  explainTool: Sparkles,
  mail: Mail,
  theme: Paintbrush,
  formula: Code2,
  chatSettings: Settings,
  databaseGear: DatabaseZap,
  code: Code,
  chart: ChartNoAxesCombined,
  arena: Users,
  openLink: Maximize2,
  attachment: Paperclip,
  warning: WarningIcon,
  stop: CircleStop,
  up: ArrowUp,
  down: ArrowDown,
  resources: FileText,
  images: Images,
  folder: Folder,
  priority: WarningIcon,
  temperature: Thermometer,
  dismiss: X,
  agentSettings: Settings,
  preview: Eye,
  navigationMenu: MenuIcon,
  contextMenu: EllipsisVertical,
  globe: Globe,
  connect: PlugZap,
  refresh: RefreshCw,
  sequential: ArrowRight,
  concurrent: Split,
  groupchat: Users,
  handoff: Users,
  disconnect: Plug,
  contextWindow: Database,
  docs: FileText,
  terms: FileKey,
  privacy: ShieldCheck,
  console: MonitorCog,
  maxOutputTokens: ArrowDownToLine,
  panelExpand: PanelRightOpen,
  panelContract: PanelRightClose,
  bookOpen: FileText,
  toolResult: FileCode2,
  server: Server,
  copyClipboard: Copy,
  connector: Plug,
  link: Link,
  tool: Wrench,
  personalization: UserCog,
  settings: Settings,
  sources: Link,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  logout: KeyRound,
  star: Star,
  starFilled: StarFilledIcon,
};

const icon = (token?: IconToken, size = 16) => {
  if (!token) return null;
  const Icon = iconMap[token];
  return <Icon aria-hidden="true" size={size} style={{ verticalAlign: "text-bottom" }} />;
};

const hasChildren = (children: React.ReactNode) => React.Children.count(children) > 0;

const Field = ({ label, hint, required, children }: any) => label ? (
  <label>
    <span>{label}{required ? " *" : ""}</span>
    <br />
    {children}
    {hint ? <small>{hint}</small> : null}
  </label>
) : <>{children}</>;

export const Button = ({ icon: iconToken, iconPosition = "left", children, type, ...rest }: any) => (
  <button type={type ?? "button"} {...rest}>
    {iconPosition === "left" ? icon(iconToken) : null}
    {hasChildren(children) && iconToken && iconPosition === "left" ? " " : null}
    {children}
    {hasChildren(children) && iconToken && iconPosition === "right" ? " " : null}
    {iconPosition === "right" ? icon(iconToken) : null}
  </button>
);

export const ToggleButton = ({ checked, children, ...rest }: any) => (
  <Button aria-pressed={!!checked} {...rest}>{children}</Button>
);

export const CloseButton = ({ onClick, ...rest }: any) => <Button aria-label="Close" icon="dismiss" onClick={onClick} {...rest} />;

export const Toolbar = ({ children, ariaLabel, ...rest }: any) => <div role="toolbar" aria-label={ariaLabel} {...rest}>{children}</div>;
export const ToolbarButton = (props: any) => <Button {...props} />;
export const ToolbarDivider = () => <hr aria-orientation="vertical" />;

export const SplitButton = ({ label, icon: iconToken, iconPosition = "left", menuItems = [], onClick, ...rest }: any) => (
  <span>
    <Button icon={iconToken} iconPosition={iconPosition} onClick={onClick} {...rest}>{label}</Button>
    <Menu items={menuItems} trigger={<Button aria-label={`${label} menu`}>⌄</Button>} />
  </span>
);

export const Input = ({ label, hint, required, ...rest }: any) => (
  <Field label={label} hint={hint} required={required}><input required={required} {...rest} /></Field>
);

export const TextArea = ({ label, hint, required, onChange, ...rest }: any) => (
  <Field label={label} hint={hint} required={required}>
    <textarea required={required} onChange={(event) => onChange?.(event.target.value)} {...rest} />
  </Field>
);

export const Select = ({ label, hint, required, children, values = [], value, onChange, multiselect, placeholder, ...rest }: any) => {
  const selected = multiselect ? values : value;
  return (
    <Field label={label} hint={hint} required={required}>
      <select
        required={required}
        multiple={!!multiselect}
        value={selected}
        onChange={(event) => {
          if (multiselect) {
            onChange?.(Array.from(event.currentTarget.selectedOptions).map((option) => option.value));
          } else {
            onChange?.(event.currentTarget.value);
          }
        }}
        {...rest}
      >
        {placeholder && !multiselect ? <option value="">{placeholder}</option> : null}
        {children}
      </select>
    </Field>
  );
};

export const SearchBox = ({ value, onChange, ...rest }: any) => (
  <input type="search" value={value} onChange={(event) => onChange?.(event.target.value)} {...rest} />
);

export const Switch = ({ checked, onChange, label, id, ...rest }: any) => (
  <label>
    <input id={id} type="checkbox" role="switch" checked={checked} onChange={(event) => onChange?.(event.target.checked)} {...rest} />
    {label ? <> {label}</> : null}
  </label>
);

export const Slider = ({ value, onChange, min = 0, max = 100, step = 1, label, showValue, valueFormat, id, ...rest }: any) => (
  <label>
    {label ? <span>{label}{showValue ? ` ${valueFormat ? valueFormat(value) : value}` : ""}</span> : null}
    <input id={id} type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange?.(Number(event.target.value))} {...rest} />
  </label>
);

export const Range = ({ value, onChange, min = 0, max = 100, step = 1, label, minLabel = "Minimum", maxLabel = "Maximum", showValue, valueFormat, id, disabled, className, style, ...rest }: any) => {
  const nextValue = Array.isArray(value) ? [Number(value[0] ?? min), Number(value[1] ?? max)] : [min, max];
  const formatValue = (v: number) => valueFormat ? valueFormat(v) : String(v);
  const minId = id ? `${id}-min` : undefined;
  const maxId = id ? `${id}-max` : undefined;

  return (
    <fieldset className={className} style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 8, ...(style ?? {}) }}>
      {label ? <legend>{label}{showValue ? ` ${formatValue(nextValue[0])} – ${formatValue(nextValue[1])}` : ""}</legend> : null}
      <label htmlFor={minId}>
        <span>{minLabel}</span>
        <input id={minId} type="range" value={nextValue[0]} min={min} max={max} step={step} disabled={disabled} onChange={(event) => onChange?.([Math.min(Number(event.target.value), nextValue[1]), nextValue[1]])} {...rest} />
      </label>
      <label htmlFor={maxId}>
        <span>{maxLabel}</span>
        <input id={maxId} type="range" value={nextValue[1]} min={min} max={max} step={step} disabled={disabled} onChange={(event) => onChange?.([nextValue[0], Math.max(Number(event.target.value), nextValue[0])])} {...rest} />
      </label>
    </fieldset>
  );
};

export const Header = ({ level = 1, children, ...rest }: any) => {
  const Tag = `h${Math.min(6, Math.max(1, Number(level) || 1))}` as keyof React.JSX.IntrinsicElements;
  return <Tag {...rest}>{children}</Tag>;
};

export const Text = ({ as = "span", children, weight, italic, underline, strikethrough, block, align, font, size, wrap, style, ...rest }: any) => {
  const Tag = as as keyof React.JSX.IntrinsicElements;
  return <Tag style={{ display: block ? "block" : undefined, fontWeight: weight, fontStyle: italic ? "italic" : undefined, textDecoration: underline ? "underline" : strikethrough ? "line-through" : undefined, textAlign: align, fontFamily: font === "monospace" ? "monospace" : undefined, fontSize: size ? `${Number(size) / 100}rem` : undefined, whiteSpace: wrap === false ? "nowrap" : undefined, ...style }} {...rest}>{children}</Tag>;
};

export const Paragraph = ({ children, ...rest }: any) => <p {...rest}>{children}</p>;

export const Badge = ({ icon: iconToken, text, children, ...rest }: any) => <span {...rest}>{icon(iconToken)}{iconToken ? " " : null}{children ?? text}</span>;

export const Card = ({ title, text, description, children, actions, headerActions, image, ...rest }: any) => (
  <section {...rest}>
    {image ? <div>{image}</div> : null}
    {title || description || headerActions ? <header>{title ? <strong>{title}</strong> : null}{description ? <p>{description}</p> : null}{headerActions}</header> : null}
    <div>{children ?? text}</div>
    {actions ? <footer>{actions}</footer> : null}
  </section>
);

export const Image = ({ fit, ...rest }: any) => <img alt="" {...rest} />;
export const Skeleton = ({ width, height, circle, style, ...rest }: any) => <span aria-hidden="true" style={{ display: "inline-block", width, height, borderRadius: circle ? "50%" : undefined, ...style }} {...rest} />;
export const Spinner = ({ label, ...rest }: any) => <span role="status" {...rest}>{label ?? "Loading..."}</span>;
export const ProgressBar = ({ value = 0, label, animated, ...rest }: any) => animated ? <progress {...rest}>{label}</progress> : <progress value={value} max={100} {...rest}>{label}</progress>;
export const Table = ({ children, ...rest }: any) => <table {...rest}>{children}</table>;

export function DataGrid<T>({ columns = [], data = [], rowKey, ...rest }: { columns?: GenericDataGridColumn<T>[]; data?: T[]; rowKey: (row: T) => string | number;[key: string]: any }) {
  const [sort, setSort] = React.useState<{ key?: string; direction: "asc" | "desc" }>({ direction: "asc" });
  const sorted = React.useMemo(() => {
    const col = columns.find((candidate) => candidate.key === sort.key);
    if (!col?.sortFn) return data;
    const copy = [...data].sort(col.sortFn);
    return sort.direction === "asc" ? copy : copy.reverse();
  }, [columns, data, sort]);
  return (
    <table {...rest}>
      <thead><tr>{columns.map((col) => <th key={col.key} style={{ width: col.width }}><button type="button" onClick={() => col.sortFn && setSort((current) => ({ key: col.key, direction: current.key === col.key && current.direction === "asc" ? "desc" : "asc" }))}>{col.header}{sort.key === col.key ? sort.direction === "asc" ? " ↑" : " ↓" : ""}</button></th>)}</tr></thead>
      <tbody>{sorted.map((row, rowIndex) => <tr key={rowKey?.(row) ?? rowIndex}>{columns.map((col) => <td key={col.key}>{col.render(row, rowIndex)}</td>)}</tr>)}</tbody>
    </table>
  );
}

function parseJson(input: unknown) {
  if (typeof input === "object") return input;
  try { return JSON.parse(String(input)); } catch { return null; }
}

const JsonValue = ({ data }: { data: any }) => {
  if (typeof data === "object" && data !== null) {
    if (Array.isArray(data)) return <details open><summary>Array ({data.length})</summary><ol>{data.map((item, index) => <li key={index}><JsonValue data={item} /></li>)}</ol></details>;
    return <details open><summary>Object</summary><dl>{Object.entries(data).map(([key, value]) => <React.Fragment key={key}><dt>{key}</dt><dd><JsonValue data={value} /></dd></React.Fragment>)}</dl></details>;
  }
  return <code>{JSON.stringify(data)}</code>;
};

export const JsonViewer = ({ value, data, title, ...rest }: any) => {
  const json = parseJson(value ?? data);
  return <div {...rest}>{title ? <strong>{title}</strong> : null}{json === null ? <p>Invalid JSON</p> : <JsonValue data={json} />}</div>;
};

const Avatar = ({ image, initials, name, icon: iconNode, size = 32, style, ...rest }: any) => <span style={{ display: "inline-flex", width: size, height: size, alignItems: "center", justifyContent: "center", ...style }} {...rest}>{image?.src ? <img src={image.src} alt={image.alt ?? name ?? ""} width={size} height={size} /> : iconNode ?? initials ?? name?.slice(0, 2)?.toUpperCase()}</span>;
export const AvatarGroup: any = ({ children, ...rest }: any) => <div role="group" {...rest}>{children}</div>;
AvatarGroup.Avatar = Avatar;
AvatarGroup.Item = Avatar;
AvatarGroup.Popover = ({ children, count, ...rest }: any) => <span {...rest}>{children ?? `+${count ?? 0}`}</span>;
AvatarGroup.partitionItems = <T,>({ items, maxInlineItems = 5 }: { items: readonly T[]; maxInlineItems?: number }) => ({ inlineItems: items.slice(0, maxInlineItems), overflowItems: items.length > maxInlineItems ? items.slice(maxInlineItems) : undefined });

export const Tags = ({ items = [], onRemove, ...rest }: any) => (
  <span {...rest}>{items.map((item: any) => <span key={item.key}>{icon(item.icon)}{item.image ? <img src={item.image} alt="" /> : null}{item.label ?? item.text ?? item.key}{onRemove ? <button type="button" aria-label="Remove" onClick={() => void onRemove(item.key)}>×</button> : null} </span>)}</span>
);

export const Breadcrumb = ({ items = [], separator = " / ", ...rest }: any) => <nav aria-label="Breadcrumb" {...rest}>{items.map((item: any, index: number) => <React.Fragment key={item.key ?? index}>{index > 0 ? separator : null}<button type="button" onClick={item.onClick}>{icon(item.icon)}{item.icon ? " " : null}{item.label}</button></React.Fragment>)}</nav>;
export const AudioPlayer = (props: any) => <audio controls {...props} />;

export const Alert = ({ title, onDismiss, children, ...rest }: any) => <section role="alert" {...rest}>{title ? <strong>{title}</strong> : null}{onDismiss ? <CloseButton onClick={onDismiss} /> : null}<div>{children}</div></section>;

function useNativeDialog(open: boolean, onClose?: () => void, modal = false) {
  const ref = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (modal && typeof dialog.showModal === "function") dialog.showModal();
      else dialog.show();
    }
    if (!open && dialog.open) dialog.close();
  }, [modal, open]);
  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.addEventListener("close", () => onClose?.());
    return () => dialog.removeEventListener("close", () => onClose?.());
  }, [onClose]);
  return ref;
}

export const Modal = ({ open, show, onOpenChange, onHide, title, children, actions, modalType }: any) => {
  const isOpen = open ?? show ?? false;
  const ref = useNativeDialog(isOpen, () => { onOpenChange?.(false); onHide?.(); }, modalType !== "non-modal");
  return <dialog ref={ref}>{title ? <header><strong>{title}</strong> <form method="dialog"><button aria-label="Close">×</button></form></header> : null}<div>{children}</div>{actions ? <footer>{actions}</footer> : null}</dialog>;
};

export const Drawer = ({ open, isOpen, onOpenChange, onClose, title, children, actions }: any) => {
  const ref = useNativeDialog(open ?? isOpen ?? false, () => { onOpenChange?.(false); onClose?.(); }, false);
  return <dialog ref={ref}>{title ? <header><strong>{title}</strong> <form method="dialog"><button aria-label="Close">×</button></form></header> : null}<div>{children}</div>{actions}</dialog>;
};

function renderMenuItems(items: any[] = []) {
  return <ul>{items.map((item, index) => <li key={item.key ?? index}>{item.children?.length ? <details><summary aria-disabled={item.disabled} onClick={(event) => { if (item.disabled) event.preventDefault(); }}>{icon(item.icon)} {item.label}</summary>{renderMenuItems(item.children)}</details> : <button type="button" disabled={item.disabled} onClick={() => void item.onClick?.()}>{icon(item.icon)}{item.icon ? " " : null}{item.label}</button>}</li>)}</ul>;
}

export const Menu = ({ items = [], trigger, direction = "bottom", ...rest }: any) => <details {...rest} style={{ position: "relative", ...(rest.style ?? {}) }}><summary>{trigger ?? <span>Menu</span>}</summary><div style={direction === "top" ? { position: "absolute", bottom: "100%" } : undefined}>{renderMenuItems(items)}</div></details>;

const UserMenuCheckbox = ({ capability, provider, checked, disabled, onToggleProviderForType }: { capability: ProviderCapability; provider: string; checked: boolean; disabled?: boolean; onToggleProviderForType?: UserMenuProps["onToggleProviderForType"] }) => (
  <label><input type="checkbox" checked={checked} disabled={disabled} onChange={() => onToggleProviderForType?.(capability, provider)} /> {provider}</label>
);

export const UserMenu: React.FC<UserMenuProps> = ({ email, onCustomize, onSettings, onLogout, showApiKeysItem, onApiKeys, showChatEndpointsItem, chatEndpointOptions = [], selectedChatEndpoint, chatEndpointsDisabled, onSelectChatEndpoint, providers = [], providerGroups = {}, enabledProvidersByType = {}, onToggleProviderForType, providersDisabled, disabledProviders = [], labels = {}, ...rest }) => {
  const disabledProviderSet = React.useMemo(() => new Set(disabledProviders), [disabledProviders]);
  const capabilityDefinitions: Array<{ key: ProviderCapability; label: string; providers: string[] }> = [
    { key: "language", label: labels.language ?? "Language", providers: providerGroups.language ?? providers },
    { key: "image", label: labels.image ?? "Image", providers: providerGroups.image ?? [] },
    { key: "audio", label: labels.audio ?? labels.realtime ?? "Realtime", providers: providerGroups.audio ?? [] },
    { key: "transcription", label: labels.transcription ?? "Transcription", providers: providerGroups.transcription ?? [] },
    { key: "speech", label: labels.speech ?? "Speech", providers: providerGroups.speech ?? [] },
    { key: "reranking", label: labels.reranking ?? "Reranking", providers: providerGroups.reranking ?? [] },
    { key: "video", label: labels.video ?? "Video", providers: providerGroups.video ?? [] },
  ];
  const capabilities = capabilityDefinitions.filter((capability) => capability.providers.length > 0);
  return (
    <details {...rest}>
      <summary>{email ? email[0]?.toUpperCase() : "User"}</summary>
      {email ? <p>{email}</p> : null}
      {onCustomize ? <button type="button" onClick={onCustomize}>{labels.customize ?? "Customize"}</button> : null}
      <button type="button" onClick={onSettings}>{labels.settings ?? "Settings"}</button>
      {showApiKeysItem && onApiKeys ? <button type="button" onClick={onApiKeys}>{labels.apiKeys ?? "API keys"}</button> : null}
      {showChatEndpointsItem ? <details><summary>{labels.chatEndpoint ?? "Chat endpoint"}{selectedChatEndpoint ? ` (${selectedChatEndpoint})` : ""}</summary>{chatEndpointOptions.length > 0 && !chatEndpointsDisabled ? <ul>{chatEndpointOptions.map((option) => <li key={option.value}><button type="button" disabled={option.disabled} onClick={() => onSelectChatEndpoint?.(option.value)}>{option.value === selectedChatEndpoint ? "✓ " : ""}{option.label}</button></li>)}</ul> : <p>{labels.noChatEndpoints ?? "No chat endpoints available"}</p>}</details> : null}
      {capabilities.length > 0 && onToggleProviderForType ? <details><summary>{labels.providers ?? "Providers"}</summary>{capabilities.map((capability) => <details key={capability.key}><summary>{capability.label}</summary>{capability.providers.map((provider) => <UserMenuCheckbox key={`${capability.key}:${provider}`} capability={capability.key} provider={provider} checked={(enabledProvidersByType[capability.key] ?? []).includes(provider)} disabled={!!providersDisabled || disabledProviderSet.has(provider)} onToggleProviderForType={onToggleProviderForType} />)}</details>)}</details> : null}
      <button type="button" onClick={onLogout}>{labels.logout ?? "Log out"}</button>
    </details>
  );
};

const navItemMatchesActive = (item: any, activeKey?: string): boolean => {
  if (!activeKey) return false;
  const itemValue = item?.key ?? item?.eventKey;
  return itemValue === activeKey || item?.eventKey === activeKey || (Array.isArray(item?.children) && item.children.some((child: any) => navItemMatchesActive(child, activeKey)));
};

const NavigationRow = ({ item, activeKey, onSelect, onRename, onDelete, onExport, onTogglePin, translations }: any) => {
  const [editing, setEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(String(item.label ?? ""));
  const itemValue = item.key ?? item.eventKey;
  const submit = async () => { if (onRename && editValue.trim()) await onRename(item.key, editValue.trim()); setEditing(false); };
  if (editing) return <input autoFocus value={editValue} onChange={(event) => setEditValue(event.target.value)} onBlur={() => void submit()} onKeyDown={(event) => { if (event.key === "Enter") void submit(); if (event.key === "Escape") setEditing(false); }} />;
  return <div><button type="button" disabled={item.disabled} aria-current={navItemMatchesActive(item, activeKey) ? "page" : undefined} onClick={() => item.onClick ? item.onClick() : onSelect?.(itemValue)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>{icon(item.icon)}{item.icon ? " " : null}<span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>{item.badge ? <small style={{ marginLeft: "auto" }}>{item.badge}</small> : null}{item.new ? ` (${translations?.new ?? "new"})` : ""}</button>{item.conversationItem ? <details><summary>{item.pinned ? "★" : "…"}</summary>{onRename ? <button type="button" onClick={() => { setEditValue(String(item.label ?? "")); setEditing(true); }}>{translations?.rename ?? "Rename"}</button> : null}{onExport ? <button type="button" onClick={() => void onExport(item.key)}>{translations?.export ?? "Export"}</button> : null}{onTogglePin ? <button type="button" onClick={() => void onTogglePin(item.key)}>{item.pinned ? (translations?.unpin ?? "Unpin") : (translations?.pin ?? "Pin")}</button> : null}{onDelete ? <button type="button" onClick={() => void onDelete(item.key)}>{translations?.delete ?? "Delete"}</button> : null}</details> : null}</div>;
};

export const Navigation = ({ items = [], appTitle, activeKey, onSelect, onClose, storageType = "local", onStorageSwitch, translations, onRename, onDelete, onExport, onTogglePin, ...rest }: any) => {
  const renderItem = (item: any, index: number): React.ReactNode => {
    const key = item.key ?? item.eventKey ?? index;
    if (item.key === "divider") return <hr key={key} />;
    if (item.key?.startsWith?.("section:")) return <p key={key}><strong>{item.label}</strong></p>;
    if (item.children?.length) return <details key={key} open={navItemMatchesActive(item, activeKey)}><summary>{icon(item.icon)} {item.label}</summary>{item.children.map(renderItem)}</details>;
    return <NavigationRow key={key} item={item} activeKey={activeKey} onSelect={onSelect} onRename={onRename} onDelete={onDelete} onExport={onExport} onTogglePin={onTogglePin} translations={translations} />;
  };
  return <nav {...rest}><header><strong>{appTitle ?? "AIHappey"}</strong>{onStorageSwitch ? <Button onClick={() => onStorageSwitch(storageType === "local" ? "remote" : "local")}>{storageType}</Button> : null}{onClose ? <CloseButton onClick={onClose} /> : null}</header>{items.map(renderItem)}</nav>;
};

export const Tab = ({ children }: any) => <>{children}</>;
export const Tabs = ({ activeKey, onSelect, children, ...rest }: any) => {
  const tabs = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<any>[];
  const selectedKey = activeKey ?? tabs[0]?.props.eventKey;
  return <div {...rest}><div role="tablist">{tabs.map((tab) => <button key={tab.props.eventKey} type="button" role="tab" aria-selected={tab.props.eventKey === selectedKey} disabled={tab.props.disabled} onClick={() => onSelect?.(tab.props.eventKey)}>{icon(tab.props.icon)}{tab.props.icon ? " " : null}{tab.props.title}</button>)}</div>{tabs.map((tab) => <section key={tab.props.eventKey} hidden={tab.props.eventKey !== selectedKey}>{tab.props.children}</section>)}</div>;
};

export const Accordion = ({ items = [], openItems, defaultOpenItems = [], onToggle, ...rest }: any) => <div {...rest}>{items.map((item: any) => <details key={item.key} open={(openItems ?? defaultOpenItems).includes(item.key)} onToggle={(event) => onToggle?.((event.currentTarget as HTMLDetailsElement).open ? [...(openItems ?? []), item.key] : (openItems ?? []).filter((key: string) => key !== item.key))}><summary>{item.header}</summary>{item.content}</details>)}</div>;

export const Toast = ({ message, show = true, onClose, ...rest }: any) => show ? <output role="status" {...rest}>{message}<CloseButton onClick={onClose} /></output> : <></>;
export const Toaster = ({ toasts = [], ...rest }: any) => <section aria-live="polite" {...rest}>{toasts.map((toast: any) => <Toast key={toast.id} {...toast} />)}</section>;

export const Carousel = ({ children, ...rest }: any) => <div {...rest}>{children}</div>;

export const ThemeSettings = () => <p>HTML theme uses native browser styling.</p>;

export const htmlTheme: AihUiTheme = {
  AvatarGroup,
  DataGrid: DataGrid as any,
  Header,
  JsonViewer,
  Breadcrumb,
  Button: Button as any,
  ToggleButton: ToggleButton as any,
  UserMenu,
  Input: Input as any,
  Image,
  Card,
  Alert,
  Accordion,
  Spinner,
  Modal,
  Tabs,
  Tab,
  Badge,
  Table,
  CloseButton,
  Select,
  SearchBox,
  ProgressBar,
  Switch,
  TextArea,
  AudioPlayer,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  Chat: ({ messages, renderMessage, renderReactions, locale, aiGeneratedLabel, aiGeneratedWarning }: { messages?: ChatMessage[]; locale?: string; aiGeneratedLabel?: string; aiGeneratedWarning?: string; renderMessage: (msg: ChatMessage) => React.ReactElement; renderReactions?: (msg: ChatMessage) => React.ReactElement }) => <Chat messages={messages} renderMessage={renderMessage} renderReactions={renderReactions} locale={locale} aiGeneratedLabel={aiGeneratedLabel} aiGeneratedWarning={aiGeneratedWarning} />,
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

export const Chat = ({ messages, renderMessage, renderReactions, locale, aiGeneratedLabel, aiGeneratedWarning, disableProviderLogo }: { messages?: ChatMessage[]; locale?: string; aiGeneratedLabel?: string; aiGeneratedWarning?: string; disableProviderLogo?: boolean; renderMessage: (msg: ChatMessage) => React.ReactElement; renderReactions?: (msg: ChatMessage) => React.ReactElement }) => (
  <section
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      width: "100%",
    }}
  >
    {messages?.map((msg) => {
      const isUser = msg.role === "user";
      const isAssistant = msg.role === "assistant";
      const streaming = msg.content?.some((part: any) => part.type === "text" && part.state === "streaming");
      const providerLogo = !disableProviderLogo && isAssistant && msg.providerIcon?.src ? msg.providerIcon : undefined;
      const messageIcon = !isUser && msg.messageIcon ? msg.messageIcon : undefined;

      return (
        <article
          key={msg.id}
          style={{
            alignSelf: isUser ? "flex-end" : "flex-start",
            boxSizing: "border-box",
            maxWidth: "min(75%, 48rem)",
            minWidth: 0,
            overflowWrap: "anywhere",
            textAlign: isUser ? "right" : "left",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.35rem",
              justifyContent: isUser ? "flex-end" : "flex-start",
              marginBlockEnd: "0.35rem",
            }}
          >
            {providerLogo ? <img src={providerLogo.src} alt={providerLogo.alt ?? msg.providerName ?? msg.providerKey ?? ""} width={24} height={24} style={{ borderRadius: 4, objectFit: "contain" }} /> : null}
            {messageIcon ? icon(messageIcon, 18) : null}
            {msg.author ? <strong>{msg.author}</strong> : null}
            {isAssistant && aiGeneratedWarning ? <abbr title={aiGeneratedWarning}>{aiGeneratedLabel ?? "AI"}</abbr> : null}
            <time>{format(msg.createdAt, locale)}</time>
          </header>
          {msg.messageLabel ? <p style={{ marginBlock: "0 0.35rem" }}>{msg.messageLabel}</p> : null}
          <div>{renderMessage(msg)}</div>
          {(streaming || renderReactions) ? (
            <footer style={{ marginBlockStart: "0.35rem" }}>
              {streaming ? <ProgressBar animated /> : renderReactions?.(msg)}
            </footer>
          ) : null}
        </article>
      );
    })}
  </section>
);
