import type { AlertComponent } from "./Alert";
import type { BadgeComponent } from "./Badge";
import type { BreadcrumbComponent } from "./Breadcrumb";
import type { ButtonComponent } from "./Button";
import type { CardComponent } from "./Card";
import type { CarouselComponent } from "./Carousel";
import type { ChatComponent } from "./Chat";
import type { CloseButtonComponent } from "./CloseButton";
import type { DataGridComponent } from "./DataGrid";
import type { DrawerComponent } from "./Drawer";
import type { HeaderComponent } from "./Header";
import type { ImageComponent } from "./Image";
import type { InputComponent } from "./Input";
import type { JsonViewerComponent } from "./JsonViewer";
import type { MenuComponent } from "./Menu";
import type { ModalComponent } from "./Modal";
import type { NavigationComponent } from "./Navigation";
import type { ParagraphComponent } from "./Paragraph";
import type { ProgressBarComponent } from "./ProgressBar";
import type { SearchBoxComponent } from "./SearchBox";
import type { SelectComponent } from "./Select";
import type { SkeletonComponent } from "./Skeleton";
import type { SliderComponent } from "./Slider";
import type { SpinnerComponent } from "./Spinner";
import type { SwitchComponent } from "./Switch";
import type { TabComponent } from "./Tab";
import type { TableComponent } from "./Table";
import type { TabsComponent } from "./Tabs";
import type { TagsComponent } from "./Tags";
import type { TextAreaComponent } from "./TextArea";
import type { ToastComponent } from "./Toast";
import type { ToasterComponent } from "./Toaster";
import type { ToggleButtonComponent } from "./ToggleButton";
import type { ToolbarButtonComponent } from "./ToolbarButton";
import type { ToolbarComponent } from "./Toolbar";
import type { ToolbarDividerComponent } from "./ToolbarDivider";
import type { UserMenuComponent } from "./UserMenu";

/**
 * Split-out theme contract (recomposed from per-component types).
 *
 * NOTE: This is not yet wired into package exports; `src/theme.ts` remains
 * the active contract for now.
 */
export interface AihUiTheme {
  DataGrid: DataGridComponent;
  Header: HeaderComponent;
  JsonViewer: JsonViewerComponent;
  Paragraph: ParagraphComponent;
  Breadcrumb: BreadcrumbComponent;
  Button: ButtonComponent;
  ToggleButton: ToggleButtonComponent;
  UserMenu: UserMenuComponent;
  Input: InputComponent;
  Image: ImageComponent;
  Card: CardComponent;
  Alert: AlertComponent;
  Spinner: SpinnerComponent;
  Modal: ModalComponent;
  Tabs: TabsComponent;
  Tab: TabComponent;
  Badge: BadgeComponent;
  Table: TableComponent;
  CloseButton: CloseButtonComponent;
  Select: SelectComponent;
  SearchBox: SearchBoxComponent;
  ProgressBar: ProgressBarComponent;
  Switch: SwitchComponent;
  TextArea: TextAreaComponent;
  Toolbar: ToolbarComponent;
  ToolbarButton: ToolbarButtonComponent;
  ToolbarDivider: ToolbarDividerComponent;
  Chat: ChatComponent;
  Drawer: DrawerComponent;
  Navigation: NavigationComponent;
  Menu: MenuComponent;
  Tags: TagsComponent;
  Toast: ToastComponent;
  Toaster: ToasterComponent;
  Skeleton: SkeletonComponent;
  Carousel: CarouselComponent;
  Slider: SliderComponent;
}
