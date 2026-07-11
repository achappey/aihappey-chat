import type { AihUiTheme } from "aihappey-types";
import { Accordion } from "./primitives/Accordion";
import { Alert, ProgressBar, Skeleton, Spinner, Toast, Toaster } from "./primitives/Feedback";
import { AudioPlayer, Carousel } from "./primitives/Media";
import { AvatarGroup } from "./primitives/AvatarGroup";
import { Badge } from "./primitives/Badge";
import { Breadcrumb } from "./primitives/Breadcrumb";
import { Button, ToggleButton } from "./primitives/Button";
import { Card } from "./primitives/Card";
import { Chat } from "./primitives/Chat";
import { CloseButton } from "./primitives/CloseButton";
import { DataGrid } from "./primitives/DataGrid";
import { Drawer } from "./primitives/Drawer";
import { Image } from "./primitives/Image";
import { Input } from "./primitives/Input";
import { JsonViewer } from "./primitives/JsonViewer";
import { Menu } from "./primitives/Menu";
import { Modal } from "./primitives/Modal";
import { Navigation } from "./primitives/Navigation";
import { SearchBox } from "./primitives/SearchBox";
import { Select } from "./primitives/Select";
import { Range, Slider, Switch } from "./primitives/FormControls";
import { SplitButton } from "./primitives/SplitButton";
import { Table } from "./primitives/Table";
import { Tab, Tabs } from "./primitives/Tabs";
import { Tags } from "./primitives/Tags";
import { TextArea } from "./primitives/TextArea";
import { Text, Header } from "./primitives/Typography";
import { ThemeSettings } from "./primitives/ThemeSettings";
import { Toolbar, ToolbarButton, ToolbarDivider } from "./primitives/Toolbar";
import { UserMenu } from "./primitives/UserMenu";

export const materialTheme: AihUiTheme = {
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

