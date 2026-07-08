import * as React from "react";
import Add from "@mui/icons-material/Add";
import Apps from "@mui/icons-material/Apps";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import ArrowForward from "@mui/icons-material/ArrowForward";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import AttachFile from "@mui/icons-material/AttachFile";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import Book from "@mui/icons-material/Book";
import Build from "@mui/icons-material/Build";
import CallSplit from "@mui/icons-material/CallSplit";
import ChatBubbleOutline from "@mui/icons-material/ChatBubbleOutlined";
import Check from "@mui/icons-material/Check";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Close from "@mui/icons-material/Close";
import Code from "@mui/icons-material/Code";
import Computer from "@mui/icons-material/Computer";
import ContentCopy from "@mui/icons-material/ContentCopy";
import DataObject from "@mui/icons-material/DataObject";
import Delete from "@mui/icons-material/Delete";
import Description from "@mui/icons-material/Description";
import Dns from "@mui/icons-material/Dns";
import Download from "@mui/icons-material/Download";
import Edit from "@mui/icons-material/Edit";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Extension from "@mui/icons-material/Extension";
import Folder from "@mui/icons-material/Folder";
import Functions from "@mui/icons-material/Functions";
import Groups from "@mui/icons-material/Groups";
import Hub from "@mui/icons-material/Hub";
import Image from "@mui/icons-material/Image";
import InsertChart from "@mui/icons-material/InsertChart";
import Input from "@mui/icons-material/Input";
import Key from "@mui/icons-material/Key";
import Language from "@mui/icons-material/Language";
import Link from "@mui/icons-material/Link";
import Mail from "@mui/icons-material/Mail";
import MenuIcon from "@mui/icons-material/Menu";
import Mic from "@mui/icons-material/Mic";
import OpenInNew from "@mui/icons-material/OpenInNew";
import Palette from "@mui/icons-material/Palette";
import Power from "@mui/icons-material/Power";
import Print from "@mui/icons-material/Print";
import PriorityHigh from "@mui/icons-material/PriorityHigh";
import Psychology from "@mui/icons-material/Psychology";
import RadioButtonChecked from "@mui/icons-material/RadioButtonChecked";
import Refresh from "@mui/icons-material/Refresh";
import Router from "@mui/icons-material/Router";
import Science from "@mui/icons-material/Science";
import Search from "@mui/icons-material/Search";
import Send from "@mui/icons-material/Send";
import Settings from "@mui/icons-material/Settings";
import Shield from "@mui/icons-material/Shield";
import SmartToy from "@mui/icons-material/SmartToy";
import Sort from "@mui/icons-material/Sort";
import Star from "@mui/icons-material/Star";
import StarBorder from "@mui/icons-material/StarBorder";
import Stop from "@mui/icons-material/Stop";
import Storage from "@mui/icons-material/Storage";
import Storefront from "@mui/icons-material/Storefront";
import SyncAlt from "@mui/icons-material/SyncAlt";
import TableChart from "@mui/icons-material/TableChart";
import Terminal from "@mui/icons-material/Terminal";
import Thermostat from "@mui/icons-material/Thermostat";
import TrendingUp from "@mui/icons-material/TrendingUp";
import Tune from "@mui/icons-material/Tune";
import Videocam from "@mui/icons-material/Videocam";
import ViewList from "@mui/icons-material/ViewList";
import Visibility from "@mui/icons-material/Visibility";
import VolumeUp from "@mui/icons-material/VolumeUp";
import WebAsset from "@mui/icons-material/WebAsset";
import Work from "@mui/icons-material/Work";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import type { IconToken } from "aihappey-types";

export type IconProps = { size?: number | string; style?: React.CSSProperties };
export type IconComponent = (props: IconProps) => React.JSX.Element;
type MuiIconComponent = React.ComponentType<SvgIconProps>;

function makeIcon(Icon: MuiIconComponent): IconComponent {
  return ({ size = 18, style }) => <Icon aria-hidden fontSize="inherit" style={{ fontSize: size, width: size, height: size, ...style }} />;
}

export const iconMap: Record<IconToken, IconComponent> = {
  add: makeIcon(Add),
  edit: makeIcon(Edit),
  delete: makeIcon(Delete),
  send: makeIcon(Send),
  robot: makeIcon(SmartToy),
  jobs: makeIcon(Work),
  customize: makeIcon(Tune),
  trending: makeIcon(TrendingUp),
  mcpServer: makeIcon(Power),
  prompts: makeIcon(AutoAwesome),
  search: makeIcon(Search),
  check: makeIcon(Check),
  eye: makeIcon(Visibility),
  completed: makeIcon(Check),
  image: makeIcon(Image),
  cardList: makeIcon(ViewList),
  chat: makeIcon(ChatBubbleOutline),
  aiImage: makeIcon(Image),
  table: makeIcon(TableChart),
  transcription: makeIcon(Mic),
  language: makeIcon(Language),
  model_provider: makeIcon(Psychology),
  gateway_router: makeIcon(Router),
  inference_compute: makeIcon(Hub),
  media_voice: makeIcon(VolumeUp),
  search_data: makeIcon(Storage),
  app_tools: makeIcon(Apps),
  storage: makeIcon(Storage),
  endpoint: makeIcon(Input),
  client: makeIcon(Computer),
  providers: makeIcon(Power),
  speech: makeIcon(VolumeUp),
  skills: makeIcon(AutoAwesome),
  speechSettings: makeIcon(Settings),
  transcriptionSettings: makeIcon(Settings),
  imageSettings: makeIcon(Settings),
  videoSettings: makeIcon(Settings),
  video: makeIcon(Videocam),
  videos: makeIcon(Videocam),
  structuredOutputs: makeIcon(DataObject),
  webApps: makeIcon(WebAsset),
  components: makeIcon(Extension),
  reranking: makeIcon(Sort),
  labs: makeIcon(Science),
  rerankingSettings: makeIcon(Settings),
  realtime: makeIcon(RadioButtonChecked),
  realtimeSettings: makeIcon(Settings),
  catalog: makeIcon(Storefront),
  brain: makeIcon(Psychology),
  download: makeIcon(Download),
  print: makeIcon(Print),
  pricing: makeIcon(PriorityHigh),
  explainTool: makeIcon(AutoAwesome),
  mail: makeIcon(Mail),
  theme: makeIcon(Palette),
  formula: makeIcon(Functions),
  chatSettings: makeIcon(Settings),
  databaseGear: makeIcon(Storage),
  code: makeIcon(Code),
  chart: makeIcon(InsertChart),
  arena: makeIcon(Groups),
  openLink: makeIcon(OpenInNew),
  attachment: makeIcon(AttachFile),
  warning: makeIcon(PriorityHigh),
  stop: makeIcon(Stop),
  up: makeIcon(ArrowUpward),
  down: makeIcon(ArrowDownward),
  resources: makeIcon(Description),
  images: makeIcon(Image),
  folder: makeIcon(Folder),
  priority: makeIcon(PriorityHigh),
  temperature: makeIcon(Thermostat),
  dismiss: makeIcon(Close),
  agentSettings: makeIcon(Settings),
  preview: makeIcon(Visibility),
  menu: makeIcon(MenuIcon),
  globe: makeIcon(Language),
  connect: makeIcon(Power),
  refresh: makeIcon(Refresh),
  sequential: makeIcon(ArrowForward),
  concurrent: makeIcon(SyncAlt),
  groupchat: makeIcon(Groups),
  handoff: makeIcon(CallSplit),
  disconnect: makeIcon(Power),
  contextWindow: makeIcon(Storage),
  docs: makeIcon(Description),
  terms: makeIcon(Key),
  privacy: makeIcon(Shield),
  console: makeIcon(Terminal),
  maxOutputTokens: makeIcon(Download),
  panelExpand: makeIcon(ChevronRight),
  panelContract: makeIcon(ChevronLeft),
  bookOpen: makeIcon(Book),
  toolResult: makeIcon(DataObject),
  server: makeIcon(Dns),
  copyClipboard: makeIcon(ContentCopy),
  connector: makeIcon(Power),
  link: makeIcon(Link),
  tool: makeIcon(Build),
  personalization: makeIcon(Tune),
  settings: makeIcon(Settings),
  sources: makeIcon(Link),
  chevronDown: makeIcon(ExpandMore),
  chevronUp: makeIcon(ExpandLess),
  chevronLeft: makeIcon(ChevronLeft),
  chevronRight: makeIcon(ChevronRight),
  logout: makeIcon(Key),
  star: makeIcon(StarBorder),
  starFilled: makeIcon(Star),
};

export function renderIcon(icon?: IconToken, size = 18) {
  const Icon = icon ? iconMap[icon] : undefined;
  return Icon ? <Icon size={size} /> : undefined;
}

