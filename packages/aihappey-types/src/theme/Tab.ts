import type * as React from "react";
import type { JSX } from "react";

import type { IconToken } from "./IconToken";

export type TabProps = {
  eventKey: string;
  icon?: IconToken;
  title: React.ReactNode;
  children: React.ReactNode;
};

export type TabComponent = (props: TabProps) => JSX.Element;
