import * as React from "react";
import { cva } from "class-variance-authority";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as ProgressPrimitive from "@radix-ui/react-progress";
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
  MoreHorizontal,
  Menu as MenuIcon,
  Mic,
  MonitorCog,
  MoreVertical,
  Network,
  Paintbrush,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Pause,
  Pencil,
  Pin,
  PinOff,
  Play,
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
  VolumeX,
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
type ShadcnColorMode = "light" | "dark";

export const ShadcnColorModeContext = React.createContext<ShadcnColorMode>("light");

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
  contextMenu: MoreVertical,
  navigationMenu: MenuIcon,
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

function PlusIcon(props: LucideProps) {
  return <X {...props} style={{ transform: "rotate(45deg)", ...(props.style ?? {}) }} />;
}

function MessagesIcon(props: LucideProps) {
  return <Bot {...props} />;
}

function WarningIcon(props: LucideProps) {
  return <ShieldCheck {...props} />;
}

function StarFilledIcon(props: LucideProps) {
  return <Star {...props} fill="currentColor" />;
}

const PortalThemeScope = ({ children }: { children: React.ReactNode }) => {
  const colorMode = React.useContext(ShadcnColorModeContext);

  return <div className={cn("aih-shadcn-portal-root", colorMode)}>{children}</div>;
};

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

export const ToggleButton = ({ checked = false, variant, className, icon, iconPosition = "left", children, ...rest }: any) => {
  const checkedSubtle = checked && (variant === "subtle" || variant === "transparent" || variant === "ghost");

  return (
    <Button
      variant={variant ?? (checked ? "primary" : "outline")}
      icon={icon}
      iconPosition={iconPosition}
      aria-pressed={checked}
      data-state={checked ? "on" : "off"}
      className={cn(checkedSubtle && "aih-shadcn-toggle-active", className)}
      {...rest}
    >
      {children}
    </Button>
  );
};

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

const EMPTY_SELECT_ITEM_VALUE = "__aih_shadcn_empty_select_item__";

type ShadcnSelectOption = {
  type: "option";
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

type ShadcnSelectGroup = {
  type: "group";
  label: React.ReactNode;
  options: ShadcnSelectOption[];
};

type ShadcnSelectNode = ShadcnSelectOption | ShadcnSelectGroup;

function toSelectItemValue(value: string) {
  return value === "" ? EMPTY_SELECT_ITEM_VALUE : value;
}

function fromSelectItemValue(value: string) {
  return value === EMPTY_SELECT_ITEM_VALUE ? "" : value;
}

function parseSelectNodes(children: React.ReactNode): ShadcnSelectNode[] {
  const out: ShadcnSelectNode[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<any>(child)) return;
    const element = child as React.ReactElement<any>;
    if (element.type === React.Fragment) out.push(...parseSelectNodes(element.props.children));
    else if (element.type === "option") out.push({ type: "option", value: String(element.props.value ?? ""), label: element.props.children, disabled: element.props.disabled });
    else if (element.type === "optgroup") {
      const groupOptions = flattenSelectOptions(element.props.children);
      if (groupOptions.length > 0) out.push({ type: "group", label: element.props.label, options: groupOptions });
    }
  });
  return out;
}

function flattenSelectOptions(children: React.ReactNode): ShadcnSelectOption[] {
  const options: ShadcnSelectOption[] = [];
  for (const node of parseSelectNodes(children)) {
    if (node.type === "option") options.push(node);
    else options.push(...node.options);
  }
  return options;
}

function findSelectLabel(options: ShadcnSelectOption[], value: string): React.ReactNode {
  return options.find((option) => option.value === value)?.label ?? value;
}

function getSelectSearchText(value: React.ReactNode): string {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(getSelectSearchText).join(" ");
  if (React.isValidElement<{ children?: React.ReactNode }>(value)) return getSelectSearchText(value.props.children);
  return "";
}

function optionMatchesSearch(option: ShadcnSelectOption, normalizedSearch: string) {
  if (!normalizedSearch) return true;
  const haystack = `${getSelectSearchText(option.label)} ${option.value}`.toLowerCase();
  return haystack.includes(normalizedSearch);
}

function filterSelectNodes(nodes: ShadcnSelectNode[], search: string): ShadcnSelectNode[] {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return nodes;

  const filteredNodes: ShadcnSelectNode[] = [];
  for (const node of nodes) {
    if (node.type === "option") {
      if (optionMatchesSearch(node, normalizedSearch)) filteredNodes.push(node);
      continue;
    }

    const matchingOptions = node.options.filter((option) => optionMatchesSearch(option, normalizedSearch));
    if (matchingOptions.length > 0) filteredNodes.push({ ...node, options: matchingOptions });
  }

  return filteredNodes;
}

function countSelectOptions(nodes: ShadcnSelectNode[]) {
  return nodes.reduce((count, node) => count + (node.type === "option" ? 1 : node.options.length), 0);
}

function SelectDropdownViewport({ children }: { children: React.ReactNode }) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = React.useState({ up: false, down: false });

  const updateScrollState = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
    setScrollState({
      up: viewport.scrollTop > 1,
      down: viewport.scrollTop < maxScrollTop - 1,
    });
  }, []);

  React.useEffect(() => {
    updateScrollState();
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.addEventListener("scroll", updateScrollState, { passive: true });
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateScrollState) : undefined;
    resizeObserver?.observe(viewport);
    return () => {
      viewport.removeEventListener("scroll", updateScrollState);
      resizeObserver?.disconnect();
    };
  }, [children, updateScrollState]);

  const scrollBy = (delta: number) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    viewportRef.current?.scrollBy({ top: delta, behavior: "smooth" });
  };

  return (
    <>
      <button type="button" className="aih-shadcn-select-scroll-button" disabled={!scrollState.up} onClick={scrollBy(-180)} aria-label="Scroll up"><ChevronUp size={14} /></button>
      <div ref={viewportRef} className="aih-shadcn-select-viewport aih-shadcn-dropdown-select-viewport">
        {children}
      </div>
      <button type="button" className="aih-shadcn-select-scroll-button" disabled={!scrollState.down} onClick={scrollBy(180)} aria-label="Scroll down"><ChevronDown size={14} /></button>
    </>
  );
}

function renderSingleSelectOption(option: ShadcnSelectOption, selected: string, onChange: ((value: string) => void) | undefined, key: React.Key) {
  return (
    <DropdownMenuPrimitive.Item
      key={key}
      disabled={option.disabled}
      className="aih-shadcn-menu-item aih-shadcn-select-item"
      onSelect={() => {
        if (option.value !== selected) onChange?.(option.value);
      }}
    >
      <span className="aih-shadcn-select-item-indicator">{option.value === selected ? <Check size={14} /> : null}</span>
      <span>{option.label}</span>
    </DropdownMenuPrimitive.Item>
  );
}

function renderSingleSelectNodes(nodes: ShadcnSelectNode[], selected: string, onChange: ((value: string) => void) | undefined) {
  return nodes.map((node, index) => {
    if (node.type === "option") return renderSingleSelectOption(node, selected, onChange, `option:${node.value}:${index}`);
    return (
      <React.Fragment key={`group:${String(node.label)}:${index}`}>
        {index > 0 ? <DropdownMenuPrimitive.Separator className="aih-shadcn-menu-separator" /> : null}
        <DropdownMenuPrimitive.Group>
          <DropdownMenuPrimitive.Label className="aih-shadcn-select-group-label">{node.label}</DropdownMenuPrimitive.Label>
          {node.options.map((option, optionIndex) => renderSingleSelectOption(option, selected, onChange, `group:${String(node.label)}:${option.value}:${optionIndex}`))}
        </DropdownMenuPrimitive.Group>
      </React.Fragment>
    );
  });
}

function renderMultiSelectNodes(nodes: ShadcnSelectNode[], selectedValues: string[], onChange: ((value: string) => void) | undefined) {
  return nodes.map((node, index) => {
    if (node.type === "option") return renderMultiSelectOption(node, selectedValues, onChange, `option:${node.value}:${index}`);
    return (
      <React.Fragment key={`group:${String(node.label)}:${index}`}>
        {index > 0 ? <DropdownMenuPrimitive.Separator className="aih-shadcn-menu-separator" /> : null}
        <DropdownMenuPrimitive.Group>
          <DropdownMenuPrimitive.Label className="aih-shadcn-select-group-label">{node.label}</DropdownMenuPrimitive.Label>
          {node.options.map((option, optionIndex) => renderMultiSelectOption(option, selectedValues, onChange, `group:${String(node.label)}:${option.value}:${optionIndex}`))}
        </DropdownMenuPrimitive.Group>
      </React.Fragment>
    );
  });
}

function renderMultiSelectOption(option: ShadcnSelectOption, selectedValues: string[], onChange: ((value: string) => void) | undefined, key: React.Key) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      key={key}
      checked={selectedValues.includes(option.value)}
      disabled={option.disabled}
      className="aih-shadcn-menu-item aih-shadcn-multiselect-item"
      onSelect={(event) => {
        event.preventDefault();
        if (option.disabled) return;
        onChange?.(option.value);
      }}
    >
      <DropdownMenuPrimitive.ItemIndicator className="aih-shadcn-multiselect-item-indicator"><Check size={14} /></DropdownMenuPrimitive.ItemIndicator>
      <span className="aih-shadcn-multiselect-item-label">{option.label}</span>
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

export const Select = ({ values = [], value, onChange, label, hint, required, children, disabled, valueTitle, style, className, icon, multiselect, placeholder, size, searchable, searchPlaceholder = "Search...", noResultsText = "No results", ...rest }: any) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const optionNodes = React.useMemo(() => parseSelectNodes(children), [children]);
  const filteredOptionNodes = React.useMemo(() => filterSelectNodes(optionNodes, searchable ? search : ""), [optionNodes, search, searchable]);
  const options = React.useMemo(() => flattenSelectOptions(children), [children]);
  const filteredOptionCount = React.useMemo(() => countSelectOptions(filteredOptionNodes), [filteredOptionNodes]);
  const selectedValues = React.useMemo(() => {
    if (Array.isArray(values) && values.length > 0) return values.map((v) => String(v));
    if (typeof value === "string" && value.length > 0) return [value];
    return [];
  }, [values, value]);
  const selected = selectedValues[0] ?? "";
  const hasEmptyOption = options.some((option) => option.value === "");
  const Icon = icon ? iconMap[icon as IconToken] : ChevronDown;
  const triggerStyle = label ? undefined : style;
  const triggerHeight = size === "small" ? 32 : size === "large" ? 40 : 36;
  const displayValue = valueTitle != null && valueTitle !== ""
    ? valueTitle
    : selectedValues.length > 0
      ? selectedValues.map((selectedValue, index) => (
        <React.Fragment key={selectedValue}>
          {index > 0 ? ", " : null}
          {findSelectLabel(options, selectedValue)}
        </React.Fragment>
      ))
      : selected === "" && hasEmptyOption
        ? findSelectLabel(options, "")
        : undefined;
  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      disabled={disabled}
      className={cn("aih-shadcn-select-trigger", className)}
      style={{ display: "inline-flex", height: triggerHeight, alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0 .75rem", ...(triggerStyle ?? {}) }}
      aria-label={rest["aria-label"]}
      aria-required={required || undefined}
    >
      <span className="aih-shadcn-select-value">{displayValue ?? placeholder ?? "Select..."}</span>
      <Icon size={16} />
    </button>
  );
  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    if (disabled && nextOpen) return;
    setOpen(nextOpen);
    if (!nextOpen) setSearch("");
  }, [disabled]);
  React.useEffect(() => {
    if (disabled && open) handleOpenChange(false);
  }, [disabled, handleOpenChange, open]);
  React.useEffect(() => {
    if (!open || !searchable) return;

    const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, searchable]);
  const searchBox = searchable ? (
    <div className="aih-shadcn-select-search">
      <SearchIcon className="aih-shadcn-select-search-icon" size={16} />
      <input
        ref={searchInputRef}
        className="aih-shadcn-input aih-shadcn-select-search-input"
        value={search}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") event.stopPropagation();
        }}
        onPointerDown={(event) => event.stopPropagation()}
      />
    </div>
  ) : null;
  const noResults = searchable && filteredOptionCount === 0 ? <div className="aih-shadcn-select-empty">{noResultsText}</div> : null;
  // Keep a dropdown opened from a modal inside that modal's DOM subtree. Radix
  // Dialog's scroll lock otherwise treats a body-portalled menu as external and
  // suppresses wheel/touch scrolling over it.
  const portalContainer = triggerRef.current?.closest<HTMLElement>(".aih-shadcn-dialog-content") ?? undefined;
  const multiselectDropdown = (
    <DropdownMenuPrimitive.Root modal={false} open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuPrimitive.Trigger asChild disabled={disabled}>{trigger}</DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal container={portalContainer}>
        <PortalThemeScope>
          <DropdownMenuPrimitive.Content className="aih-shadcn-popover aih-shadcn-select-content aih-shadcn-multiselect-content" align="start" sideOffset={4} collisionPadding={8}>
            {searchBox}
            {noResults ?? renderMultiSelectNodes(filteredOptionNodes, selectedValues, onChange)}
          </DropdownMenuPrimitive.Content>
        </PortalThemeScope>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
  const select = (
    <DropdownMenuPrimitive.Root modal={false} open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuPrimitive.Trigger asChild disabled={disabled}>{trigger}</DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal container={portalContainer}>
        <PortalThemeScope>
          <DropdownMenuPrimitive.Content className="aih-shadcn-popover aih-shadcn-select-content" align="start" sideOffset={4} collisionPadding={8}>
            {searchBox}
            <SelectDropdownViewport>
              {noResults ?? renderSingleSelectNodes(filteredOptionNodes, selected, onChange)}
            </SelectDropdownViewport>
          </DropdownMenuPrimitive.Content>
        </PortalThemeScope>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
  const element = multiselect ? multiselectDropdown : select;
  return label ? <Field label={label} hint={hint} required={required} style={style}>{element}</Field> : element;
};

export const SearchBox = ({ value, onChange, placeholder, className, style, ...rest }: any) => (
  <div style={{ position: "relative", ...style }}>
    <SearchIcon size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--aih-shadcn-muted-foreground)" }} />
    <input className={cn("aih-shadcn-input", className)} style={{ paddingLeft: 34 }} value={value} placeholder={placeholder} onChange={(e) => onChange?.(e.target.value)} {...rest} />
  </div>
);

export const Switch = ({ checked, onChange, label, className, id, ...rest }: any) => (
  <label className={cn("aih-shadcn-label", className)} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
    <SwitchPrimitive.Root id={id} className="aih-shadcn-switch" checked={checked} onCheckedChange={onChange} {...rest}>
      <SwitchPrimitive.Thumb className="aih-shadcn-switch-thumb" />
    </SwitchPrimitive.Root>
    {label}
  </label>
);

export const Slider = ({ value, onChange, min = 0, max = 100, step = 1, label, disabled, showValue, valueFormat, className, style, id }: any) => (
  <div className={cn("aih-shadcn-field", className)} style={style}>
    {label ? <label htmlFor={id} className="aih-shadcn-label">{label}{showValue ? ` ${valueFormat ? valueFormat(value) : value}` : ""}</label> : null}
    <SliderPrimitive.Root id={id} className="aih-shadcn-slider" value={[value]} onValueChange={([v]) => onChange?.(v)} min={min} max={max} step={step} disabled={disabled}>
      <SliderPrimitive.Track className="aih-shadcn-slider-track">
        <SliderPrimitive.Range className="aih-shadcn-slider-range" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="aih-shadcn-slider-thumb" />
    </SliderPrimitive.Root>
  </div>
);

export const Range = ({ value, onChange, min = 0, max = 100, step = 1, label, minLabel = "Minimum", maxLabel = "Maximum", disabled, showValue, valueFormat, className, style, id }: any) => {
  const nextValue = Array.isArray(value) ? [Number(value[0] ?? min), Number(value[1] ?? max)] : [min, max];
  const formatValue = (v: number) => valueFormat ? valueFormat(v) : String(v);

  return (
    <div className={cn("aih-shadcn-field", className)} style={style}>
      {label ? <label htmlFor={id} className="aih-shadcn-label">{label}{showValue ? ` ${formatValue(nextValue[0])} – ${formatValue(nextValue[1])}` : ""}</label> : null}
      <SliderPrimitive.Root id={id} className="aih-shadcn-slider" value={nextValue} onValueChange={([from, to]) => onChange?.([from, to])} min={min} max={max} step={step} disabled={disabled}>
        <SliderPrimitive.Track className="aih-shadcn-slider-track">
          <SliderPrimitive.Range className="aih-shadcn-slider-range" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="aih-shadcn-slider-thumb" aria-label={minLabel} />
        <SliderPrimitive.Thumb className="aih-shadcn-slider-thumb" aria-label={maxLabel} />
      </SliderPrimitive.Root>
    </div>
  );
};

export const Header = ({ level = 1, className, children, style }: any) => {
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  return <Tag className={className} style={{ margin: 0, fontWeight: 700, letterSpacing: "-.025em", ...style }}>{children}</Tag>;
};

export const Text = ({ as = "span", children, style, weight, italic, underline, strikethrough, truncate, block, align, font, size, wrap }: any) => {
  const Tag = as as keyof React.JSX.IntrinsicElements;
  return <Tag style={{ display: block ? "block" : undefined, fontWeight: weight === "bold" ? 700 : weight === "semibold" ? 600 : weight === "medium" ? 500 : undefined, fontStyle: italic ? "italic" : undefined, textDecoration: underline ? "underline" : strikethrough ? "line-through" : undefined, overflow: truncate ? "hidden" : undefined, textOverflow: truncate ? "ellipsis" : undefined, whiteSpace: truncate ? "nowrap" : wrap ? "normal" : undefined, textAlign: align, fontFamily: font === "monospace" ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined, fontSize: size ? `${Number(size) / 100}rem` : undefined, ...style }}>{children}</Tag>;
};

export const Paragraph = ({ children, className, style, ...rest }: any) => <p className={className} style={{ marginBlock: "0 1rem", color: "var(--aih-shadcn-muted-foreground)", ...style }} {...rest}>{children}</p>;

const getBadgeToneClass = (tone?: string) => {
  const normalizedTone = tone?.toLowerCase();
  if (normalizedTone === "error" || normalizedTone === "danger" || normalizedTone === "destructive" || normalizedTone === "severe") return "danger";
  if (normalizedTone === "success") return "success";
  if (normalizedTone === "info" || normalizedTone === "informative") return "info";
  if (normalizedTone === "primary" || normalizedTone === "brand") return "primary";
  return undefined;
};

export const Badge = ({ bg, color, appearance, variant = "default", icon, text, children, className, ...rest }: any) => {
  const Icon = icon ? iconMap[icon as IconToken] : undefined;
  const tone = color ?? bg ?? (variant !== "default" ? variant : undefined) ?? (appearance !== "filled" ? appearance : undefined);
  const toneClass = getBadgeToneClass(tone);
  const visualVariant = appearance === "outline" || variant === "outline" || tone === "outline"
    ? "outline"
    : appearance === "ghost"
      ? "ghost"
      : appearance === "subtle"
        ? "subtle"
        : appearance === "tint"
          ? "tint"
          : variant === "secondary" || appearance === "secondary"
            ? "secondary"
            : undefined;
  const mapped = visualVariant ?? toneClass ?? (tone ? "secondary" : "primary");
  const shouldApplyTone = Boolean(toneClass && mapped !== "ghost" && mapped !== "subtle" && mapped !== toneClass);
  return <span className={cn("aih-shadcn-badge", `aih-shadcn-badge-${mapped}`, shouldApplyTone && `aih-shadcn-badge-tone-${toneClass}`, className)} {...rest}>{Icon ? <Icon size={12} /> : null}{children ?? text}</span>;
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
export const ProgressBar = ({ value = 0, label, className, animated }: any) => {
  const normalizedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("aih-shadcn-progress", className)}>
      <ProgressPrimitive.Root
        className={cn("aih-shadcn-progress-root", animated && "aih-shadcn-progress-indeterminate")}
        value={animated ? undefined : normalizedValue}
        aria-label={label}
      >
        <ProgressPrimitive.Indicator
          className="aih-shadcn-progress-indicator"
          style={animated ? undefined : { width: `${normalizedValue}%` }}
        />
      </ProgressPrimitive.Root>
      {label ? <div className="aih-shadcn-progress-label">{label}</div> : null}
    </div>
  );
};
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

function parseJson(input: unknown): any | null {
  if (typeof input === "object") return input;
  try {
    return JSON.parse(String(input));
  } catch {
    return null;
  }
}

const JsonValue = ({ data }: { data: any }) => {
  if (typeof data === "object" && data !== null) {
    if (Array.isArray(data)) {
      return (
        <details open>
          <summary>[Array] ({data.length} items)</summary>
          <ul>
            {data.map((item, idx) => (
              <li key={idx}>
                <JsonValue data={item} />
              </li>
            ))}
          </ul>
        </details>
      );
    }

    return (
      <details open>
        <summary>{`{Object}`}</summary>
        <ul>
          {Object.entries(data).map(([key, val]) => (
            <li key={key}>
              <strong>{key}: </strong>
              <JsonValue data={val} />
            </li>
          ))}
        </ul>
      </details>
    );
  }

  return <span className="aih-shadcn-json-primitive">{JSON.stringify(data)}</span>;
};

export const JsonViewer = ({ value, data, title, className, style }: any) => {
  const json = parseJson(value ?? data);

  if (json === null) {
    return <div className="aih-shadcn-json-error">Invalid JSON</div>;
  }

  return (
    <div className={cn("aih-shadcn-json-viewer", className)} style={style}>
      {title ? (
        <details open>
          <summary>{title}</summary>
          <ul>
            <li><JsonValue data={json} /></li>
          </ul>
        </details>
      ) : (
        <JsonValue data={json} />
      )}
    </div>
  );
};

const Avatar = ({ image, icon, initials, name, shape = "circular", size = 32, className, style, ...rest }: any) => <AvatarPrimitive.Root className={className} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, minWidth: size, borderRadius: shape === "square" ? "var(--aih-shadcn-radius)" : "50%", overflow: "hidden", background: "var(--aih-shadcn-muted)", color: "var(--aih-shadcn-foreground)", fontSize: Math.max(10, size / 2.5), border: "1px solid var(--aih-shadcn-background)", ...style }} {...rest}>{image?.src ? <AvatarPrimitive.Image src={image.src} alt={image.alt ?? name} style={{ width: "100%", height: "100%", objectFit: "cover", ...(image.style ?? {}) }} /> : null}<AvatarPrimitive.Fallback>{icon ?? initials ?? name?.slice(0, 2)?.toUpperCase()}</AvatarPrimitive.Fallback></AvatarPrimitive.Root>;
export const AvatarGroup: any = ({ children, layout = "stack", size = 32, className, style, ...rest }: any) => <div className={className} role="group" style={{ display: "inline-flex", alignItems: "center", height: size, ...(layout === "stack" ? { gap: 0 } : { gap: 6 }), ...style }} {...rest}>{React.Children.map(children, (child, index) => {
  if (!React.isValidElement(child)) return child;
  return React.cloneElement(child as React.ReactElement<any>, {
    size: (child.props as any).size ?? size,
    style: {
      marginLeft: layout === "stack" && index > 0 ? Math.floor(size * -0.28) : 0,
      zIndex: React.Children.count(children) - index,
      ...((child.props as any).style ?? {}),
    },
  });
})}</div>;
AvatarGroup.Avatar = Avatar;
AvatarGroup.Item = (props: any) => <Avatar {...props} style={{ marginLeft: -6, ...(props.style ?? {}) }} />;
AvatarGroup.Popover = ({ children, count }: any) => <span className="aih-shadcn-badge aih-shadcn-badge-secondary">{children ?? `+${count ?? 0}`}</span>;
AvatarGroup.partitionItems = <T,>({ items, maxInlineItems = 5 }: { items: readonly T[]; maxInlineItems?: number }) => ({ inlineItems: items.slice(0, maxInlineItems), overflowItems: items.length > maxInlineItems ? items.slice(maxInlineItems) : undefined });

export const Tags = ({ items = [], onRemove, className, style }: any) => (
  <div className={className} style={{ display: "flex", flexWrap: "wrap", gap: 6, ...style }}>
    {items.map((item: any) => {
      const Icon = item.icon ? iconMap[item.icon as IconToken] : undefined;
      return (
        <span key={item.key} className="aih-shadcn-badge aih-shadcn-badge-secondary">
          {Icon ? <Icon size={12} /> : null}
          {item.image ? <img src={item.image} alt="" className="aih-shadcn-tag-image" /> : null}
          {item.label ?? item.text ?? item.key}
          {onRemove ? (
            <button
              type="button"
              className="aih-shadcn-tag-remove"
              aria-label="Remove"
              title="Remove"
              onClick={(event) => {
                event.stopPropagation();
                void onRemove(item.key);
              }}
            >
              <X size={12} />
            </button>
          ) : null}
        </span>
      );
    })}
  </div>
);
export const Breadcrumb = ({ items = [], separator = <ChevronRight size={14} />, className, style }: any) => <nav className={className} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--aih-shadcn-muted-foreground)", ...style }}>{items.map((item: any, index: number) => { const Icon = item.icon ? iconMap[item.icon as IconToken] : undefined; return <React.Fragment key={item.key}>{index > 0 ? separator : null}<button onClick={item.onClick} style={{ display: "inline-flex", alignItems: "center", gap: 4, border: 0, background: "transparent", color: "inherit", cursor: item.onClick ? "pointer" : undefined }}>{Icon ? <Icon size={14} /> : null}{item.label}</button></React.Fragment>; })}</nav>;

type ShadcnAudioPlayerProps = {
  src: string;
  autoPlay?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

const formatAudioTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";

  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = rounded % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const AudioPlayer = ({ src, autoPlay, className, style, ...rest }: ShadcnAudioPlayerProps & Record<string, any>) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [muted, setMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const durationIsFinite = Number.isFinite(duration) && duration > 0;
  const seekMax = durationIsFinite ? duration : 100;
  const seekValue = durationIsFinite ? Math.min(current, seekMax) : 0;
  const volumeValue = muted ? 0 : volume;

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncPlayback = () => setPlaying(!audio.paused && !audio.ended);
    const syncTime = () => setCurrent(audio.currentTime || 0);
    const syncDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const syncVolume = () => {
      setMuted(audio.muted);
      setVolume(audio.volume);
    };
    const handleEnded = () => {
      setPlaying(false);
      setCurrent(audio.duration || 0);
    };

    audio.addEventListener("play", syncPlayback);
    audio.addEventListener("pause", syncPlayback);
    audio.addEventListener("timeupdate", syncTime);
    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("durationchange", syncDuration);
    audio.addEventListener("volumechange", syncVolume);
    audio.addEventListener("ended", handleEnded);

    syncPlayback();
    syncTime();
    syncDuration();
    syncVolume();

    return () => {
      audio.removeEventListener("play", syncPlayback);
      audio.removeEventListener("pause", syncPlayback);
      audio.removeEventListener("timeupdate", syncTime);
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("volumechange", syncVolume);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  React.useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
  }, [src]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused || audio.ended) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  const seekTo = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !durationIsFinite) return;

    audio.currentTime = value;
    setCurrent(value);
  };

  const toggleMuted = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !audio.muted;
  };

  const changeVolume = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = value;
    audio.muted = value === 0;
    setVolume(value);
    setMuted(value === 0);
  };

  return (
    <div className={cn("aih-shadcn-audio-player", className)} style={style}>
      <audio ref={audioRef} src={src} autoPlay={autoPlay} preload="metadata" {...rest} />

      <ButtonBase
        variant="ghost"
        size="small"
        title={playing ? "Pause" : "Play"}
        aria-label={playing ? "Pause audio" : "Play audio"}
        className="aih-shadcn-audio-button"
        onClick={togglePlayback}
      >
        {playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
      </ButtonBase>

      <div className="aih-shadcn-audio-main">
        <SliderPrimitive.Root
          className="aih-shadcn-slider aih-shadcn-audio-seek"
          value={[seekValue]}
          onValueChange={([value]) => seekTo(value)}
          min={0}
          max={seekMax}
          step={0.1}
          disabled={!durationIsFinite}
          aria-label="Audio progress"
        >
          <SliderPrimitive.Track className="aih-shadcn-slider-track">
            <SliderPrimitive.Range className="aih-shadcn-slider-range" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="aih-shadcn-slider-thumb" />
        </SliderPrimitive.Root>
        <div className="aih-shadcn-audio-time" aria-live="off">
          <span>{formatAudioTime(current)}</span>
          <span aria-hidden="true">/</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>

      <div className="aih-shadcn-audio-volume">
        <ButtonBase
          variant="ghost"
          size="small"
          title={muted || volume === 0 ? "Unmute" : "Mute"}
          aria-label={muted || volume === 0 ? "Unmute audio" : "Mute audio"}
          className="aih-shadcn-audio-button"
          onClick={toggleMuted}
        >
          {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </ButtonBase>
        <SliderPrimitive.Root
          className="aih-shadcn-slider aih-shadcn-audio-volume-slider"
          value={[volumeValue]}
          onValueChange={([value]) => changeVolume(value)}
          min={0}
          max={1}
          step={0.05}
          aria-label="Audio volume"
        >
          <SliderPrimitive.Track className="aih-shadcn-slider-track">
            <SliderPrimitive.Range className="aih-shadcn-slider-range" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="aih-shadcn-slider-thumb" />
        </SliderPrimitive.Root>
      </div>
    </div>
  );
};

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
            <div className="aih-shadcn-dialog-header">
              {title ? <DialogPrimitive.Title className="aih-shadcn-card-title">{title}</DialogPrimitive.Title> : null}
              <DialogPrimitive.Close asChild><CloseButtonBase aria-label="Close" /></DialogPrimitive.Close>
            </div>
            <div className="aih-shadcn-dialog-body">{children}</div>
            {actions ? <div className="aih-shadcn-dialog-footer">{actions}</div> : null}
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

export const Menu = ({ items = [], trigger, align = "right", direction = "bottom", size = "small", className }: any) => {
  const render = (menuItems: any[] = [], parentKey = "menu") => menuItems.map((item, index) => {
    const itemKey = `${parentKey}:${item.key ?? item.label ?? index}:${index}`;
    const Icon = item.icon ? iconMap[item.icon as IconToken] : undefined;
    return item.children?.length ? (
      <DropdownMenuPrimitive.Sub key={itemKey}>
        <DropdownMenuPrimitive.SubTrigger disabled={item.disabled} className="aih-shadcn-menu-item">{Icon ? <Icon size={14} /> : null}{item.label}</DropdownMenuPrimitive.SubTrigger>
        <DropdownMenuPrimitive.Portal>
          <PortalThemeScope>
            <DropdownMenuPrimitive.SubContent className="aih-shadcn-popover aih-shadcn-menu-sub-content" sideOffset={4} collisionPadding={8}>{render(item.children, itemKey)}</DropdownMenuPrimitive.SubContent>
          </PortalThemeScope>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Sub>
    ) : (
      <DropdownMenuPrimitive.Item key={itemKey} disabled={item.disabled} className={cn("aih-shadcn-menu-item", item.danger && "aih-shadcn-menu-item-danger")} onSelect={() => item.onClick?.()}>{Icon ? <Icon size={14} /> : null}{item.label}</DropdownMenuPrimitive.Item>
    );
  });
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>{trigger ?? <Button variant="ghost" size={size} icon="contextMenu" className={className} />}</DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <PortalThemeScope>
          <DropdownMenuPrimitive.Content className="aih-shadcn-popover aih-shadcn-menu-content" align={align === "left" ? "start" : "end"} side={direction === "top" ? "top" : "bottom"} sideOffset={4} collisionPadding={8}>{render(items)}</DropdownMenuPrimitive.Content>
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
  showChatEndpointsItem,
  chatEndpointOptions = [],
  selectedChatEndpoint,
  chatEndpointsDisabled,
  onSelectChatEndpoint,
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

  const chatEndpointMenu = showChatEndpointsItem ? (
    chatEndpointOptions.length > 0 && !chatEndpointsDisabled ? (
      <DropdownMenuPrimitive.Sub>
        <DropdownMenuPrimitive.SubTrigger className="aih-shadcn-menu-item">
          <PlugZap size={14} />
          {selectedChatEndpoint
            ? `${labels.chatEndpoint ?? "Chat endpoint"} (${selectedChatEndpoint})`
            : (labels.chatEndpoint ?? "Chat endpoint")}
        </DropdownMenuPrimitive.SubTrigger>
        <DropdownMenuPrimitive.Portal>
          <PortalThemeScope>
            <DropdownMenuPrimitive.SubContent className="aih-shadcn-popover aih-shadcn-menu-sub-content" sideOffset={4} collisionPadding={8}>
              {chatEndpointOptions.map((option) => (
                <DropdownMenuPrimitive.Item
                  key={option.value}
                  className="aih-shadcn-menu-item"
                  disabled={!!option.disabled}
                  onSelect={() => onSelectChatEndpoint?.(option.value)}
                >
                  {option.value === selectedChatEndpoint ? <Check size={14} /> : <span style={{ width: 14, display: "inline-block" }} />}
                  {option.label}
                </DropdownMenuPrimitive.Item>
              ))}
            </DropdownMenuPrimitive.SubContent>
          </PortalThemeScope>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Sub>
    ) : (
      <DropdownMenuPrimitive.Item className="aih-shadcn-menu-item" disabled>
        <PlugZap size={14} />
        {labels.noChatEndpoints ?? "No chat endpoints available"}
      </DropdownMenuPrimitive.Item>
    )
  ) : null;

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
                      {chatEndpointMenu}
                      {chatEndpointMenu ? menuDivider : null}
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
            {!providers.length ? chatEndpointMenu : null}
            {!providers.length && chatEndpointMenu ? menuDivider : null}
            {menuDivider}
            <DropdownMenuPrimitive.Item className="aih-shadcn-menu-item" onSelect={onLogout}><KeyRound size={14} />{labels.logout ?? "Log out"}</DropdownMenuPrimitive.Item>
          </DropdownMenuPrimitive.Content>
        </PortalThemeScope>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
};

const navItemMatchesActive = (item: any, activeKey?: string): boolean => {
  if (!activeKey) return false;
  const itemValue = item?.key ?? item?.eventKey;
  if (itemValue === activeKey || item?.eventKey === activeKey) return true;
  return Array.isArray(item?.children) && item.children.some((child: any) => navItemMatchesActive(child, activeKey));
};

type ShadcnNavItemRowProps = {
  item: any;
  itemKey: string;
  activeKey?: string;
  onSelect?: (key: string) => void;
  onRename?: (key: string, value: string) => Promise<void> | void;
  onDelete?: (key: string) => Promise<void> | void;
  onExport?: (key: string) => Promise<void> | void;
  onTogglePin?: (key: string) => Promise<void> | void;
  onToggleNavigationItemHidden?: (key: string) => Promise<void> | void;
  translations?: any;
  editingId: string | null;
  editValue: string;
  setEditingId: (value: string | null) => void;
  setEditValue: (value: string) => void;
};

const ShadcnNavItemRow = ({
  item,
  itemKey,
  activeKey,
  onSelect,
  onRename,
  onDelete,
  onExport,
  onTogglePin,
  onToggleNavigationItemHidden,
  translations,
  editingId,
  editValue,
  setEditingId,
  setEditValue,
}: ShadcnNavItemRowProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const itemValue = item.key ?? item.eventKey;
  const selected = !!activeKey && (itemValue === activeKey || item.eventKey === activeKey);
  const Icon = item.icon ? iconMap[item.icon as IconToken] : undefined;
  const isEditing = editingId === item.key;
  const showConversationActions = !!item.conversationItem && (!!onRename || !!onExport || !!onTogglePin || !!onDelete);
  const showNavigationItemActions = !!item.configurableNavigationItem && !!onToggleNavigationItemHidden;

  const submitRename = async () => {
    const trimmed = editValue.trim();
    if (onRename && trimmed) await onRename(item.key, trimmed);
    setEditingId(null);
  };

  if (isEditing && onRename) {
    return (
      <div key={itemKey} className="aih-shadcn-nav-row aih-shadcn-nav-row-editing">
        <input
          autoFocus
          className="aih-shadcn-input aih-shadcn-nav-edit-input"
          value={editValue}
          onChange={(event) => setEditValue(event.target.value)}
          onBlur={() => void submitRename()}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submitRename();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setEditingId(null);
            }
          }}
        />
      </div>
    );
  }

  const actionButton = showConversationActions || showNavigationItemActions ? (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          className="aih-shadcn-nav-action"
          aria-label={translations?.conversationActions ?? translations?.actions ?? "Conversation actions"}
          data-pinned={item.pinned ? "true" : undefined}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {isHovered || !item.pinned ? <MoreHorizontal size={16} /> : <Pin size={16} />}
        </button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <PortalThemeScope>
          <DropdownMenuPrimitive.Content className="aih-shadcn-popover aih-shadcn-menu-content" align="end" sideOffset={4} collisionPadding={8}>
            {item.conversationItem && onRename ? (
              <DropdownMenuPrimitive.Item
                className="aih-shadcn-menu-item"
                onSelect={(event) => {
                  event.stopPropagation();
                  setEditingId(item.key);
                  setEditValue(String(item.label ?? ""));
                }}
              >
                <Pencil size={14} />{translations?.rename ?? "Rename"}
              </DropdownMenuPrimitive.Item>
            ) : null}
            {item.conversationItem && onExport ? (
              <DropdownMenuPrimitive.Item
                className="aih-shadcn-menu-item"
                onSelect={(event) => {
                  event.stopPropagation();
                  void onExport(item.key);
                }}
              >
                <ArrowRight size={14} />{translations?.export ?? "Export"}
              </DropdownMenuPrimitive.Item>
            ) : null}
            {item.conversationItem && (onRename || onExport) && (onTogglePin || onDelete) ? menuDivider : null}
            {item.conversationItem && onTogglePin ? (
              <DropdownMenuPrimitive.Item
                className="aih-shadcn-menu-item"
                onSelect={(event) => {
                  event.stopPropagation();
                  void onTogglePin(item.key);
                }}
              >
                {item.pinned ? <PinOff size={14} /> : <Pin size={14} />}{item.pinned ? (translations?.unpin ?? "Unpin") : (translations?.pin ?? "Pin")}
              </DropdownMenuPrimitive.Item>
            ) : null}
            {item.conversationItem && onDelete ? (
              <DropdownMenuPrimitive.Item
                className="aih-shadcn-menu-item aih-shadcn-menu-item-danger"
                onSelect={(event) => {
                  event.stopPropagation();
                  void onDelete(item.key);
                }}
              >
                <Trash2 size={14} />{translations?.delete ?? "Delete"}
              </DropdownMenuPrimitive.Item>
            ) : null}
            {showNavigationItemActions ? (
              <DropdownMenuPrimitive.Item
                className="aih-shadcn-menu-item"
                onSelect={(event) => {
                  event.stopPropagation();
                  void onToggleNavigationItemHidden?.(item.key);
                }}
              >
                {item.hiddenNavigationItem ? <Eye size={14} /> : <X size={14} />}{item.hiddenNavigationItem ? (translations?.show ?? "Show") : (translations?.hide ?? "Hide")}
              </DropdownMenuPrimitive.Item>
            ) : null}
          </DropdownMenuPrimitive.Content>
        </PortalThemeScope>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  ) : null;

  return (
    <div
      key={itemKey}
      className="aih-shadcn-nav-row"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        className={cn("aih-shadcn-btn aih-shadcn-nav-button", selected ? "aih-shadcn-btn-secondary" : "aih-shadcn-btn-ghost")}
        disabled={item.disabled}
        onClick={() => { item.onClick ? item.onClick() : onSelect?.(itemValue); }}
      >
        {Icon ? <Icon size={18} /> : null}
        <span className="aih-shadcn-nav-label">{item.label}</span>
        {item.badge ? React.isValidElement(item.badge) ? item.badge : <Badge variant="outline">{item.badge}</Badge> : null}
        {item.new ? <Badge variant="outline">{translations?.new ?? "new"}</Badge> : null}
      </button>
      {actionButton}
    </div>
  );
};

export const Navigation = ({ items = [], appTitle, activeKey, onSelect, className, style, onClose, storageType = "local", onStorageSwitch, translations, onRename, onDelete, onExport, onTogglePin, onToggleNavigationItemHidden }: any) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const activeCategoryKeys = React.useMemo(
    () => items
      .map((item: any, index: number) => ({ item, key: `nav:${item.key ?? item.eventKey ?? item.label ?? index}:${index}` }))
      .filter(({ item }: any) => item?.children?.length && navItemMatchesActive(item, activeKey))
      .map(({ key }: any) => key),
    [activeKey, items]
  );
  const [openCategoryKeys, setOpenCategoryKeys] = React.useState<string[]>(activeCategoryKeys);

  React.useEffect(() => {
    if (!activeCategoryKeys.length) return;
    setOpenCategoryKeys((current) => Array.from(new Set([...current, ...activeCategoryKeys])));
  }, [activeCategoryKeys]);

  const renderHeader = () => (
    <div className="aih-shadcn-nav-header">
      <div className="aih-shadcn-nav-app-title" title={appTitle ?? "AIHappey"}>{appTitle ?? "AIHappey"}</div>
      <div className="aih-shadcn-nav-header-actions">
        {onStorageSwitch ? (
          <Button
            icon={storageType === "local" ? "storage" : "sources"}
            size="small"
            variant="ghost"
            aria-label="Switch storage"
            title={`Storage: ${storageType === "local" ? "Local" : "Cloud"}`}
            onClick={() => onStorageSwitch(storageType === "local" ? "remote" : "local")}
          />
        ) : null}
        <Button
          icon="navigationMenu"
          size="small"
          variant="ghost"
          aria-label={translations?.closeNavigation ?? "Close navigation"}
          title={translations?.closeNavigation ?? "Close navigation"}
          onClick={onClose}
        />
      </div>
    </div>
  );

  const renderItem = (item: any, index: number, parentKey = "nav") => {
    const itemKey = `${parentKey}:${item.key ?? item.eventKey ?? item.label ?? index}:${index}`;
    if (item.key === "divider") return <SeparatorPrimitive.Root key={itemKey} className="aih-shadcn-nav-divider" />;
    if (item.key?.startsWith?.("section:")) return <div key={itemKey} className="aih-shadcn-hint aih-shadcn-nav-section-label">{item.label}</div>;
    if (item.children?.length) {
      const Icon = item.icon ? iconMap[item.icon as IconToken] : undefined;
      return (
        <AccordionPrimitive.Item key={itemKey} value={itemKey} className="aih-shadcn-nav-category">
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="aih-shadcn-nav-category-trigger">
              <span className="aih-shadcn-nav-category-label">{Icon ? <Icon size={18} /> : null}{item.label}</span>
              <ChevronDown size={16} className="aih-shadcn-nav-category-chevron" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="aih-shadcn-nav-category-content">
            {item.children.map((child: any, childIndex: number) => renderItem(child, childIndex, itemKey))}
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      );
    }
    return (
      <ShadcnNavItemRow
        key={itemKey}
        item={item}
        itemKey={itemKey}
        activeKey={activeKey}
        onSelect={onSelect}
        onRename={onRename}
        onDelete={onDelete}
        onExport={onExport}
        onTogglePin={onTogglePin}
        onToggleNavigationItemHidden={onToggleNavigationItemHidden}
        translations={translations}
        editingId={editingId}
        editValue={editValue}
        setEditingId={setEditingId}
        setEditValue={setEditValue}
      />
    );
  };

  return (
    <nav className={cn("aih-shadcn-nav", className)} style={style}>
      {renderHeader()}
      <AccordionPrimitive.Root
        type="multiple"
        value={openCategoryKeys}
        onValueChange={setOpenCategoryKeys}
        className="aih-shadcn-nav-list"
      >
        {items.map((item: any, index: number) => renderItem(item, index))}
      </AccordionPrimitive.Root>
    </nav>
  );
};

export const Tab = ({ children }: any) => <>{children}</>;
export const Tabs = ({ activeKey, onSelect, vertical, fill, children, className, style }: any) => {
  const tabs = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<any>[];
  const tabsList = (
    <TabsPrimitive.List
      className={cn(
        "aih-shadcn-tabs-list",
        vertical ? "aih-shadcn-tabs-list-vertical" : "aih-shadcn-tabs-list-horizontal",
        fill && !vertical && "aih-shadcn-tabs-list-fill"
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.props.icon ? iconMap[tab.props.icon as IconToken] : undefined;
        return (
          <TabsPrimitive.Trigger key={tab.props.eventKey} value={tab.props.eventKey} disabled={tab.props.disabled} className="aih-shadcn-tabs-trigger">
            {Icon ? <Icon size={14} /> : null}
            <span className="aih-shadcn-tabs-trigger-label">{tab.props.title}</span>
          </TabsPrimitive.Trigger>
        );
      })}
    </TabsPrimitive.List>
  );

  return (
    <TabsPrimitive.Root
      value={activeKey}
      onValueChange={onSelect}
      orientation={vertical ? "vertical" : "horizontal"}
      className={cn("aih-shadcn-tabs", vertical ? "aih-shadcn-tabs-vertical" : "aih-shadcn-tabs-horizontal", className)}
      style={{ display: vertical ? "flex" : undefined, gap: vertical ? 12 : undefined, maxWidth: "100%", minWidth: 0, minHeight: 0, ...style }}
    >
      {vertical ? tabsList : <div className="aih-shadcn-tabs-scroll">{tabsList}</div>}
      {tabs.map((tab) => (
        <TabsPrimitive.Content key={tab.props.eventKey} value={tab.props.eventKey} className="aih-shadcn-tabs-content">
          {tab.props.children}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
};

export const Accordion = ({ items = [], openItems, defaultOpenItems, onToggle, multiple, collapsible = true, className, style }: any) => <AccordionPrimitive.Root type={multiple ? "multiple" : "single" as any} value={multiple ? openItems : openItems?.[0]} defaultValue={multiple ? defaultOpenItems : defaultOpenItems?.[0]} collapsible={collapsible} onValueChange={(value: string | string[]) => onToggle?.(Array.isArray(value) ? value : value ? [value] : [])} className={className} style={style}>{items.map((item: any) => <AccordionPrimitive.Item key={item.key} value={item.key} disabled={item.disabled} className={item.className} style={{ borderBottom: "1px solid var(--aih-shadcn-border)" }}><AccordionPrimitive.Header><AccordionPrimitive.Trigger style={{ display: "flex", width: "100%", justifyContent: "space-between", padding: ".75rem 0", border: 0, background: "transparent", color: "inherit", fontWeight: 500 }}>{item.header}<ChevronDown size={16} /></AccordionPrimitive.Trigger></AccordionPrimitive.Header><AccordionPrimitive.Content style={{ padding: "0 0 .75rem" }}>{item.content}</AccordionPrimitive.Content></AccordionPrimitive.Item>)}</AccordionPrimitive.Root>;

export const Toast = ({ id, variant, message, show, autohide, onClose }: any) => <ToastPrimitive.Provider swipeDirection="right" duration={autohide}><ToastPrimitive.Root className="aih-shadcn-toast-root" open={show} onOpenChange={(open) => !open && onClose?.()} data-variant={variant}><ToastPrimitive.Title>{message}</ToastPrimitive.Title><ToastPrimitive.Close asChild><CloseButtonBase aria-label="Close" /></ToastPrimitive.Close></ToastPrimitive.Root><ToastPrimitive.Viewport className="aih-shadcn-portal-root aih-shadcn-toast-viewport" /></ToastPrimitive.Provider>;
export const Toaster = ({ toasts = [], position }: any) => <ToastPrimitive.Provider>{toasts.map((toast: any) => <ToastPrimitive.Root key={toast.id} className="aih-shadcn-toast-root" open={toast.show ?? true} onOpenChange={(open) => !open && toast.onClose?.()}><ToastPrimitive.Title>{toast.message ?? toast.title}</ToastPrimitive.Title>{toast.description ? <ToastPrimitive.Description>{toast.description}</ToastPrimitive.Description> : null}</ToastPrimitive.Root>)}<ToastPrimitive.Viewport className="aih-shadcn-portal-root aih-shadcn-toast-viewport" style={position?.includes?.("top") ? { top: 16, bottom: "auto" } : undefined} /></ToastPrimitive.Provider>;

export const Carousel = ({ children, className, style }: any) => <div className={className} style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", gap: 12, ...style }}>{React.Children.map(children, (child) => <div style={{ flex: "0 0 100%", scrollSnapAlign: "start" }}>{child}</div>)}</div>;

export const Chat = ({ messages, renderMessage, renderReactions, locale, aiGeneratedLabel, aiGeneratedWarning, disableProviderLogo }: { messages?: ChatMessage[]; locale?: string; aiGeneratedLabel?: string; aiGeneratedWarning?: string; disableProviderLogo?: boolean; renderMessage: (msg: ChatMessage) => React.ReactElement; renderReactions?: (msg: ChatMessage) => React.ReactElement }) => (
  <div className="aih-shadcn-chat">
    {messages?.map((msg) => {
      const isUser = msg.role === "user";
      const isAssistant = msg.role === "assistant";
      const streaming = msg.content?.some((a: any) => a.type === "text" && a.state === "streaming");
      const Icon = msg.messageIcon ? iconMap[msg.messageIcon] : undefined;
      const isActivity = msg.messageIcon === "brain" || msg.messageIcon === "tool";
      const providerLogo = !disableProviderLogo && isAssistant && msg.providerIcon?.src ? msg.providerIcon : undefined;

      return (
        <article key={msg.id} className={cn("aih-shadcn-chat-message", isUser ? "aih-shadcn-chat-message-user" : "aih-shadcn-chat-message-assistant", isActivity && "aih-shadcn-chat-message-activity")}>
          <header className="aih-shadcn-chat-header">
            <span className="aih-shadcn-chat-header-meta">
              {providerLogo ? <Avatar image={{ src: providerLogo.src, alt: providerLogo.alt ?? msg.providerName }} name={msg.providerName ?? msg.providerKey} size={24} shape="square" /> : null}
              {msg.author ? <span>{msg.author}</span> : null}
              {isAssistant && aiGeneratedWarning ? (
                <TooltipPrimitive.Provider>
                  <TooltipPrimitive.Root>
                    <TooltipPrimitive.Trigger asChild>
                      <span><Badge variant="outline">{aiGeneratedLabel ?? "AI"}</Badge></span>
                    </TooltipPrimitive.Trigger>
                    <TooltipPrimitive.Portal>
                      <PortalThemeScope>
                        <TooltipPrimitive.Content className="aih-shadcn-popover aih-shadcn-tooltip-content">{aiGeneratedWarning}</TooltipPrimitive.Content>
                      </PortalThemeScope>
                    </TooltipPrimitive.Portal>
                  </TooltipPrimitive.Root>
                </TooltipPrimitive.Provider>
              ) : null}
              <time>{format(msg.createdAt, locale)}</time>
            </span>
            {Icon ? <span className={cn("aih-shadcn-chat-header-icon", isActivity && "aih-shadcn-chat-header-icon-activity")}><Icon size={18} /></span> : null}
          </header>
          {msg.messageLabel ? <div className="aih-shadcn-hint" style={{ padding: ".5rem .75rem 0" }}>{msg.messageLabel}</div> : null}
          <div className="aih-shadcn-chat-body">{renderMessage(msg)}</div>
          {streaming || renderReactions ? <footer className="aih-shadcn-chat-footer">{streaming ? <ProgressBar animated /> : renderReactions?.(msg)}</footer> : null}
        </article>
      );
    })}
  </div>
);

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
  Range,
  ThemeSettings,
};

