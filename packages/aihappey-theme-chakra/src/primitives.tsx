import * as React from "react";
import * as Chakra from "@chakra-ui/react";
import {
  FaArrowDown,
  FaArrowRight,
  FaArrowUp,
  FaBars,
  FaBookOpen,
  FaBrain,
  FaCalculator,
  FaChartBar,
  FaChartLine,
  FaCheck,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaCircle,
  FaCode,
  FaCog,
  FaComments,
  FaCompressAlt,
  FaCopy,
  FaCube,
  FaDatabase,
  FaDesktop,
  FaDollarSign,
  FaDownload,
  FaEdit,
  FaEnvelope,
  FaExchangeAlt,
  FaExclamation,
  FaExclamationTriangle,
  FaExpandAlt,
  FaExternalLinkAlt,
  FaEye,
  FaFileAlt,
  FaFlask,
  FaFolder,
  FaGavel,
  FaGlobe,
  FaHandshake,
  FaImage,
  FaLanguage,
  FaLayerGroup,
  FaLink,
  FaList,
  FaMagic,
  FaMicrochip,
  FaMicrophone,
  FaPalette,
  FaPaperclip,
  FaPaperPlane,
  FaPlug,
  FaPlus,
  FaPrint,
  FaProjectDiagram,
  FaQuestionCircle,
  FaRegFileAlt,
  FaRegStar,
  FaRobot,
  FaSearch,
  FaServer,
  FaShieldAlt,
  FaSignOutAlt,
  FaSortAmountDown,
  FaStar,
  FaStop,
  FaTable,
  FaTemperatureHigh,
  FaTerminal,
  FaTimes,
  FaTools,
  FaTrash,
  FaUnlink,
  FaUsers,
  FaVideo,
  FaVolumeUp,
  FaWrench,
} from "react-icons/fa";
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

const Box = Chakra.Box as any;
const ButtonBase = Chakra.Button as any;
const IconButtonBase = Chakra.IconButton as any;
const InputBase = Chakra.Input as any;
const TextareaBase = Chakra.Textarea as any;
const BadgeBase = Chakra.Badge as any;
const TextBase = Chakra.Text as any;
const HeadingBase = Chakra.Heading as any;
const ImageBase = Chakra.Image as any;
const SkeletonBase = Chakra.Skeleton as any;
const SpinnerBase = Chakra.Spinner as any;
const CloseButtonBase = Chakra.CloseButton as any;
const Stack = Chakra.Stack as any;
const HStack = Chakra.HStack as any;
const VStack = Chakra.VStack as any;
const CardRoot = (Chakra.Card as any)?.Root ?? (Chakra.CardRoot as any);
const CardHeader = (Chakra.Card as any)?.Header ?? (Chakra.CardHeader as any);
const CardBody = (Chakra.Card as any)?.Body ?? (Chakra.CardBody as any);
const CardFooter = (Chakra.Card as any)?.Footer ?? (Chakra.CardFooter as any);
const AlertRoot = (Chakra.Alert as any)?.Root ?? (Chakra.AlertRoot as any);
const AlertIndicator = (Chakra.Alert as any)?.Indicator ?? (Chakra.AlertIndicator as any);
const AlertTitle = (Chakra.Alert as any)?.Title ?? (Chakra.AlertTitle as any);
const AlertDescription = (Chakra.Alert as any)?.Description ?? (Chakra.AlertDescription as any);
const Separator = Chakra.Separator as any;

type IconProps = { size?: number | string; style?: React.CSSProperties };
type IconComponent = (props: IconProps) => React.JSX.Element;
type SelectOptionData = { type: "option"; value: string; label: string; disabled?: boolean };
type SelectGroupData = { type: "group"; group: string; items: SelectOptionData[] };
type SelectNodeData = SelectOptionData | SelectGroupData;

const iconStyle: React.CSSProperties = { display: "inline-block", flex: "0 0 auto", lineHeight: 1, verticalAlign: "-0.125em" };
const makeIcon = (Icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>): IconComponent => ({ size = 16, style }) => <Icon aria-hidden size={size} style={{ ...iconStyle, ...style }} />;

export const iconMap: Record<IconToken, IconComponent> = {
  add: makeIcon(FaPlus),
  edit: makeIcon(FaEdit),
  delete: makeIcon(FaTrash),
  send: makeIcon(FaPaperPlane),
  robot: makeIcon(FaRobot),
  customize: makeIcon(FaCog),
  trending: makeIcon(FaChartLine),
  mcpServer: makeIcon(FaPlug),
  prompts: makeIcon(FaMagic),
  search: makeIcon(FaSearch),
  check: makeIcon(FaCheck),
  eye: makeIcon(FaEye),
  completed: makeIcon(FaCheck),
  image: makeIcon(FaImage),
  cardList: makeIcon(FaList),
  chat: makeIcon(FaComments),
  aiImage: makeIcon(FaImage),
  table: makeIcon(FaTable),
  transcription: makeIcon(FaMicrophone),
  language: makeIcon(FaLanguage),
  model_provider: makeIcon(FaCircle),
  gateway_router: makeIcon(FaExchangeAlt),
  inference_compute: makeIcon(FaMicrochip),
  media_voice: makeIcon(FaVolumeUp),
  search_data: makeIcon(FaDatabase),
  app_tools: makeIcon(FaTools),
  storage: makeIcon(FaDatabase),
  endpoint: makeIcon(FaServer),
  client: makeIcon(FaDesktop),
  providers: makeIcon(FaPlug),
  speech: makeIcon(FaVolumeUp),
  skills: makeIcon(FaMagic),
  speechSettings: makeIcon(FaCog),
  transcriptionSettings: makeIcon(FaCog),
  imageSettings: makeIcon(FaCog),
  videoSettings: makeIcon(FaCog),
  video: makeIcon(FaVideo),
  videos: makeIcon(FaVideo),
  structuredOutputs: makeIcon(FaCode),
  webApps: makeIcon(FaDesktop),
  components: makeIcon(FaLayerGroup),
  reranking: makeIcon(FaSortAmountDown),
  labs: makeIcon(FaFlask),
  rerankingSettings: makeIcon(FaCog),
  realtime: makeIcon(FaCircle),
  realtimeSettings: makeIcon(FaCog),
  catalog: makeIcon(FaList),
  brain: makeIcon(FaBrain),
  download: makeIcon(FaDownload),
  print: makeIcon(FaPrint),
  pricing: makeIcon(FaDollarSign),
  explainTool: makeIcon(FaQuestionCircle),
  mail: makeIcon(FaEnvelope),
  theme: makeIcon(FaPalette),
  formula: makeIcon(FaCalculator),
  chatSettings: makeIcon(FaCog),
  databaseGear: makeIcon(FaDatabase),
  code: makeIcon(FaCode),
  chart: makeIcon(FaChartBar),
  arena: makeIcon(FaUsers),
  openLink: makeIcon(FaExternalLinkAlt),
  attachment: makeIcon(FaPaperclip),
  warning: makeIcon(FaExclamationTriangle),
  stop: makeIcon(FaStop),
  up: makeIcon(FaArrowUp),
  down: makeIcon(FaArrowDown),
  resources: makeIcon(FaLayerGroup),
  images: makeIcon(FaImage),
  folder: makeIcon(FaFolder),
  priority: makeIcon(FaExclamation),
  temperature: makeIcon(FaTemperatureHigh),
  dismiss: makeIcon(FaTimes),
  agentSettings: makeIcon(FaCog),
  preview: makeIcon(FaEye),
  menu: makeIcon(FaBars),
  globe: makeIcon(FaGlobe),
  connect: makeIcon(FaPlug),
  sequential: makeIcon(FaArrowRight),
  concurrent: makeIcon(FaExchangeAlt),
  groupchat: makeIcon(FaUsers),
  handoff: makeIcon(FaHandshake),
  disconnect: makeIcon(FaUnlink),
  contextWindow: makeIcon(FaProjectDiagram),
  docs: makeIcon(FaFileAlt),
  terms: makeIcon(FaGavel),
  privacy: makeIcon(FaShieldAlt),
  console: makeIcon(FaTerminal),
  maxOutputTokens: makeIcon(FaArrowDown),
  panelExpand: makeIcon(FaExpandAlt),
  panelContract: makeIcon(FaCompressAlt),
  bookOpen: makeIcon(FaBookOpen),
  toolResult: makeIcon(FaRegFileAlt),
  server: makeIcon(FaServer),
  copyClipboard: makeIcon(FaCopy),
  connector: makeIcon(FaPlug),
  link: makeIcon(FaLink),
  tool: makeIcon(FaWrench),
  personalization: makeIcon(FaCog),
  settings: makeIcon(FaCog),
  sources: makeIcon(FaLink),
  chevronDown: makeIcon(FaChevronDown),
  chevronUp: makeIcon(FaChevronUp),
  chevronLeft: makeIcon(FaChevronLeft),
  chevronRight: makeIcon(FaChevronRight),
  logout: makeIcon(FaSignOutAlt),
  star: makeIcon(FaRegStar),
  starFilled: makeIcon(FaStar),
};

function renderIcon(icon?: IconToken, size = 16) {
  const Icon = icon ? iconMap[icon] : undefined;
  return Icon ? <Icon size={size} /> : undefined;
}

function mapColor(variant?: string) {
  if (variant === "danger" || variant === "destructive" || variant === "error") return "red";
  if (variant === "success") return "green";
  if (variant === "warning") return "yellow";
  if (variant === "secondary") return "gray";
  if (variant === "informative" || variant === "info") return "blue";
  return undefined;
}

function mapButtonVariant(variant?: string) {
  if (variant === "outline") return "outline";
  if (variant === "ghost" || variant === "subtle") return "ghost";
  if (variant === "transparent") return "plain";
  if (variant === "secondary") return "surface";
  return "solid";
}

function mapSize(size?: string) {
  if (size === "large" || size === "lg") return "lg";
  if (size === "small" || size === "sm") return "sm";
  if (size === "extra-small" || size === "xs") return "xs";
  return "md";
}

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
      out.push({ type: "option", value: String(element.props.value ?? ""), label: String(element.props.children ?? element.props.value ?? ""), disabled: element.props.disabled });
      return;
    }
    if (element.type === "optgroup") {
      out.push({ type: "group", group: String(element.props.label ?? ""), items: flattenSelectOptions(parseSelectNodes(element.props.children)) });
    }
  });
  return out;
}

function flattenSelectOptions(nodes: SelectNodeData[]): SelectOptionData[] {
  return nodes.flatMap((node) => (node.type === "option" ? [node] : node.items));
}

export const Button = ({ variant = "primary", size, icon, iconPosition = "left", children, style, ...rest }: any) => {
  const hasChildren = React.Children.count(children) > 0;
  const colorPalette = mapColor(variant);
  const left = icon && iconPosition === "left" ? renderIcon(icon) : undefined;
  const right = icon && iconPosition === "right" ? renderIcon(icon) : undefined;

  if (icon && !hasChildren) {
    return (
      <IconButtonBase variant={mapButtonVariant(variant)} colorPalette={colorPalette} size={mapSize(size)} style={{ flex: "0 0 auto", ...style }} title={rest.title} aria-label={rest["aria-label"] ?? rest.title ?? String(icon)} {...rest}>
        {renderIcon(icon, size === "large" || size === "lg" ? 20 : 16)}
      </IconButtonBase>
    );
  }

  return (
    <ButtonBase variant={mapButtonVariant(variant)} colorPalette={colorPalette} size={mapSize(size)} style={style} {...rest}>
      {left}
      {children}
      {right}
    </ButtonBase>
  );
};

export const ToggleButton = ({ checked = false, variant, ...props }: any) => <Button variant={checked ? variant ?? "primary" : "outline"} aria-pressed={checked} data-state={checked ? "on" : "off"} {...props} />;

export const CloseButton = (props: any) => <CloseButtonBase {...props} />;

export const Header = ({ level = 1, className, children }: any) => <HeadingBase as={`h${level}`} size={level <= 2 ? "xl" : level === 3 ? "lg" : "md"} className={className}>{children}</HeadingBase>;

export const Text = ({ as = "span", wrap = true, italic, weight, align, truncate, underline, strikethrough, block, font, size, children, style }: TextProps) => (
  <TextBase as={as as any} fontStyle={italic ? "italic" : undefined} fontWeight={weight === "bold" ? 700 : weight === "semibold" ? 600 : weight === "medium" ? 500 : undefined} textAlign={align} textDecoration={underline ? "underline" : strikethrough ? "line-through" : undefined} truncate={truncate} fontFamily={font === "monospace" ? "mono" : undefined} fontSize={size ? `${size}px` : undefined} style={{ display: block ? "block" : undefined, whiteSpace: wrap ? undefined : "nowrap", ...style }}>
    {children}
  </TextBase>
);

const Field = ({ label, hint, required, children, style }: any) => (
  <Chakra.Field.Root required={required} style={style}>
    {label ? <Chakra.Field.Label>{label}{required ? <Chakra.Field.RequiredIndicator /> : null}</Chakra.Field.Label> : null}
    {children}
    {hint ? <Chakra.Field.HelperText>{hint}</Chakra.Field.HelperText> : null}
  </Chakra.Field.Root>
);

export const Input = ({ label, hint, required, size, style, ...rest }: any) => <Field label={label} hint={hint} required={required} style={style}><InputBase size={mapSize(size)} {...rest} /></Field>;

export const TextArea = ({ label, hint, required, rows, readOnly, value, onChange, style, className, ...rest }: any) => (
  <Field label={label} hint={hint} required={required} style={style}>
    <TextareaBase rows={rows} readOnly={readOnly} value={value} className={className} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(event.currentTarget.value)} {...rest} />
  </Field>
);

export const Select = ({ value, values, onChange, label, hint, required, children, disabled, placeholder, multiselect, style, className, ...rest }: any) => {
  const options = React.useMemo(() => flattenSelectOptions(parseSelectNodes(children)), [children]);
  const [open, setOpen] = React.useState(false);
  const selectedValues = React.useMemo(() => {
    if (Array.isArray(values)) return values.map(String);
    if (Array.isArray(value)) return value.map(String);
    if (value) return [String(value)];
    return [];
  }, [value, values]);
  const selected = multiselect ? selectedValues : [String(Array.isArray(values) ? values[0] ?? "" : value ?? "")].filter(Boolean);
  const selectedLabels = options.filter((option) => selected.includes(option.value)).map((option) => option.label);
  const labelText = selectedLabels.length ? selectedLabels.join(", ") : placeholder ?? "Select...";

  const handleSelect = (option: SelectOptionData) => {
    if (option.disabled || disabled) return;
    onChange?.(option.value);
    if (!multiselect) setOpen(false);
  };

  return (
    <Field label={label} hint={hint} required={required} style={style}>
      <Box
        className={className}
        position="relative"
        width="100%"
        onBlur={(event: React.FocusEvent<HTMLDivElement>) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
        }}
        {...rest}
      >
        <ButtonBase
          type="button"
          variant="outline"
          width="100%"
          justifyContent="space-between"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
        >
          <Box as="span" flex="1" textAlign="left" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" color={selectedLabels.length ? undefined : "fg.muted"}>
            {labelText}
          </Box>
          {renderIcon(open ? "chevronUp" : "chevronDown")}
        </ButtonBase>
        {open ? (
          <Box
            position="absolute"
            zIndex="dropdown"
            top="calc(100% + 4px)"
            left="0"
            right="0"
            maxHeight="min(320px, 50vh)"
            overflowY="auto"
            borderWidth="1px"
            borderRadius="md"
            boxShadow="lg"
            background="bg.panel"
            padding="1"
          >
            {options.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <ButtonBase
                  key={option.value}
                  type="button"
                  variant={checked ? "subtle" : "ghost"}
                  width="100%"
                  justifyContent="flex-start"
                  disabled={option.disabled}
                  onMouseDown={(event: React.MouseEvent) => event.preventDefault()}
                  onClick={() => handleSelect(option)}
                >
                  {multiselect ? <Box as="span" width="5">{checked ? renderIcon("check") : null}</Box> : null}
                  <Box as="span" flex="1" textAlign="left">{option.label}</Box>
                </ButtonBase>
              );
            })}
          </Box>
        ) : null}
      </Box>
    </Field>
  );
};

export const SearchBox = ({ value, onChange, placeholder, className, autoFocus }: any) => (
  <Box position="relative" className={className}>
    <Box position="absolute" left="3" top="50%" transform="translateY(-50%)">{renderIcon("search")}</Box>
    <InputBase value={value} placeholder={placeholder} autoFocus={autoFocus} paddingLeft="9" onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.value)} />
  </Box>
);

export const Alert = ({ variant, title, onDismiss, className, children }: any) => (
  <AlertRoot status={variant === "danger" || variant === "error" || variant === "destructive" ? "error" : variant === "warning" ? "warning" : variant === "success" ? "success" : "info"} className={className}>
    <AlertIndicator />
    <Box flex="1">{title ? <AlertTitle>{title}</AlertTitle> : null}<AlertDescription>{children}</AlertDescription></Box>
    {onDismiss ? <CloseButtonBase size="sm" onClick={onDismiss} /> : null}
  </AlertRoot>
);

export const Spinner = ({ size = "sm", label, className }: any) => <HStack className={className} gap="2"><SpinnerBase size={mapSize(size)} />{label ? <TextBase>{label}</TextBase> : null}</HStack>;

export const ProgressBar = ({ value, label, variant, className }: any) => (
  <Box className={className}>
    <Chakra.Progress.Root value={value ?? 0} colorPalette={mapColor(variant) ?? "blue"}>
      <Chakra.Progress.Track><Chakra.Progress.Range /></Chakra.Progress.Track>
    </Chakra.Progress.Root>
    {label ? <TextBase fontSize="sm" mt="1">{label}</TextBase> : null}
  </Box>
);

export const Skeleton = (props: any) => props.circle ? <Chakra.SkeletonCircle size={props.width ?? props.height ?? "10"} {...props} /> : <SkeletonBase {...props} />;

export const Card = ({ title, text, description, image, headerActions, children, actions, className, style, selected }: any) => (
  <CardRoot borderWidth="1px" boxShadow={selected ? "md" : "sm"} className={className} style={style}>
    {image}
    <CardHeader><HStack justify="space-between" align="start"><TextBase fontWeight="semibold">{title}</TextBase>{headerActions}</HStack>{description ? <TextBase color="fg.muted" fontSize="sm">{description}</TextBase> : null}</CardHeader>
    <CardBody>{children ?? (text ? <TextBase fontSize="sm">{text}</TextBase> : null)}</CardBody>
    {actions ? <CardFooter><HStack>{actions}</HStack></CardFooter> : null}
  </CardRoot>
);

export const Accordion = ({ items, openItems, defaultOpenItems, onToggle, multiple, className, style }: AccordionProps) => (
  <Chakra.Accordion.Root multiple={multiple} value={openItems as any} defaultValue={defaultOpenItems as any} onValueChange={(details: any) => onToggle?.(Array.isArray(details.value) ? details.value : details.value ? [details.value] : [])} className={className} style={style}>
    {items.map((item) => (
      <Chakra.Accordion.Item key={item.key} value={item.key} className={item.className}>
        <Chakra.Accordion.ItemTrigger disabled={item.disabled}>{item.header}<Chakra.Accordion.ItemIndicator /></Chakra.Accordion.ItemTrigger>
        <Chakra.Accordion.ItemContent><Chakra.Accordion.ItemBody>{item.content}</Chakra.Accordion.ItemBody></Chakra.Accordion.ItemContent>
      </Chakra.Accordion.Item>
    ))}
  </Chakra.Accordion.Root>
);

export const Modal = ({ title, children, actions, isOpen, open, show, onClose, onHide, onOpenChange, size, centered, modalType, ...rest }: any) => {
  const opened = !!(show ?? open ?? isOpen);
  const handleOpenChange = (details: any) => { if (!details.open) { onOpenChange?.(false); onClose?.(); onHide?.(); } };
  return (
    <Chakra.Dialog.Root open={opened} onOpenChange={handleOpenChange} closeOnInteractOutside={modalType !== "alert"} {...rest}>
      <Chakra.Portal><Chakra.Dialog.Backdrop /><Chakra.Dialog.Positioner display="flex" alignItems={centered ? "center" : "flex-start"} justifyContent="center" padding="4"><Chakra.Dialog.Content width={size === "large" ? "900px" : size === "small" ? "360px" : "600px"} maxWidth="calc(100vw - 32px)"><Chakra.Dialog.Header><Chakra.Dialog.Title>{title}</Chakra.Dialog.Title><Chakra.Dialog.CloseTrigger asChild><CloseButtonBase size="sm" /></Chakra.Dialog.CloseTrigger></Chakra.Dialog.Header><Chakra.Dialog.Body>{children}</Chakra.Dialog.Body>{actions ? <Chakra.Dialog.Footer>{actions}</Chakra.Dialog.Footer> : null}</Chakra.Dialog.Content></Chakra.Dialog.Positioner></Chakra.Portal>
    </Chakra.Dialog.Root>
  );
};

export const Drawer = ({ open, onClose, title, children, headerNavigation, position = "end", size = "small" }: any) => (
  <Chakra.Drawer.Root open={open} onOpenChange={(details: any) => { if (!details.open) onClose?.(); }} placement={position === "start" ? "start" : position === "end" ? "end" : position} size={size === "small" ? "sm" : size === "medium" ? "md" : size === "large" ? "lg" : "full"}>
    <Chakra.Portal><Chakra.Drawer.Backdrop /><Chakra.Drawer.Positioner><Chakra.Drawer.Content><Chakra.Drawer.Header><Chakra.Drawer.Title>{title}</Chakra.Drawer.Title><Chakra.Drawer.CloseTrigger asChild><CloseButtonBase /></Chakra.Drawer.CloseTrigger></Chakra.Drawer.Header><Chakra.Drawer.Body>{headerNavigation}{children}</Chakra.Drawer.Body></Chakra.Drawer.Content></Chakra.Drawer.Positioner></Chakra.Portal>
  </Chakra.Drawer.Root>
);

export const Tabs = ({ activeKey, onSelect, vertical, fill, children, className, style }: any) => (
  <Chakra.Tabs.Root value={activeKey} onValueChange={(details: any) => details.value && onSelect?.(details.value)} orientation={vertical ? "vertical" : "horizontal"} className={className} style={style}>
    <Chakra.Tabs.List width={fill ? "100%" : undefined}>{React.Children.map(children, (child) => React.isValidElement<any>(child) ? <Chakra.Tabs.Trigger flex={fill ? 1 : undefined} value={child.props.eventKey} disabled={child.props.disabled}>{renderIcon(child.props.icon)}{child.props.title}</Chakra.Tabs.Trigger> : null)}</Chakra.Tabs.List>
    {React.Children.map(children, (child) => React.isValidElement<any>(child) ? <Chakra.Tabs.Content value={child.props.eventKey}>{child.props.children}</Chakra.Tabs.Content> : null)}
  </Chakra.Tabs.Root>
);

export const Tab = ({ children }: any) => <>{children}</>;

export const Badge = ({ bg, color, appearance, variant, size, icon, text, children, style, ...rest }: any) => (
  <BadgeBase colorPalette={mapColor(color ?? bg) ?? color ?? bg ?? "gray"} variant={variant === "outline" || appearance === "outline" ? "outline" : appearance === "ghost" || appearance === "subtle" || appearance === "tint" ? "subtle" : "solid"} size={mapSize(size)} style={{ textTransform: "none", verticalAlign: "middle", ...style }} {...rest}>{icon ? renderIcon(icon, 12) : null}{children ?? text}</BadgeBase>
);

export const Table = ({ striped, bordered, hover, children, className }: any) => <Chakra.Table.Root striped={striped} interactive={hover} showColumnBorder={bordered} className={className}>{children}</Chakra.Table.Root>;

export const Switch = ({ id, label, checked, onChange, className, disabled }: any) => (
  <Chakra.Switch.Root id={id} checked={checked} disabled={disabled} className={className} onCheckedChange={(details: any) => onChange?.(details.checked)}><Chakra.Switch.HiddenInput /><Chakra.Switch.Control><Chakra.Switch.Thumb /></Chakra.Switch.Control>{label ? <Chakra.Switch.Label>{label}</Chakra.Switch.Label> : null}</Chakra.Switch.Root>
);

export const Image = ({ fit, ...props }: any) => <ImageBase objectFit={fit === "default" ? undefined : fit} {...props} />;

export const Slider = ({ value, min, max, step, onChange, label, marks, disabled, className, style }: any) => (
  <Box className={className} style={style}>{label ? <TextBase fontSize="sm">{label}</TextBase> : null}<Chakra.Slider.Root value={[value ?? min ?? 0]} min={min} max={max} step={step} disabled={disabled} onValueChange={(details: any) => onChange?.(details.value?.[0] ?? 0)}><Chakra.Slider.Control><Chakra.Slider.Track><Chakra.Slider.Range /></Chakra.Slider.Track><Chakra.Slider.Thumb index={0} /></Chakra.Slider.Control>{marks?.length ? <Chakra.Slider.MarkerGroup>{marks.map((mark: any) => <Chakra.Slider.Marker key={mark.value} value={mark.value}>{mark.label}</Chakra.Slider.Marker>)}</Chakra.Slider.MarkerGroup> : null}</Chakra.Slider.Root></Box>
);

export const Breadcrumb = ({ items, className }: any) => <HStack className={className} gap="2">{items.map((item: any, index: number) => <React.Fragment key={item.key ?? item.href ?? index}>{index ? <TextBase color="fg.muted">/</TextBase> : null}{item.href ? <Box as="a" color="blue.600" href={item.href} onClick={item.onClick}>{item.label}</Box> : <TextBase>{item.label}</TextBase>}</React.Fragment>)}</HStack>;

export function DataGrid<T>({ columns, data, rowKey, className, style }: DataGridProps<T>) {
  return <Chakra.Table.Root striped interactive className={className} style={style}><Chakra.Table.Header><Chakra.Table.Row>{columns.map((column) => <Chakra.Table.ColumnHeader key={column.key} style={{ width: column.width }}>{column.header}</Chakra.Table.ColumnHeader>)}</Chakra.Table.Row></Chakra.Table.Header><Chakra.Table.Body>{data.map((row, rowIndex) => <Chakra.Table.Row key={rowKey(row)}>{columns.map((column) => <Chakra.Table.Cell key={column.key}>{column.render(row, rowIndex)}</Chakra.Table.Cell>)}</Chakra.Table.Row>)}</Chakra.Table.Body></Chakra.Table.Root>;
}

function parseJsonValue(input: unknown): { ok: true; value: any } | { ok: false } {
  if (input !== undefined && (typeof input === "object" || typeof input === "number" || typeof input === "boolean")) return { ok: true, value: input };
  let current = String(input ?? "");
  if (!current.trim()) return { ok: false };
  for (let i = 0; i < 3; i += 1) {
    try {
      const parsed = JSON.parse(current);
      if (typeof parsed === "string" && /^[\s\r\n]*[\[{]/.test(parsed) && parsed !== current) { current = parsed; continue; }
      return { ok: true, value: parsed };
    } catch { return { ok: false }; }
  }
  return { ok: true, value: current };
}

const JsonValue = ({ value, label }: { value: any; label?: React.ReactNode }) => {
  if (typeof value === "object" && value !== null) {
    const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const) : Object.entries(value);
    return <Box as="details" open><Box as="summary" cursor="pointer">{label ? <Box as="strong" fontFamily="mono">{label}: </Box> : null}<TextBase as="span" color="fg.muted" fontFamily="mono">{Array.isArray(value) ? `[Array] (${value.length} items)` : "{Object}"}</TextBase></Box><Box as="ul" margin="4px 0 4px 18px" paddingLeft="4">{entries.map(([key, child]) => <Box as="li" key={key}><JsonValue value={child} label={key} /></Box>)}</Box></Box>;
  }
  return <Box as="span">{label ? <Box as="strong" fontFamily="mono">{label}: </Box> : null}<TextBase as="span" color={typeof value === "string" ? "blue.600" : typeof value === "number" ? "purple.600" : typeof value === "boolean" ? "teal.600" : "fg.muted"} fontFamily="mono">{JSON.stringify(value)}</TextBase></Box>;
};

export const JsonViewer = ({ value, data, title, className, style }: any) => {
  const parsed = parseJsonValue(value ?? data);
  if (!parsed.ok) return <TextBase color="red.600" className={className} style={style}>Invalid JSON</TextBase>;
  return <Box borderWidth="1px" borderRadius="md" padding="3" overflowX="auto" className={className} style={style}>{title ? <TextBase fontWeight="semibold" marginBottom="2">{title}</TextBase> : null}<JsonValue value={parsed.value} /></Box>;
};

export const Toolbar = ({ children, ariaLabel, className }: any) => <HStack role="toolbar" aria-label={ariaLabel} gap="2" className={className}>{children}</HStack>;
export const ToolbarButton = (props: any) => <Button variant={props.variant ?? "subtle"} {...props} />;
export const ToolbarDivider = () => <Separator orientation="vertical" height="6" />;

function renderMenuItems(items: MenuItemProps[] | SplitButtonMenuItem[]) {
  return items.map((item: any) => item.children?.length ? <React.Fragment key={item.key}><Chakra.Menu.Item value={item.key} disabled={item.disabled}>{renderIcon(item.icon)}{item.label}</Chakra.Menu.Item>{renderMenuItems(item.children)}</React.Fragment> : <Chakra.Menu.Item key={item.key} value={item.key} disabled={item.disabled} color={item.danger ? "red.600" : undefined} onClick={item.onClick}>{renderIcon(item.icon)}{item.label}</Chakra.Menu.Item>);
}

export const Menu = ({ items, trigger, align = "right", className }: MenuProps) => (
  <Chakra.Menu.Root positioning={{ placement: align === "left" ? "bottom-start" : "bottom-end" }}><Chakra.Menu.Trigger asChild>{trigger ?? <ButtonBase variant="ghost">More</ButtonBase>}</Chakra.Menu.Trigger><Chakra.Portal><Chakra.Menu.Positioner><Chakra.Menu.Content className={className}>{renderMenuItems(items)}</Chakra.Menu.Content></Chakra.Menu.Positioner></Chakra.Portal></Chakra.Menu.Root>
);

export const SplitButton = ({ label, onClick, menuItems, variant = "primary", size, icon, iconPosition = "left", disabled, align, className, stopPropagation = true }: any) => <HStack gap="0" className={className}><Button variant={variant} size={size} icon={icon} iconPosition={iconPosition} disabled={disabled} onClick={(event: any) => { if (stopPropagation) event.stopPropagation(); onClick?.(event); }}>{label}</Button><Menu align={align} items={menuItems} trigger={<IconButtonBase variant={mapButtonVariant(variant)} colorPalette={mapColor(variant)} disabled={disabled} aria-label="Open menu">{renderIcon("chevronDown")}</IconButtonBase>} /></HStack>;

export const Toast = ({ variant, message, show, onClose }: ToastProps) => show ? <Alert variant={variant} onDismiss={onClose}>{message}</Alert> : <></>;
export const Toaster = ({ toasts }: any) => <VStack align="stretch">{toasts?.map((toast: any) => <Toast key={toast.id} {...toast} />)}</VStack>;

export const Tags = ({ items = [], size = "small", onRemove }: any) => <HStack gap="2" wrap="wrap">{items.map((item: any) => <BadgeBase key={item.key} size={mapSize(size)}>{renderIcon(item.icon, 12)}{item.label}{onRemove ? <Box as="button" marginLeft="1" onClick={() => onRemove(item.key)}>×</Box> : null}</BadgeBase>)}</HStack>;

export const AudioPlayer = ({ src, autoPlay, controls = true, className }: any) => <audio src={src} autoPlay={autoPlay} controls={controls} className={className} />;
export const Carousel = ({ items = [], className, style }: any) => <HStack className={className} style={style} gap="4" align="stretch" overflowX="auto">{items.map((item: any, index: number) => <Box key={item.key ?? index} borderWidth="1px" borderRadius="md" padding="3" minWidth="220px">{item.content ?? item.children ?? item}</Box>)}</HStack>;

const avatarSize = (size?: number) => size ?? 32;
export const AvatarGroup = (({ children, layout, size, style, ...rest }: AvatarGroupProps) => <Chakra.AvatarGroup gap={layout === "spread" ? "2" : "-2"} style={style} {...rest as any}>{React.Children.map(children, (child) => {
  if (!React.isValidElement<any>(child)) return child;
  const avatarChild = child as React.ReactElement<any>;
  return React.cloneElement(avatarChild, { size: avatarChild.props.size ?? size } as any);
})}</Chakra.AvatarGroup>) as AvatarGroupComponent;
AvatarGroup.Avatar = ({ image, icon, initials, name, shape, size, children, ...rest }: AvatarProps) => <Chakra.Avatar.Root size={avatarSize(size) <= 24 ? "xs" : avatarSize(size) <= 32 ? "sm" : "md"} borderRadius={shape === "square" ? "md" : "full"} {...rest as any}>{image?.src ? <Chakra.Avatar.Image src={image.src} alt={image.alt ?? name} /> : null}<Chakra.Avatar.Fallback>{children ?? icon ?? initials ?? name?.slice(0, 2).toUpperCase()}</Chakra.Avatar.Fallback></Chakra.Avatar.Root>;
AvatarGroup.Item = ({ overflowLabel, ...props }: AvatarGroupItemProps) => <Box title={overflowLabel ?? props.name ?? props.initials}><AvatarGroup.Avatar {...props} /></Box>;
AvatarGroup.Popover = ({ count, size, overflowLabel, ...rest }: AvatarGroupPopoverProps & { size?: number; overflowLabel?: string }) => <Box title={overflowLabel ?? `+${count ?? 0}`}><Chakra.Avatar.Root size={avatarSize(size) <= 24 ? "xs" : avatarSize(size) <= 32 ? "sm" : "md"} {...rest as any}><Chakra.Avatar.Fallback>+{count ?? 0}</Chakra.Avatar.Fallback></Chakra.Avatar.Root></Box>;
AvatarGroup.partitionItems = <T,>({ items, maxInlineItems = 5 }: { items: readonly T[]; maxInlineItems?: number }) => ({ inlineItems: items.slice(0, maxInlineItems), overflowItems: items.length > maxInlineItems ? items.slice(maxInlineItems) : undefined });

export const Chat = ({ messages = [], renderMessage, renderReactions, locale, aiGeneratedLabel, aiGeneratedWarning }: any) => <VStack gap="3" align="stretch">{messages.map((msg: ChatMessage) => { const isUser = msg.role === "user"; const streaming = msg.content?.some((part: any) => part.type === "text" && part.state === "streaming"); return <Box key={msg.id} borderWidth="1px" borderRadius="lg" padding="3" maxWidth="90%" alignSelf={isUser ? "flex-end" : "flex-start"}><HStack justify="space-between" gap="2" marginBottom="1"><HStack gap="2"><AvatarGroup.Avatar size={24} icon={renderIcon(msg.messageIcon ?? (isUser ? "customize" : "robot"), 14)} /><TextBase fontWeight="semibold" fontSize="sm">{msg.author ?? (isUser ? "You" : "Assistant")}</TextBase>{aiGeneratedWarning ? <BadgeBase title={aiGeneratedWarning} variant="outline" size="xs">{aiGeneratedLabel}</BadgeBase> : null}</HStack><TextBase fontSize="xs" color="fg.muted">{msg.createdAt ? format(msg.createdAt, locale) : ""}</TextBase></HStack>{renderMessage(msg)}{streaming || renderReactions ? <Box marginTop="2">{streaming ? <ProgressBar value={100} /> : renderReactions?.(msg)}</Box> : null}</Box>; })}</VStack>;

const navItemMatchesActive = (item: NavigationItem, activeKey?: string): boolean => !!activeKey && ((item.eventKey ?? item.key) === activeKey || item.children?.some((child: NavigationItem) => navItemMatchesActive(child, activeKey)) === true);
const renderNavItem = (item: NavigationItem, activeKey?: string, onSelect?: (key: string) => void, path = "nav", index = 0): React.ReactNode => {
  const key = `${path}:${item.key ?? item.eventKey ?? index}:${index}`;
  if (item.key === "divider") return <Separator key={key} />;
  if (item.key?.startsWith?.("section:")) return <TextBase key={key} color="fg.muted" fontSize="sm" paddingX="3" paddingY="2">{item.label}</TextBase>;
  const itemValue = item.eventKey ?? item.key;
  const selected = navItemMatchesActive(item, activeKey);
  return <Box key={key}><ButtonBase width="100%" justifyContent="flex-start" variant={selected ? "subtle" : "ghost"} disabled={item.disabled} onClick={(event: any) => { item.onClick?.(event); if (!item.children?.length) onSelect?.(itemValue); }}>{renderIcon(item.icon)}{item.label}</ButtonBase>{item.children?.length ? <VStack align="stretch" paddingLeft="4">{item.children.map((child: NavigationItem, childIndex: number) => renderNavItem(child, activeKey, onSelect, key, childIndex))}</VStack> : null}</Box>;
};

export const Navigation = ({ items = [], activeKey, onSelect, appTitle, className, style }: any) => <VStack align="stretch" className={className} style={style} gap="1">{appTitle ? <TextBase fontWeight="bold" padding="3">{appTitle}</TextBase> : null}{items.map((item: NavigationItem, index: number) => renderNavItem(item, activeKey, onSelect, "nav", index))}</VStack>;

export const UserMenu = ({ email, onCustomize, onSettings, onLogout, showApiKeysItem, onApiKeys, providers = [], providersDisabled, className, labels }: UserMenuProps) => <Menu className={className} items={[...(email ? [{ key: "email", label: email, disabled: true }] : []), ...(onCustomize ? [{ key: "customize", label: labels?.customize ?? "Customize", icon: "personalization" as IconToken, onClick: onCustomize }] : []), { key: "settings", label: labels?.settings ?? "Settings", icon: "settings" as IconToken, onClick: onSettings }, ...(showApiKeysItem ? [{ key: "apiKeys", label: labels?.apiKeys ?? "API keys", icon: "settings" as IconToken, onClick: onApiKeys }] : []), ...providers.map((provider) => ({ key: provider, label: provider, disabled: providersDisabled })), { key: "logout", label: labels?.logout ?? "Logout", icon: "logout" as IconToken, danger: true, onClick: onLogout }]} trigger={<IconButtonBase variant="ghost" aria-label="User menu">{renderIcon("customize")}</IconButtonBase>} />;

export const ThemeSettings = () => <TextBase fontSize="sm" color="fg.muted">Chakra theme settings are provided by ChakraProvider system props.</TextBase>;

export const chakraTheme: AihUiTheme = {
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
  ThemeSettings,
};
