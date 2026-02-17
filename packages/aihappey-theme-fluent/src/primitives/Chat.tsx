import type { JSX } from "react";
import {
  Chat as FluentChat,
  ChatMessage,
  ChatMyMessage,
} from "@fluentui-contrib/react-chat";
import { ChatMessage as Message } from "aihappey-types";
import { iconMap } from "./Button";
import React from "react";
import { format } from "timeago.js";
import { Badge, ProgressBar, Tooltip } from "@fluentui/react-components";

export type ChatProps = {
  messages?: Message[];
  locale?: string
  aiGeneratedLabel: string
  aiGeneratedWarning: string
  renderMessage: (msg: Message) => React.ReactElement;
  renderReactions?: (msg: Message) => React.ReactElement;
};

export const Chat = ({ messages, renderMessage, renderReactions, locale, aiGeneratedLabel, aiGeneratedWarning }: ChatProps): JSX.Element => {
  return (
    <FluentChat>
      {messages?.map((msg) => {
        const MessageComponent =
          msg.role === "user" ? ChatMyMessage : ChatMessage;
        const streaming = msg.content.find(a => a.type == "text" && a.state == "streaming")

        const reactions = streaming ? <div
          style={{ paddingTop: 10, width: "100%" }}>
          <ProgressBar shape="square" style={{ height: 6 }} />
        </div> :
          renderReactions ? renderReactions(msg) : undefined;
        const IconCmp = msg.messageIcon ? iconMap[msg.messageIcon] : undefined;
        const icon = IconCmp ? <IconCmp /> : undefined;

        return (
          <MessageComponent
            key={msg.id}
            author={<>{msg.author} <Tooltip content={aiGeneratedWarning}
              relationship={"description"}>
              <Badge color="informative"
                shape="square"
                appearance="outline">{aiGeneratedLabel}</Badge>
            </Tooltip></>}
            timestamp={format(msg.createdAt, locale)}
            reactions={reactions}
            decorationIcon={icon}
            root={{ style: { marginLeft: 0 } }}
            decorationLabel={msg.messageLabel}
          >
            {renderMessage(msg)}
          </MessageComponent>
        );
      })}
    </FluentChat>
  );
};