import type * as React from "react";
import type { JSX } from "react";

import type { ChatMessage } from "../chat";

export type ChatProps = {
  renderMessage: (msg: any) => React.ReactElement;
  renderReactions?: (msg: any) => React.ReactElement;
  messages?: ChatMessage[];
};

export type ChatComponent = (props: ChatProps) => JSX.Element;
