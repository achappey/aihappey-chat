import type { JSX } from "react";
import { ChatMessage } from "aihappey-types";
import { Card } from "react-bootstrap";
import React from "react";
import { useDarkMode } from "usehooks-ts";
import { format } from "timeago.js";
import { iconMap } from "./IconMap";

export type ChatProps = {
  messages?: ChatMessage[];
  locale?: string
  renderMessage: (msg: ChatMessage) => React.ReactElement;
  renderReactions?: (msg: ChatMessage) => React.ReactElement;
};

const footerStyles: React.CSSProperties = {
  minHeight: 42,
  display: "flex",
  alignItems: "center",
  overflow: "visible",
};

const reactionsStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  minHeight: 30,
};

export const Chat = ({
  messages,
  renderMessage,
  locale,
  renderReactions,
}: ChatProps): JSX.Element => {
  const { isDarkMode } = useDarkMode();
  return (
    <div className="aihappey-bootstrap-chat d-flex flex-column gap-3 p-3">
      {messages?.map((m) => {
        const isUser = m.role === "user";
        const isActivity = m.messageIcon === "brain" || m.messageIcon === "tool";
        const Icon = m.messageIcon ? iconMap[m.messageIcon] : undefined;
        // Styling based on role
        const alignClass = isUser ? "align-self-end" : "align-self-start";
        const bg = isUser
          ? "secondary"
          : (isDarkMode ? "dark" : "light")
        const text = isUser
          ? "light"
          : (isDarkMode ? "light" : "dark")
        // Date formatting
        const dateStr = format(m.createdAt, locale)

        return (
          <Card
            key={m.id}
            bg={bg}
            text={text}
            className={`aihappey-bootstrap-chat-message shadow-sm ${alignClass}${isActivity ? " aihappey-bootstrap-chat-message-activity" : ""}`}
          >
            <Card.Header className="d-flex align-items-center justify-content-between gap-2 py-2">
              <span className="d-inline-flex align-items-center gap-2 flex-wrap">
                {m.author ? <span>{m.author}</span> : null}
                <time>{dateStr}</time>
              </span>
              {Icon ? <span className={isActivity ? "aihappey-bootstrap-chat-activity-icon" : undefined}>{Icon}</span> : null}
            </Card.Header>
            <Card.Body className="pt-0"
              style={{
                backgroundColor: isDarkMode
                  && m.role == "assistant" ? "#1b1f22" : undefined
              }}>
              <Card.Title>{m.messageLabel} </Card.Title>
              <Card.Text>
                {renderMessage(m)}
              </Card.Text>
            </Card.Body>
            {renderReactions && (
              <Card.Footer className="px-3 py-2" style={footerStyles}>
                <div className="aihappey-bootstrap-chat-actions" style={reactionsStyles}>
                  {renderReactions(m)}
                </div>
              </Card.Footer>
            )}
          </Card>
        );
      })}
    </div>
  );
};
