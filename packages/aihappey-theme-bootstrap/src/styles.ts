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

.aihappey-bootstrap-chat-message-activity {
  border-left: 4px solid var(--bs-danger);
}

.aihappey-bootstrap-chat-activity-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  color: currentColor;
  font-size: 1.1rem;
  line-height: 1;
}

.aihappey-bootstrap-chat-actions {
  align-items: center;
}

.aihappey-bootstrap-chat-actions > div {
  height: auto !important;
  padding-top: 0 !important;
  align-items: center !important;
  gap: .375rem;
}

.aihappey-bootstrap-chat-message .card-footer {
  min-height: 0 !important;
  padding-top: .25rem !important;
  padding-bottom: .25rem !important;
}

@media (max-width: 767.98px) {
  .aihappey-bootstrap-chat-message {
    width: 100%;
  }
}
`;

