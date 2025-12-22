import type * as React from "react";
import type { JSX } from "react";

import type { ChatMessage } from "../chat";

export type ChatProps = {
  //onShowSources?: any;
  //onShowTools?: any;
  //onShowAttachments?: any;
  //generatedByAiLabel: string;
  renderMessage: (msg: any) => React.ReactElement;
  renderReactions?: (msg: any) => React.ReactElement;
  //generatedByAiWarning: string;
  messages?: ChatMessage[];
};

export type ChatComponent = (props: ChatProps) => JSX.Element;
