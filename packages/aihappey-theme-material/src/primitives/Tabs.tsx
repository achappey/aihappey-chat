import * as React from "react";
import { Box, Tab as MuiTab, Tabs as MuiTabs } from "@mui/material";
import type { IconToken } from "aihappey-types";
import { renderIcon } from "./icons";

export const Tab = ({ children }: any) => <>{children}</>;

export const Tabs = ({ activeKey, onSelect, vertical, fill, children, className, style }: any) => {
  const tabs = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<any>[];
  const variant = fill ? "fullWidth" : vertical ? "standard" : "scrollable";
  return (
    <Box className={className} sx={{ display: vertical ? "flex" : undefined, gap: vertical ? 2 : undefined, minWidth: 0, minHeight: 0, maxWidth: "100%", ...style }}>
      <MuiTabs
        value={activeKey}
        onChange={(_, key) => onSelect?.(key)}
        orientation={vertical ? "vertical" : "horizontal"}
        variant={variant}
        scrollButtons={variant === "scrollable" ? "auto" : undefined}
        allowScrollButtonsMobile={variant === "scrollable" ? true : undefined}
        sx={vertical
          ? { flex: "0 0 auto", maxHeight: "100%", minHeight: 0, "& .MuiTabs-scroller": { overflowY: "auto !important" } }
          : { maxWidth: "100%", minWidth: 0, width: "100%", "& .MuiTabs-scrollButtons.Mui-disabled": { opacity: 0.3 } }}
      >
        {tabs.map((tab) => <MuiTab key={tab.props.eventKey} value={tab.props.eventKey} disabled={tab.props.disabled} icon={tab.props.icon ? renderIcon(tab.props.icon as IconToken) : undefined} iconPosition="start" label={tab.props.title} />)}
      </MuiTabs>
      {tabs.map((tab) => activeKey === tab.props.eventKey ? <Box key={tab.props.eventKey} sx={{ flex: 1, minWidth: 0, minHeight: 0, overflow: vertical ? "auto" : undefined, pt: vertical ? 0 : 2 }}>{tab.props.children}</Box> : null)}
    </Box>
  );
};

