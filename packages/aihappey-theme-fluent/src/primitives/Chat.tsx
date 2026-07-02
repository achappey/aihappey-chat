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
import { Avatar, Badge, ProgressBar, Tooltip, Image } from "@fluentui/react-components";

export type ChatProps = {
  messages?: Message[];
  locale?: string
  aiGeneratedLabel?: string
  aiGeneratedWarning?: string
  renderMessage: (msg: Message) => React.ReactElement;
  renderReactions?: (msg: Message) => React.ReactElement;
  disableProviderLogo?: boolean;
};

export const Chat = ({ messages, renderMessage, renderReactions, locale, aiGeneratedLabel, aiGeneratedWarning, disableProviderLogo }: ChatProps): JSX.Element => {
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
        const providerAvatar = !disableProviderLogo && msg.role === "assistant" && msg.providerIcon?.src
          ? <Avatar
            image={{ src: msg.providerIcon.src, alt: msg.providerIcon.alt ?? msg.providerName }}
            name={msg.providerName ?? msg.providerKey ?? msg.author}
          />
          : undefined;
      
        const badge = msg.role === "assistant" && aiGeneratedWarning ? <Tooltip content={aiGeneratedWarning}
          relationship={"description"}>
          <Badge color="informative"
            shape="square"
            appearance="outline">{aiGeneratedLabel}</Badge>
        </Tooltip> : undefined

        //            avatar={<Avatar name="Ashley McCarthy" badge={{ status: 'available' }} />}

        return (
          <MessageComponent
            key={msg.id}
            author={<>{msg.author} {badge}</>}
            timestamp={format(msg.createdAt, locale)}
            reactions={reactions}
            decorationIcon={icon}
            avatar={providerAvatar}
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
