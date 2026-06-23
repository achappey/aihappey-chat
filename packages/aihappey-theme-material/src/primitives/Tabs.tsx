import * as React from "react";
import { Box, Tab as MuiTab, Tabs as MuiTabs } from "@mui/material";
import type { IconToken } from "aihappey-types";
import { renderIcon } from "./icons";

export const Tab = ({ children }: any) => <>{children}</>;

export const Tabs = ({ activeKey, onSelect, vertical, fill, children, className, style }: any) => {
  const tabs = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<any>[];
  return (
    <Box className={className} sx={{ display: vertical ? "flex" : undefined, gap: vertical ? 2 : undefined, ...style }}>
      <MuiTabs value={activeKey} onChange={(_, key) => onSelect?.(key)} orientation={vertical ? "vertical" : "horizontal"} variant={fill ? "fullWidth" : "standard"}>
        {tabs.map((tab) => <MuiTab key={tab.props.eventKey} value={tab.props.eventKey} disabled={tab.props.disabled} icon={tab.props.icon ? renderIcon(tab.props.icon as IconToken) : undefined} iconPosition="start" label={tab.props.title} />)}
      </MuiTabs>
      {tabs.map((tab) => activeKey === tab.props.eventKey ? <Box key={tab.props.eventKey} sx={{ flex: 1, pt: vertical ? 0 : 2 }}>{tab.props.children}</Box> : null)}
    </Box>
  );
};

