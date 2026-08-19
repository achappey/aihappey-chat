export const bootstrapThemeStyles = `
.aih-bootstrap-theme .btn-primary {
  --bs-btn-color: var(--aih-bs-primary-contrast);
  --bs-btn-bg: var(--bs-primary);
  --bs-btn-border-color: var(--bs-primary);
  --bs-btn-hover-color: var(--aih-bs-primary-contrast);
  --bs-btn-hover-bg: var(--aih-bs-primary-hover);
  --bs-btn-hover-border-color: var(--aih-bs-primary-hover);
  --bs-btn-active-color: var(--aih-bs-primary-contrast);
  --bs-btn-active-bg: var(--aih-bs-primary-active);
  --bs-btn-active-border-color: var(--aih-bs-primary-active);
  --bs-btn-disabled-bg: var(--bs-primary);
  --bs-btn-disabled-border-color: var(--bs-primary);
}

.aih-bootstrap-theme .btn-outline-primary {
  --bs-btn-color: var(--bs-primary);
  --bs-btn-border-color: var(--bs-primary);
  --bs-btn-hover-color: var(--aih-bs-primary-contrast);
  --bs-btn-hover-bg: var(--bs-primary);
  --bs-btn-hover-border-color: var(--bs-primary);
  --bs-btn-active-color: var(--aih-bs-primary-contrast);
  --bs-btn-active-bg: var(--aih-bs-primary-active);
  --bs-btn-active-border-color: var(--aih-bs-primary-active);
}

.aih-bootstrap-theme .form-check-input:checked,
.aih-bootstrap-theme .form-range::-webkit-slider-thumb,
.aih-bootstrap-theme .progress-bar { background-color: var(--bs-primary); }
.aih-bootstrap-theme .form-control:focus,
.aih-bootstrap-theme .form-select:focus { border-color: var(--bs-primary); box-shadow: 0 0 0 .25rem rgb(var(--bs-primary-rgb) / .25); }

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

.aihappey-bootstrap-select-menu {
  z-index: 1080;
  min-width: var(--aihappey-bootstrap-select-menu-min-width, 10rem);
  max-width: calc(100vw - 1rem);
  max-height: min(24rem, calc(100vh - 1rem));
  overflow-y: auto;
  overscroll-behavior: contain;
}

@media (max-width: 767.98px) {
  .aihappey-bootstrap-chat-message {
    width: 100%;
  }
}
`;

