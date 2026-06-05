import * as React from "react";
import { cva } from "class-variance-authority";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as ToastPrimitive from "@radix-ui/react-toast";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  Activity,
  AppWindow,
  ArrowDown,
  ArrowDownAZ,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeDollarSign,
  Beaker,
  Bot,
  Brain,
  BrainCircuit,
  Building2,
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
  MoreVertical,
  Network,
  Paintbrush,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Pencil,
  Plug,
  PlugZap,
  Puzzle,
  Radio,
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
  Wallet,
  WandSparkles,
  Wrench,
  X,
  type LucideProps,
} from "lucide-react";
import { format } from "timeago.js";
import type { AihUiTheme, IconToken, ChatMessage, GenericDataGridColumn } from "aihappey-types";
import type { ButtonProps } from "aihappey-types/src/theme/Button";
import type { CloseButtonProps } from "aihappey-types/src/theme/CloseButton";
import type { ProviderCapability, UserMenuProps } from "aihappey-types/src/theme/UserMenu";
import { cn } from "./utils";
import { ThemeSettings } from "./ShadcnSettings";

type IconComponent = React.ComponentType<LucideProps>;

export const iconMap: Record<IconToken, IconComponent> = {
  add: PlusIcon,
  edit: Pencil,
  delete: Trash2,
  send: Send,
  robot: Bot,
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
  chat: MessagesIcon,
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
  menu: MenuIcon,
  globe: Globe,
  connect: PlugZap,
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
  starFilled: Star,
};

function PlusIcon(props: LucideProps) {
  return <X {...props} style={{ transform: "rotate(45deg)", ...(props.style ?? {}) }} />;
}

function MessagesIcon(props: LucideProps) {
  return <Bot {...props} />;
}

function WarningIcon(props: LucideProps) {
  return <ShieldCheck {...props} />;
}

const PortalThemeScope = ({ children }: { children: React.ReactNode }) => (
  <div className="aih-shadcn-portal-root">{children}</div>
);

const buttonVariants = cva("aih-shadcn-btn", {
  variants: {
    variant: {
      primary: "aih-shadcn-btn-primary",
      secondary: "aih-shadcn-btn-secondary",
      outline: "aih-shadcn-btn-outline",
      ghost: "aih-shadcn-btn-ghost",
      subtle: "aih-shadcn-btn-subtle",
      transparent: "aih-shadcn-btn-ghost",
      danger: "aih-shadcn-btn-danger",
      destructive: "aih-shadcn-btn-danger",
    },
    size: {
      sm: "aih-shadcn-btn-sm",
      small: "aih-shadcn-btn-sm",
      medium: "aih-shadcn-btn-md",
      md: "aih-shadcn-btn-md",
      lg: "aih-shadcn-btn-lg",
      large: "aih-shadcn-btn-lg",
    },
  },
  defaultVariants: { variant: "primary", size: "medium" },
});

const ButtonBase = React.forwardRef<HTMLButtonElement, ButtonProps>(function ButtonBase({
  variant = "primary",
  size = "medium",
  icon,
  iconPosition = "left",
  children,
  className,
  title,
  type,
  ...rest
}, ref) {
  const Icon = icon ? iconMap[icon] : undefined;
  const hasChildren = React.Children.count(children) > 0;
  const button = (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(
        buttonVariants({ variant: variant as any, size: size as any }),
        icon && !hasChildren && "aih-shadcn-btn-icon",
        className
      )}
      title={title}
      {...rest}
    >
      {Icon && iconPosition === "left" ? <Icon size={16} /> : null}
      {children}
      {Icon && iconPosition === "right" ? <Icon size={16} /> : null}
    </button>
  );
  return title ? (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{button}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <PortalThemeScope>
            <TooltipPrimitive.Content className="aih-shadcn-popover aih-shadcn-tooltip-content" sideOffset={4}>{title}</TooltipPrimitive.Content>
          </PortalThemeScope>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  ) : button;
});

export const Button = ButtonBase as unknown as (props: ButtonProps) => React.JSX.Element;

export const ToggleButton = ({ checked = false, variant, className, icon, iconPosition = "left", children, ...rest }: any) => (
  <Button
    variant={variant ?? (checked ? "primary" : "outline")}
    icon={icon}
    iconPosition={iconPosition}
    aria-pressed={checked}
    className={className}
    {...rest}
  >
    {children}
  </Button>
);

const CloseButtonBase = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button"> & Partial<CloseButtonProps>>(function CloseButtonBase(props, ref) {
  return <ButtonBase ref={ref} variant="ghost" icon="dismiss" {...props} />;
});
export const CloseButton = CloseButtonBase as unknown as (props: CloseButtonProps) => React.JSX.Element;

export const Toolbar = ({ children, ariaLabel, className, ...rest }: any) => (
  <div role="toolbar" aria-label={ariaLabel} className={cn("aih-shadcn-toolbar", className)} style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", ...(rest.style ?? {}) }} {...rest}>{children}</div>
);

export const ToolbarButton = (props: any) => <Button variant={props.variant ?? "ghost"} {...props} />;
export const ToolbarDivider = () => <SeparatorPrimitive.Root orientation="vertical" style={{ width: 1, height: 24, background: "var(--aih-shadcn-border)", margin: "0 .25rem" }} />;

export const SplitButton = ({ label, icon, iconPosition = "left", menuItems = [], onClick, variant = "primary", ...rest }: any) => (
  <div style={{ display: "inline-flex" }}>
    <Button variant={variant} icon={icon} iconPosition={iconPosition} onClick={onClick} style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }} {...rest}>{label}</Button>
    <Menu items={menuItems} trigger={<Button variant={variant} icon="chevronDown" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, paddingInline: 8 }} />} />
  </div>
);

export const Input = ({ label, hint, orientation, required, className, style, size, ...rest }: any) => {
  const input = <input className={cn("aih-shadcn-input", className)} style={label ? undefined : style} required={required} {...rest} />;
  return label ? <Field label={label} hint={hint} required={required} orientation={orientation} style={style}>{input}</Field> : input;
};

export const TextArea = ({ label, hint, required, rows, readOnly, onChange, className, style, ...rest }: any) => {
  const textarea = <textarea rows={rows} readOnly={readOnly} className={cn("aih-shadcn-textarea", className)} style={label ? undefined : style} onChange={(e) => onChange?.(e.target.value)} {...rest} />;
  return label ? <Field label={label} hint={hint} required={required} style={style}>{textarea}</Field> : textarea;
};

const Field = ({ label, hint, required, orientation, style, children }: any) => (
  <label className="aih-shadcn-field" style={{ ...(orientation === "horizontal" ? { gridTemplateColumns: "minmax(8rem, auto) 1fr", alignItems: "center" } : {}), ...(style ?? {}) }}>
    <span className="aih-shadcn-label">{label}{required ? " *" : ""}</span>
    <span>{children}{hint ? <span className="aih-shadcn-hint">{hint}</span> : null}</span>
  </label>
);

function flattenOptions(children: React.ReactNode): { value: string; label: React.ReactNode; group?: string }[] {
  const out: { value: string; label: React.ReactNode; group?: string }[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<any>(child)) return;
    const element = child as React.ReactElement<any>;
    if (element.type === React.Fragment) out.push(...flattenOptions(element.props.children));
    else if (element.type === "option") out.push({ value: String(element.props.value), label: element.props.children });
    else if (element.type === "optgroup") flattenOptions(element.props.children).forEach((o) => out.push({ ...o, group: element.props.label }));
  });
  return out;
}

export const Select = ({ values = [], onChange, label, hint, required, children, disabled, valueTitle, style, className, icon, ...rest }: any) => {
  const options = React.useMemo(() => flattenOptions(children), [children]);
  const selected = values?.[0] ?? "";
  const Icon = icon ? iconMap[icon as IconToken] : ChevronDown;
  const select = (
    <SelectPrimitive.Root value={selected} disabled={disabled} onValueChange={(value) => onChange?.(value)}>
      <SelectPrimitive.Trigger className={cn("aih-shadcn-select-trigger", className)} style={{ display: "inline-flex", height: 36, alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0 .75rem", ...(label ? {} : style) }} aria-label={rest["aria-label"]}>
        <SelectPrimitive.Value placeholder={valueTitle ?? "Select..."} />
        <SelectPrimitive.Icon><Icon size={16} /></SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <PortalThemeScope>
          <SelectPrimitive.Content className="aih-shadcn-popover aih-shadcn-select-content" position="popper" sideOffset={4} collisionPadding={8}>
          <SelectPrimitive.ScrollUpButton className="aih-shadcn-select-scroll-button"><ChevronUp size={14} /></SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="aih-shadcn-select-viewport">
            {options.map((option) => (
              <SelectPrimitive.Item key={option.value} value={option.value} className="aih-shadcn-menu-item">
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="aih-shadcn-select-scroll-button"><ChevronDown size={14} /></SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </PortalThemeScope>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
  return label ? <Field label={label} hint={hint} required={required} style={style}>{select}</Field> : select;
};

export const SearchBox = ({ value, onChange, placeholder, className, style, ...rest }: any) => (
  <div style={{ position: "relative", ...style }}>
    <SearchIcon size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--aih-shadcn-muted-foreground)" }} />
    <input className={cn("aih-shadcn-input", className)} style={{ paddingLeft: 34 }} value={value} placeholder={placeholder} onChange={(e) => onChange?.(e.target.value)} {...rest} />
  </div>
);

export const Switch = ({ checked, onChange, label, className, id, ...rest }: any) => (
  <label className={cn("aih-shadcn-label", className)} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
    <SwitchPrimitive.Root id={id} checked={checked} onCheckedChange={onChange} style={{ width: 40, height: 22, borderRadius: 999, border: 0, padding: 2, background: checked ? "var(--aih-shadcn-primary)" : "var(--aih-shadcn-muted)", position: "relative" }} {...rest}>
      <SwitchPrimitive.Thumb style={{ display: "block", width: 18, height: 18, borderRadius: 999, background: "var(--aih-shadcn-background)", transform: checked ? "translateX(18px)" : "translateX(0)", transition: "transform .15s" }} />
    </SwitchPrimitive.Root>
    {label}
  </label>
);

export const Slider = ({ value, onChange, min = 0, max = 100, step = 1, label, disabled, showValue, valueFormat, className, style, id }: any) => (
  <div className={cn("aih-shadcn-field", className)} style={style}>
    {label ? <label htmlFor={id} className="aih-shadcn-label">{label}{showValue ? ` ${valueFormat ? valueFormat(value) : value}` : ""}</label> : null}
    <SliderPrimitive.Root id={id} value={[value]} onValueChange={([v]) => onChange?.(v)} min={min} max={max} step={step} disabled={disabled} style={{ position: "relative", display: "flex", alignItems: "center", width: "100%", height: 20 }}>
      <SliderPrimitive.Track style={{ position: "relative", flexGrow: 1, height: 6, borderRadius: 999, background: "var(--aih-shadcn-secondary)" }}>
        <SliderPrimitive.Range style={{ position: "absolute", height: "100%", borderRadius: 999, background: "var(--aih-shadcn-primary)" }} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb style={{ display: "block", width: 16, height: 16, borderRadius: 999, border: "2px solid var(--aih-shadcn-primary)", background: "var(--aih-shadcn-background)" }} />
    </SliderPrimitive.Root>
  </div>
);

export const Header = ({ level = 1, className, children, style }: any) => {
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  return <Tag className={className} style={{ margin: 0, fontWeight: 700, letterSpacing: "-.025em", ...style }}>{children}</Tag>;
};

export const Text = ({ as = "span", children, style, weight, italic, underline, strikethrough, truncate, block, align, font, size, wrap }: any) => {
  const Tag = as as keyof React.JSX.IntrinsicElements;
  return <Tag style={{ display: block ? "block" : undefined, fontWeight: weight === "bold" ? 700 : weight === "semibold" ? 600 : weight === "medium" ? 500 : undefined, fontStyle: italic ? "italic" : undefined, textDecoration: underline ? "underline" : strikethrough ? "line-through" : undefined, overflow: truncate ? "hidden" : undefined, textOverflow: truncate ? "ellipsis" : undefined, whiteSpace: truncate ? "nowrap" : wrap ? "normal" : undefined, textAlign: align, fontFamily: font === "monospace" ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined, fontSize: size ? `${Number(size) / 100}rem` : undefined, ...style }}>{children}</Tag>;
};

export const Paragraph = ({ children, className, style, ...rest }: any) => <p className={className} style={{ marginBlock: "0 1rem", color: "var(--aih-shadcn-muted-foreground)", ...style }} {...rest}>{children}</p>;

export const Badge = ({ variant = "secondary", icon, text, children, className, ...rest }: any) => {
  const Icon = icon ? iconMap[icon as IconToken] : undefined;
  const mapped = variant === "error" || variant === "danger" ? "danger" : variant === "outline" ? "outline" : variant === "primary" ? "primary" : "secondary";
  return <span className={cn("aih-shadcn-badge", `aih-shadcn-badge-${mapped}`, className)} {...rest}>{Icon ? <Icon size={12} /> : null}{children ?? text}</span>;
};

export const Card = ({ title, text, description, children, actions, headerActions, image, className, style }: any) => {
  const hasHeader = image || title || description || headerActions;

  return (
    <div className={cn("aih-shadcn-card", className)} style={style}>
      {hasHeader ? (
        <div className={cn("aih-shadcn-card-header", !image && "aih-shadcn-card-header-no-image")}>
          {image ? <div className="aih-shadcn-card-image">{image}</div> : null}
          <div className="aih-shadcn-card-header-main">
            {title ? <div className="aih-shadcn-card-title">{title}</div> : null}
            {description ? <div className="aih-shadcn-card-description">{description}</div> : null}
          </div>
          {headerActions ? <div className="aih-shadcn-card-header-actions">{headerActions}</div> : null}
        </div>
      ) : null}
      <div className="aih-shadcn-card-content">{children ?? text}</div>
      {actions ? <div className="aih-shadcn-card-footer">{actions}</div> : null}
    </div>
  );
};

export const Image = (props: any) => <img alt="" {...props} style={{ maxWidth: "100%", borderRadius: "var(--aih-shadcn-radius)", ...(props.style ?? {}) }} />;
export const Skeleton = ({ width, height, circle, className, style }: any) => <span className={cn("aih-shadcn-skeleton", className)} style={{ width, height, borderRadius: circle ? "50%" : "var(--aih-shadcn-radius)", ...style }} />;
export const Spinner = ({ size = "sm", className }: any) => <span className={cn("aih-shadcn-spinner", className)} style={{ width: size === "large" || size === "lg" ? 28 : 16, height: size === "large" || size === "lg" ? 28 : 16 }} />;
export const ProgressBar = ({ value = 0, label, className }: any) => <ProgressPrimitive.Root className={cn("aih-shadcn-progress-root", className)}><ProgressPrimitive.Indicator className="aih-shadcn-progress-indicator" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />{label}</ProgressPrimitive.Root>;
export const Table = (props: any) => <table className={cn("aih-shadcn-table", props.className)} {...props} />;

export function DataGrid<T>({ columns = [], data = [], rowKey, className, style }: { columns?: GenericDataGridColumn<T>[]; data?: T[]; rowKey: (row: T) => string | number; className?: string; style?: React.CSSProperties }) {
  const [sort, setSort] = React.useState<{ key?: string; direction: "asc" | "desc" }>({ direction: "asc" });
  const sorted = React.useMemo(() => {
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortFn) return data;
    const copy = [...data].sort(col.sortFn);
    return sort.direction === "asc" ? copy : copy.reverse();
  }, [columns, data, sort]);
  return <table className={cn("aih-shadcn-table", className)} style={style}><thead><tr>{columns.map((col) => <th key={col.key} style={{ width: col.width }}><button type="button" onClick={() => col.sortFn && setSort((s) => ({ key: col.key, direction: s.key === col.key && s.direction === "asc" ? "desc" : "asc" }))} style={{ border: 0, background: "transparent", color: "inherit", font: "inherit", cursor: col.sortFn ? "pointer" : undefined }}>{col.header}{sort.key === col.key ? sort.direction === "asc" ? " ↑" : " ↓" : ""}</button></th>)}</tr></thead><tbody>{sorted.map((row, rowIndex) => <tr key={rowKey?.(row) ?? rowIndex}>{columns.map((col) => <td key={col.key}>{col.render(row, rowIndex)}</td>)}</tr>)}</tbody></table>;
}

export const JsonViewer = ({ value, data, className, style }: any) => <pre className={className} style={{ overflow: "auto", border: "1px solid var(--aih-shadcn-border)", borderRadius: "var(--aih-shadcn-radius)", background: "var(--aih-shadcn-muted)", padding: 12, ...style }}>{JSON.stringify(value ?? data, null, 2)}</pre>;

const Avatar = ({ image, icon, initials, name, shape = "circular", size = 32, className, ...rest }: any) => <AvatarPrimitive.Root className={className} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: shape === "square" ? "var(--aih-shadcn-radius)" : "50%", overflow: "hidden", background: "var(--aih-shadcn-muted)", color: "var(--aih-shadcn-foreground)", fontSize: Math.max(10, size / 2.5), border: "1px solid var(--aih-shadcn-background)" }} {...rest}>{image?.src ? <AvatarPrimitive.Image src={image.src} alt={image.alt ?? name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}<AvatarPrimitive.Fallback>{icon ?? initials ?? name?.slice(0, 2)?.toUpperCase()}</AvatarPrimitive.Fallback></AvatarPrimitive.Root>;
export const AvatarGroup: any = ({ children, layout = "stack", className, style, ...rest }: any) => <div className={className} style={{ display: "flex", alignItems: "center", ...(layout === "stack" ? { gap: 0 } : { gap: 6 }), ...style }} {...rest}>{children}</div>;
AvatarGroup.Avatar = Avatar;
AvatarGroup.Item = (props: any) => <Avatar {...props} style={{ marginLeft: -6, ...(props.style ?? {}) }} />;
AvatarGroup.Popover = ({ children, count }: any) => <span className="aih-shadcn-badge aih-shadcn-badge-secondary">{children ?? `+${count ?? 0}`}</span>;
AvatarGroup.partitionItems = <T,>({ items, maxInlineItems = 5 }: { items: readonly T[]; maxInlineItems?: number }) => ({ inlineItems: items.slice(0, maxInlineItems), overflowItems: items.length > maxInlineItems ? items.slice(maxInlineItems) : undefined });

export const Tags = ({ items = [], className, style }: any) => <div className={className} style={{ display: "flex", flexWrap: "wrap", gap: 6, ...style }}>{items.map((item: any) => <Badge key={item.key} icon={item.icon}>{item.label ?? item.text ?? item.key}</Badge>)}</div>;
export const Breadcrumb = ({ items = [], separator = <ChevronRight size={14} />, className, style }: any) => <nav className={className} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--aih-shadcn-muted-foreground)", ...style }}>{items.map((item: any, index: number) => { const Icon = item.icon ? iconMap[item.icon as IconToken] : undefined; return <React.Fragment key={item.key}>{index > 0 ? separator : null}<button onClick={item.onClick} style={{ display: "inline-flex", alignItems: "center", gap: 4, border: 0, background: "transparent", color: "inherit", cursor: item.onClick ? "pointer" : undefined }}>{Icon ? <Icon size={14} /> : null}{item.label}</button></React.Fragment>; })}</nav>;
export const AudioPlayer = (props: any) => <audio controls {...props} style={{ width: "100%", ...(props.style ?? {}) }} />;

export const Alert = ({ variant, title, onDismiss, children, className }: any) => <div className={cn("aih-shadcn-card", className)} role="alert" style={{ padding: 12, borderColor: variant === "error" || variant === "danger" ? "var(--aih-shadcn-destructive)" : undefined }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>{title ? <strong>{title}</strong> : null}{onDismiss ? <CloseButtonBase onClick={onDismiss} /> : null}</div><div>{children}</div></div>;

export const Modal = ({ open, show, onOpenChange, onHide, title, children, actions, size, centered, modalType }: any) => {
  const isOpen = open ?? show ?? false;
  const width = size === "sm" || size === "small"
    ? "24rem"
    : size === "lg" || size === "large"
      ? "48rem"
      : undefined;

  return (
    <DialogPrimitive.Root
      open={isOpen}
      modal={modalType !== "non-modal"}
      onOpenChange={(nextOpen) => {
        onOpenChange?.(nextOpen);
        if (!nextOpen) onHide?.();
      }}
    >
      <DialogPrimitive.Portal>
        <PortalThemeScope>
          <DialogPrimitive.Overlay className="aih-shadcn-dialog-overlay" />
          <DialogPrimitive.Content
            className="aih-shadcn-dialog-content"
            style={{
              width,
              ...(centered ? { display: "flex", flexDirection: "column", justifyContent: "center" } : {}),
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              {title ? <DialogPrimitive.Title className="aih-shadcn-card-title">{title}</DialogPrimitive.Title> : null}
              <DialogPrimitive.Close asChild><CloseButtonBase aria-label="Close" /></DialogPrimitive.Close>
            </div>
            <div style={{ marginTop: 12 }}>{children}</div>
            {actions ? <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>{actions}</div> : null}
          </DialogPrimitive.Content>
        </PortalThemeScope>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
export const Drawer = ({ open, isOpen, onOpenChange, onClose, title, children, actions }: any) => (
  <DialogPrimitive.Root open={open ?? isOpen} onOpenChange={(v) => { onOpenChange?.(v); if (!v) onClose?.(); }}>
    <DialogPrimitive.Portal>
      <PortalThemeScope>
        <DialogPrimitive.Overlay className="aih-shadcn-dialog-overlay" />
        <DialogPrimitive.Content className="aih-shadcn-drawer-content">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            {title ? <DialogPrimitive.Title className="aih-shadcn-card-title">{title}</DialogPrimitive.Title> : null}
            <DialogPrimitive.Close asChild><CloseButtonBase /></DialogPrimitive.Close>
          </div>
          <div style={{ marginTop: 12 }}>{children}</div>
          {actions}
        </DialogPrimitive.Content>
      </PortalThemeScope>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);

export const Menu = ({ items = [], trigger, align = "right", size = "small", className }: any) => {
  const render = (menuItems: any[] = [], parentKey = "menu") => menuItems.map((item, index) => {
    const itemKey = `${parentKey}:${item.key ?? item.label ?? index}:${index}`;
    const Icon = item.icon ? iconMap[item.icon as IconToken] : undefined;
    return item.children?.length ? (
      <DropdownMenuPrimitive.Sub key={itemKey}>
        <DropdownMenuPrimitive.SubTrigger className="aih-shadcn-menu-item">{Icon ? <Icon size={14} /> : null}{item.label}</DropdownMenuPrimitive.SubTrigger>
        <DropdownMenuPrimitive.Portal>
          <PortalThemeScope>
            <DropdownMenuPrimitive.SubContent className="aih-shadcn-popover aih-shadcn-menu-sub-content" sideOffset={4} collisionPadding={8}>{render(item.children, itemKey)}</DropdownMenuPrimitive.SubContent>
          </PortalThemeScope>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Sub>
    ) : (
      <DropdownMenuPrimitive.Item key={itemKey} className={cn("aih-shadcn-menu-item", item.danger && "aih-shadcn-menu-item-danger")} onSelect={() => item.onClick?.()}>{Icon ? <Icon size={14} /> : null}{item.label}</DropdownMenuPrimitive.Item>
    );
  });
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>{trigger ?? <Button variant="ghost" size={size} icon="menu" className={className} />}</DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <PortalThemeScope>
          <DropdownMenuPrimitive.Content className="aih-shadcn-popover aih-shadcn-menu-content" align={align === "left" ? "start" : "end"} sideOffset={4} collisionPadding={8}>{render(items)}</DropdownMenuPrimitive.Content>
        </PortalThemeScope>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
};

type UserMenuTriggerProps = Pick<UserMenuProps, "email" | "className" | "style"> &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "style">;

const UserMenuTrigger = React.forwardRef<HTMLButtonElement, UserMenuTriggerProps>(function UserMenuTrigger({ email, className, style, ...rest }, ref) {
  return (
  <button
    ref={ref}
    type="button"
    className={className}
    {...rest}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 36,
      height: 36,
      borderRadius: "50%",
      border: "1px solid var(--aih-shadcn-border)",
      background: "var(--aih-shadcn-muted)",
      color: "var(--aih-shadcn-foreground)",
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
      ...style,
    }}
    aria-label={email ?? "User menu"}
  >
    {email ? email[0]?.toUpperCase() : <Users size={18} />}
  </button>
  );
});

const menuDivider = <DropdownMenuPrimitive.Separator className="aih-shadcn-menu-separator" />;

const ProviderCheckboxItem = ({
  capability,
  provider,
  checked,
  disabled,
  onToggleProviderForType,
}: {
  capability: ProviderCapability;
  provider: string;
  checked: boolean;
  disabled?: boolean;
  onToggleProviderForType?: (capability: ProviderCapability, provider: string) => void;
}) => (
  <DropdownMenuPrimitive.CheckboxItem
    key={`${capability}:${provider}`}
    className="aih-shadcn-menu-item"
    checked={checked}
    disabled={disabled}
    onSelect={(event) => event.preventDefault()}
    onCheckedChange={() => onToggleProviderForType?.(capability, provider)}
  >
    <DropdownMenuPrimitive.ItemIndicator><Check size={14} /></DropdownMenuPrimitive.ItemIndicator>
    {provider}
  </DropdownMenuPrimitive.CheckboxItem>
);

export const UserMenu: React.FC<UserMenuProps> = ({
  email,
  onCustomize,
  onSettings,
  onLogout,
  showApiKeysItem,
  onApiKeys,
  providers = [],
  providerGroups = {},
  enabledProvidersByType = {},
  onToggleProviderForType,
  providersDisabled,
  disabledProviders = [],
  className,
  style,
  labels = {},
}) => {
  const disabledProviderSet = React.useMemo(() => new Set(disabledProviders), [disabledProviders]);
  const capabilityMenus = React.useMemo(() => {
    const defs: Array<{ key: ProviderCapability; label: string; providers: string[] }> = [
      { key: "language", label: labels.language ?? "Language", providers: providerGroups.language ?? [] },
      { key: "image", label: labels.image ?? "Image", providers: providerGroups.image ?? [] },
      { key: "audio", label: labels.audio ?? labels.realtime ?? "Realtime", providers: providerGroups.audio ?? [] },
      { key: "transcription", label: labels.transcription ?? "Transcription", providers: providerGroups.transcription ?? [] },
      { key: "speech", label: labels.speech ?? "Speech", providers: providerGroups.speech ?? [] },
      { key: "reranking", label: labels.reranking ?? "Reranking", providers: providerGroups.reranking ?? [] },
      { key: "video", label: labels.video ?? "Video", providers: providerGroups.video ?? [] },
    ];

    return defs
      .filter((d) => d.providers.length > 0)
      .map((d) => {
        const enabled = (enabledProvidersByType[d.key] ?? []).filter((p) => d.providers.includes(p)).length;
        return { ...d, label: `${d.label} (${enabled}/${d.providers.length})` };
      });
  }, [enabledProvidersByType, labels, providerGroups]);

  const renderProviderItem = React.useCallback(
    (capability: ProviderCapability, provider: string) => (
      <ProviderCheckboxItem
        key={`${capability}:${provider}`}
        capability={capability}
        provider={provider}
        checked={(enabledProvidersByType[capability] ?? []).includes(provider)}
        disabled={!!providersDisabled || disabledProviderSet.has(provider)}
        onToggleProviderForType={onToggleProviderForType}
      />
    ),
    [disabledProviderSet, enabledProvidersByType, onToggleProviderForType, providersDisabled]
  );

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <UserMenuTrigger email={email} className={className} style={style} />
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <PortalThemeScope>
          <DropdownMenuPrimitive.Content className="aih-shadcn-popover aih-shadcn-menu-content" align="end" sideOffset={4} collisionPadding={8}>
            {email ? <DropdownMenuPrimitive.Label className="aih-shadcn-hint" style={{ padding: ".5rem .75rem" }}>{email}</DropdownMenuPrimitive.Label> : null}
            {email ? menuDivider : null}
            {onCustomize ? <DropdownMenuPrimitive.Item className="aih-shadcn-menu-item" onSelect={onCustomize}><UserCog size={14} />{labels.customize ?? "Customize"}</DropdownMenuPrimitive.Item> : null}
            <DropdownMenuPrimitive.Item className="aih-shadcn-menu-item" onSelect={onSettings}><Settings size={14} />{labels.settings ?? "Settings"}</DropdownMenuPrimitive.Item>
            {!!providers.length && !!onToggleProviderForType ? (
              <DropdownMenuPrimitive.Sub>
                <DropdownMenuPrimitive.SubTrigger className="aih-shadcn-menu-item"><PlugZap size={14} />{labels.providers ?? "Providers"}</DropdownMenuPrimitive.SubTrigger>
                <DropdownMenuPrimitive.Portal>
                  <PortalThemeScope>
                    <DropdownMenuPrimitive.SubContent className="aih-shadcn-popover aih-shadcn-menu-sub-content" sideOffset={4} collisionPadding={8}>
                      {!!showApiKeysItem && !!onApiKeys ? <DropdownMenuPrimitive.Item className="aih-shadcn-menu-item" onSelect={onApiKeys}><KeyRound size={14} />{labels.apiKeys ?? "API keys"}</DropdownMenuPrimitive.Item> : null}
                      {!!showApiKeysItem && !!onApiKeys ? menuDivider : null}
                      {capabilityMenus.length > 0
                        ? capabilityMenus.map((cap) => (
                            <DropdownMenuPrimitive.Sub key={cap.key}>
                              <DropdownMenuPrimitive.SubTrigger className="aih-shadcn-menu-item">{cap.label}</DropdownMenuPrimitive.SubTrigger>
                              <DropdownMenuPrimitive.Portal>
                                <PortalThemeScope>
                                  <DropdownMenuPrimitive.SubContent className="aih-shadcn-popover aih-shadcn-menu-sub-content" sideOffset={4} collisionPadding={8}>
                                    {cap.providers.map((provider) => renderProviderItem(cap.key, provider))}
                                  </DropdownMenuPrimitive.SubContent>
                                </PortalThemeScope>
                              </DropdownMenuPrimitive.Portal>
                            </DropdownMenuPrimitive.Sub>
                          ))
                        : providers.map((provider) => renderProviderItem("language", provider))}
                    </DropdownMenuPrimitive.SubContent>
                  </PortalThemeScope>
                </DropdownMenuPrimitive.Portal>
              </DropdownMenuPrimitive.Sub>
            ) : (!!showApiKeysItem && !!onApiKeys ? <DropdownMenuPrimitive.Item className="aih-shadcn-menu-item" onSelect={onApiKeys}><KeyRound size={14} />{labels.apiKeys ?? "API keys"}</DropdownMenuPrimitive.Item> : null)}
            {menuDivider}
            <DropdownMenuPrimitive.Item className="aih-shadcn-menu-item" onSelect={onLogout}><KeyRound size={14} />{labels.logout ?? "Log out"}</DropdownMenuPrimitive.Item>
          </DropdownMenuPrimitive.Content>
        </PortalThemeScope>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
};

export const Navigation = ({ items = [], activeKey, onSelect, className, style, onClose }: any) => {
  const renderItem = (item: any, index: number, parentKey = "nav") => {
    const itemKey = `${parentKey}:${item.key ?? item.eventKey ?? item.label ?? index}:${index}`;
    if (item.key === "divider") return <SeparatorPrimitive.Root key={itemKey} style={{ height: 1, background: "var(--aih-shadcn-border)", margin: ".5rem 0" }} />;
    if (item.key?.startsWith?.("section:")) return <div key={itemKey} className="aih-shadcn-hint" style={{ padding: ".5rem .75rem" }}>{item.label}</div>;
    if (item.children?.length) {
      const Icon = item.icon ? iconMap[item.icon as IconToken] : undefined;
      return (
        <div key={itemKey} style={{ display: "grid", gap: 4 }}>
          <div className="aih-shadcn-hint" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: ".5rem .75rem", fontWeight: 600 }}>
            {Icon ? <Icon size={14} /> : null}{item.label}
          </div>
          <div style={{ display: "grid", gap: 4, paddingLeft: 12 }}>
            {item.children.map((child: any, childIndex: number) => renderItem(child, childIndex, itemKey))}
          </div>
        </div>
      );
    }
    return <Button key={itemKey} variant={item.key === activeKey || item.eventKey === activeKey ? "secondary" : "ghost"} icon={item.icon} disabled={item.disabled} onClick={() => { item.onClick?.(); onSelect?.(item.key ?? item.eventKey); onClose?.(); }} style={{ justifyContent: "flex-start" }}>{item.label}</Button>;
  };

  return <nav className={className} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 220, ...style }}>{items.map((item: any, index: number) => renderItem(item, index))}</nav>;
};

export const Tab = ({ children }: any) => <>{children}</>;
export const Tabs = ({ activeKey, onSelect, vertical, children, className, style }: any) => {
  const tabs = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<any>[];
  return <TabsPrimitive.Root value={activeKey} onValueChange={onSelect} className={className} style={{ display: vertical ? "flex" : undefined, gap: vertical ? 12 : undefined, ...style }}><TabsPrimitive.List className="aih-shadcn-tabs-list" style={{ flexDirection: vertical ? "column" : undefined, alignItems: vertical ? "stretch" : undefined }}>{tabs.map((tab) => { const Icon = tab.props.icon ? iconMap[tab.props.icon as IconToken] : undefined; return <TabsPrimitive.Trigger key={tab.props.eventKey} value={tab.props.eventKey} disabled={tab.props.disabled} className="aih-shadcn-tabs-trigger" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{Icon ? <Icon size={14} /> : null}{tab.props.title}</TabsPrimitive.Trigger>; })}</TabsPrimitive.List>{tabs.map((tab) => <TabsPrimitive.Content key={tab.props.eventKey} value={tab.props.eventKey} className="aih-shadcn-tabs-content" style={{ flex: 1 }}>{tab.props.children}</TabsPrimitive.Content>)}</TabsPrimitive.Root>;
};

export const Accordion = ({ items = [], openItems, defaultOpenItems, onToggle, multiple, collapsible = true, className, style }: any) => <AccordionPrimitive.Root type={multiple ? "multiple" : "single" as any} value={multiple ? openItems : openItems?.[0]} defaultValue={multiple ? defaultOpenItems : defaultOpenItems?.[0]} collapsible={collapsible} onValueChange={(value: string | string[]) => onToggle?.(Array.isArray(value) ? value : value ? [value] : [])} className={className} style={style}>{items.map((item: any) => <AccordionPrimitive.Item key={item.key} value={item.key} disabled={item.disabled} className={item.className} style={{ borderBottom: "1px solid var(--aih-shadcn-border)" }}><AccordionPrimitive.Header><AccordionPrimitive.Trigger style={{ display: "flex", width: "100%", justifyContent: "space-between", padding: ".75rem 0", border: 0, background: "transparent", color: "inherit", fontWeight: 500 }}>{item.header}<ChevronDown size={16} /></AccordionPrimitive.Trigger></AccordionPrimitive.Header><AccordionPrimitive.Content style={{ padding: "0 0 .75rem" }}>{item.content}</AccordionPrimitive.Content></AccordionPrimitive.Item>)}</AccordionPrimitive.Root>;

export const Toast = ({ id, variant, message, show, autohide, onClose }: any) => <ToastPrimitive.Provider swipeDirection="right" duration={autohide}><ToastPrimitive.Root className="aih-shadcn-toast-root" open={show} onOpenChange={(open) => !open && onClose?.()} data-variant={variant}><ToastPrimitive.Title>{message}</ToastPrimitive.Title><ToastPrimitive.Close asChild><CloseButtonBase aria-label="Close" /></ToastPrimitive.Close></ToastPrimitive.Root><ToastPrimitive.Viewport className="aih-shadcn-portal-root aih-shadcn-toast-viewport" /></ToastPrimitive.Provider>;
export const Toaster = ({ toasts = [], position }: any) => <ToastPrimitive.Provider>{toasts.map((toast: any) => <ToastPrimitive.Root key={toast.id} className="aih-shadcn-toast-root" open={toast.show ?? true} onOpenChange={(open) => !open && toast.onClose?.()}><ToastPrimitive.Title>{toast.message ?? toast.title}</ToastPrimitive.Title>{toast.description ? <ToastPrimitive.Description>{toast.description}</ToastPrimitive.Description> : null}</ToastPrimitive.Root>)}<ToastPrimitive.Viewport className="aih-shadcn-portal-root aih-shadcn-toast-viewport" style={position?.includes?.("top") ? { top: 16, bottom: "auto" } : undefined} /></ToastPrimitive.Provider>;

export const Carousel = ({ children, className, style }: any) => <div className={className} style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", gap: 12, ...style }}>{React.Children.map(children, (child) => <div style={{ flex: "0 0 100%", scrollSnapAlign: "start" }}>{child}</div>)}</div>;

export const Chat = ({ messages, renderMessage, renderReactions, locale, aiGeneratedLabel, aiGeneratedWarning }: { messages?: ChatMessage[]; locale?: string; aiGeneratedLabel?: string; aiGeneratedWarning?: string; renderMessage: (msg: ChatMessage) => React.ReactElement; renderReactions?: (msg: ChatMessage) => React.ReactElement }) => <div className="aih-shadcn-chat">{messages?.map((msg) => { const isUser = msg.role === "user"; const streaming = msg.content?.some((a: any) => a.type === "text" && a.state === "streaming"); const Icon = msg.messageIcon ? iconMap[msg.messageIcon] : undefined; return <article key={msg.id} className={cn("aih-shadcn-chat-message", isUser ? "aih-shadcn-chat-message-user" : "aih-shadcn-chat-message-assistant")}><header className="aih-shadcn-chat-header"><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{Icon ? <Icon size={16} /> : null}{msg.author}{aiGeneratedWarning ? <TooltipPrimitive.Provider><TooltipPrimitive.Root><TooltipPrimitive.Trigger asChild><span><Badge variant="outline">{aiGeneratedLabel ?? "AI"}</Badge></span></TooltipPrimitive.Trigger><TooltipPrimitive.Portal><PortalThemeScope><TooltipPrimitive.Content className="aih-shadcn-popover aih-shadcn-tooltip-content">{aiGeneratedWarning}</TooltipPrimitive.Content></PortalThemeScope></TooltipPrimitive.Portal></TooltipPrimitive.Root></TooltipPrimitive.Provider> : null}</span><time>{format(msg.createdAt, locale)}</time></header>{msg.messageLabel ? <div className="aih-shadcn-hint" style={{ padding: ".5rem .75rem 0" }}>{msg.messageLabel}</div> : null}<div className="aih-shadcn-chat-body">{renderMessage(msg)}</div>{streaming || renderReactions ? <footer className="aih-shadcn-chat-footer">{streaming ? <ProgressBar value={80} /> : renderReactions?.(msg)}</footer> : null}</article>; })}</div>;

export const ShadcnSettings = ThemeSettings;

export const shadcnTheme: AihUiTheme = {
  AvatarGroup,
  DataGrid: DataGrid as any,
  Header,
  JsonViewer,
  Breadcrumb,
  Button,
  ToggleButton,
  UserMenu,
  Input,
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
  ThemeSettings,
};

