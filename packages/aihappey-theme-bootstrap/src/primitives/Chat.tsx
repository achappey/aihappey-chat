import type { JSX } from "react";
import { ChatMessage } from "aihappey-types";
import { Card } from "react-bootstrap";
import React from "react";
import { useDarkMode } from "usehooks-ts";
import { format } from "timeago.js";

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
    <div className="d-flex flex-column gap-3 p-3">
      {messages?.map((m) => {
        const isUser = m.role === "user";
        // Styling based on role
        const alignClass = isUser ? "align-self-end" : "align-self-start";
        const bg = isUser
          ? (isDarkMode ? "secondary" : "primary")
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
            className={`w-75 shadow-sm ${alignClass}`}
          >
            <Card.Header className="d-flex align-items-center justify-content-between py-2">
              {m.author} {dateStr}
            </Card.Header>
            <Card.Body className="pt-0">
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
