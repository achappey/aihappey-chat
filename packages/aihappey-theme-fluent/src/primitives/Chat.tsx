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

export type ChatProps = {
  messages?: Message[];
  renderMessage: (msg: Message) => React.ReactElement;
  renderReactions?: (msg: Message) => React.ReactElement;
};

export const Chat = ({ messages, renderMessage, renderReactions }: ChatProps): JSX.Element => {
  return (
    <FluentChat>
      {messages?.map((msg) => {
        const MessageComponent =
          msg.role === "user" ? ChatMyMessage : ChatMessage;

        const reactions = renderReactions ? renderReactions(msg) : undefined;
        const IconCmp = msg.messageIcon ? iconMap[msg.messageIcon] : undefined;
        const icon = IconCmp ? <IconCmp /> : undefined;
        const reactionBlock = reactions ? <div
          style={{ height: 16, paddingTop: 8, display: "flex", alignItems: "center" }}>
          {reactions}
        </div>
          : undefined;

        return (
          <MessageComponent
            key={msg.id}
            author={msg.author}
            timestamp={format(msg.createdAt)}
            reactions={reactionBlock}
            decorationIcon={icon}
            decorationLabel={msg.messageLabel}
          >
            {renderMessage(msg)}
          </MessageComponent>
        );
      })}
    </FluentChat>
  );
};