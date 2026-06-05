export const bootstrapThemeStyles = `
.aihappey-bootstrap-chat {
  width: min(100%, var(--aih-chat-content-max-width, 1056px));
  max-width: var(--aih-chat-content-max-width, 1056px);
  margin-inline: auto;
  box-sizing: border-box;
}

.aihappey-bootstrap-chat-message {
  width: min(75%, 52rem);
  max-width: 100%;
}

@media (max-width: 767.98px) {
  .aihappey-bootstrap-chat-message {
    width: 100%;
  }
}
`;

