import { Avatar, Box, Chip, LinearProgress, Paper, Tooltip, Typography } from "@mui/material";
import { format } from "timeago.js";
import type { ChatMessage } from "aihappey-types";
import { renderIcon } from "./icons";

export const Chat = ({ messages = [], renderMessage, renderReactions, locale, aiGeneratedLabel, aiGeneratedWarning, disableProviderLogo }: any) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
    {messages.map((msg: ChatMessage) => {
      const isUser = msg.role === "user";
      const streaming = msg.content?.some((part: any) => part.type === "text" && part.state === "streaming");
      const providerLogo = !disableProviderLogo && !isUser && msg.providerIcon?.src ? msg.providerIcon : undefined;
      return (
        <Paper key={msg.id} variant="outlined" sx={{ p: 1.5, maxWidth: "90%", alignSelf: isUser ? "flex-end" : "flex-start", bgcolor: isUser ? "primary.main" : "background.paper", color: isUser ? "primary.contrastText" : "text.primary" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar
                src={providerLogo?.src}
                alt={providerLogo?.alt ?? msg.providerName ?? msg.providerKey}
                variant={providerLogo ? "rounded" : "circular"}
                sx={{ width: 28, height: 28 }}
              >{renderIcon(msg.messageIcon ?? (isUser ? "customize" : "robot"), 16)}</Avatar>
              <Typography variant="subtitle2">{msg.author ?? (isUser ? "You" : "Assistant")}</Typography>
              {!isUser && aiGeneratedWarning ? <Tooltip title={aiGeneratedWarning}><Chip size="small" variant="outlined" label={aiGeneratedLabel ?? "AI"} /></Tooltip> : null}
            </Box>
            <Typography variant="caption" color={isUser ? "inherit" : "text.secondary"}>{msg.createdAt ? format(msg.createdAt, locale) : ""}</Typography>
          </Box>
          {msg.messageLabel ? <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>{msg.messageLabel}</Typography> : null}
          <Box>{renderMessage(msg)}</Box>
          {streaming || renderReactions ? <Box sx={{ mt: 1, minHeight: 24 }}>{streaming ? <LinearProgress /> : renderReactions?.(msg)}</Box> : null}
        </Paper>
      );
    })}
  </Box>
);

