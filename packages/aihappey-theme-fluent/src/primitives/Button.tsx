import * as React from "react";
import type { ComponentProps, JSX } from "react";
import { Button as FluentButton, Hamburger } from "@fluentui/react-components";
import type { IconToken } from "aihappey-types";
import {
  AddRegular,
  EditRegular,
  DeleteRegular,
  SendRegular,
  SettingsRegular,
  ChevronDownRegular,
  ChevronUpRegular,
  DocumentRegular,
  PromptRegular,
  BotFilled,
  DoorArrowRightRegular,
  PeopleSettingsRegular,
  PersonHeartRegular,
  DatabasePersonRegular,
  AttachRegular,
  LinkRegular,
  OpenRegular,
  ConnectorRegular,
  CopyRegular,
  EyeRegular,
  StopFilled,
  DocumentTextToolboxRegular,
  BookOpenRegular,
  GlobeRegular,
  ImageStackRegular,
  BrainRegular,
  UsbPlugFilled,
  CheckmarkRegular,
  CodeRegular,
  ChartMultipleRegular,
  TableRegular,
  MathFormulaRegular,
  ArrowDownloadRegular,
  PrintRegular,
  PlugConnectedAddRegular,
  PlugConnectedCheckmarkRegular,
  DualScreenGroupRegular,
  SlideTextSparkleRegular,
  TemperatureRegular,
  ArrowTrendingRegular,
  ListRegular,
  ChatSettingsRegular,
  WarningRegular,
  ServerRegular,
  SearchRegular,
  PanelRightContractRegular,
  PanelRightExpandRegular,
  MailRegular,
  SettingsChatRegular,
  ArrowSplitRegular,
  ArrowRoutingRegular,
  PeopleChatRegular,
  PeopleSwapRegular,
  ArrowUpRegular,
  ArrowDownRegular,
  BuildingShopRegular,
  ChatRegular,
  DismissRegular,
  ImportantRegular,
  ImportantFilled,
  WrenchRegular,
  ChevronRightRegular,
  ChevronLeftRegular,
  CloudLinkRegular,
} from "@fluentui/react-icons";

export const iconMap: Record<IconToken, React.ComponentType<any>> = {
  add: AddRegular,
  edit: EditRegular,
  delete: DeleteRegular,
  prompts: PromptRegular,
  resources: DocumentRegular,
  mcpServer: UsbPlugFilled,
  send: SendRegular,
  connect: PlugConnectedAddRegular,
  disconnect: PlugConnectedCheckmarkRegular,
  library: ImageStackRegular,
  server: ServerRegular,
  connector: ConnectorRegular,
  tool: WrenchRegular,
  print: PrintRegular,
  openLink: OpenRegular,
  robot: BotFilled,
  chatSettings: ChatSettingsRegular,
  arena: DualScreenGroupRegular,
  download: ArrowDownloadRegular,
  formula: MathFormulaRegular,
  table: TableRegular,
  mail: MailRegular,
  warning: WarningRegular,
  search: SearchRegular,
  chat: ChatRegular,
  panelContract: PanelRightContractRegular,
  panelExpand: PanelRightExpandRegular,
  chart: ChartMultipleRegular,
  globe: GlobeRegular,
  check: CheckmarkRegular,
  code: CodeRegular,
  temperature: TemperatureRegular,
  brain: BrainRegular,
  bookOpen: BookOpenRegular,
  trending: ArrowTrendingRegular,
  link: LinkRegular,
  cardList: ListRegular,
  explainTool: SlideTextSparkleRegular,
  preview: EyeRegular,
  toolResult: DocumentTextToolboxRegular,
  stop: StopFilled,
  menu: Hamburger,
  attachment: AttachRegular,
  concurrent: ArrowSplitRegular,
  sequential: ArrowRoutingRegular,
  groupchat: PeopleChatRegular,
  handoff: PeopleSwapRegular,
  catalog: BuildingShopRegular,
  completed: CheckmarkRegular,
  up: ArrowUpRegular,
  priority: ImportantFilled,
  down: ArrowDownRegular,
  dismiss: DismissRegular,
  agentSettings: SettingsChatRegular,
  eye: EyeRegular,
  databaseGear: DatabasePersonRegular,
  personalization: PersonHeartRegular,
  customize: PeopleSettingsRegular,
  logout: DoorArrowRightRegular,
  copyClipboard: CopyRegular,
  settings: SettingsRegular,
  sources: CloudLinkRegular,
  chevronDown: ChevronDownRegular,
  chevronUp: ChevronUpRegular,
  chevronLeft: ChevronLeftRegular,
  chevronRight: ChevronRightRegular,
};

export const Button = ({
  variant = "primary",
  size = "medium",
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
  const IconElem = icon ? iconMap[icon] : undefined;
  return (
    <FluentButton
      appearance={
        variant === "primary"
          ? "primary"
          : variant === "secondary"
            ? "secondary"
            : variant === "outline"
              ? "outline"
              : "transparent"
      }
      size={
        size === "sm" || size === "small"
          ? "small"
          : size === "lg" || size === "large"
            ? "large"
            : "medium"
      }
      icon={IconElem && iconPosition === "left" ? <IconElem /> : undefined}
      iconAfter={
        IconElem && iconPosition === "right" ? <IconElem /> : undefined
      }
      {...(rest as any)}
    >
      {children}
    </FluentButton>
  );
};
