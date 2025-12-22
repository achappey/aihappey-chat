import * as React from "react";
import {
  TabList,
  Tab as FluentTab,
  Overflow,
  OverflowItem,
  useOverflowMenu,
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  useIsOverflowItemVisible,
} from "@fluentui/react-components";
import { IconToken } from "aihappey-types";
import { iconMap } from "./Button";
import { MoreHorizontalRegular } from "@fluentui/react-icons";

interface TabsProps {
  activeKey: string;
  onSelect: (k: string) => void;
  className?: string;
  style?: React.CSSProperties;
  vertical?: boolean;
  size?: "small" | "medium" | "large"
  minimumVisible?: number;
  children: React.ReactNode;
}

const OverflowMenuItem = ({
  eventKey,
  title,
  icon,
  onClick,
}: {
  eventKey: string;
  title: React.ReactNode;
  icon?: React.ReactNode;
  onClick: (k: string) => void;
}) => {
  const isVisible = useIsOverflowItemVisible(eventKey);
  if (isVisible) return null;
  return (
    <MenuItem key={eventKey} onClick={() => onClick(eventKey)}>
      {title}
    </MenuItem>
  );
};

const OverflowMenu = ({
  tabs,
  onTabSelect,
}: {
  tabs: {
    eventKey: string;
    title: React.ReactNode;
    icon?: React.ReactNode;
  }[];
  onTabSelect: (k: string) => void;
}) => {
  const { ref, isOverflowing, overflowCount } =
    useOverflowMenu<HTMLButtonElement>();
  if (!isOverflowing) return null;
  return (
    <Menu hasIcons>
      <MenuTrigger disableButtonEnhancement>
        <Button
          ref={ref}
          appearance="transparent"
          icon={<MoreHorizontalRegular />}
          aria-label={`${overflowCount} more tabs`}
          role="tab"
        />
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {tabs.map(({ eventKey, title, icon }) => (
            <OverflowMenuItem
              key={eventKey}
              eventKey={eventKey}
              title={title}
              icon={icon}
              onClick={onTabSelect}
            />
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};

export const Tabs: React.FC<TabsProps> = ({
  activeKey,
  onSelect,
  vertical,
  style,
  size,
  className,
  children,
  minimumVisible = 2, // default, can be customized
}) => {
  // Gather tab headers & content
  const headers: React.ReactElement[] = [];
  let activePanel: React.ReactElement | null = null;

  // Gather metadata for overflow menu
  const tabMeta: {
    eventKey: string;
    title: React.ReactNode;
    icon?: React.ReactNode;
  }[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const { eventKey, title, icon, children: tabContent } = child.props;
    const IconElement = icon ? iconMap[icon as IconToken] : undefined;

    headers.push(
      <OverflowItem
        key={eventKey}
        id={eventKey}
        priority={eventKey === activeKey ? 2 : 1}
      >
        <FluentTab value={eventKey} icon={IconElement && <IconElement />}>
          {title}
        </FluentTab>
      </OverflowItem>
    );
    tabMeta.push({
      eventKey,
      title,
      icon: IconElement && <IconElement />,
    });
    //padding: "0 0 0 1em"
    //padding: "1em 0"
    if (eventKey === activeKey) {
      activePanel = (
        <div
          style={
            vertical ? { flex: 1 } : {}
          }
        >
          {tabContent}
        </div>
      );
    }
  });
  //marginRight: "1em"
  return (
    <div
      className={className}
      style={vertical ? { ...style, display: "flex" } : undefined}
    >
      <Overflow
        minimumVisible={minimumVisible}
        overflowAxis={vertical ? "vertical" : "horizontal"}
      >
        <TabList
          selectedValue={activeKey}
          vertical={vertical}
          size={size}
          onTabSelect={(_, data) => onSelect(data.value as string)}
          style={vertical ? {} : undefined}
        >
          {headers}
          <OverflowMenu tabs={tabMeta} onTabSelect={onSelect} />
        </TabList>
      </Overflow>
      {activePanel}
    </div>
  );
};
