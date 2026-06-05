export const shadcnThemeStyles = `
:root,
.aih-shadcn-theme,
.aih-shadcn-portal-root {
  --aih-shadcn-background: hsl(0 0% 100%);
  --aih-shadcn-foreground: hsl(222.2 84% 4.9%);
  --aih-shadcn-card: color-mix(in srgb, var(--aih-shadcn-background) 55%, var(--aih-shadcn-muted));
  --aih-shadcn-card-foreground: hsl(222.2 84% 4.9%);
  --aih-shadcn-popover: hsl(0 0% 100%);
  --aih-shadcn-popover-foreground: hsl(222.2 84% 4.9%);
  --aih-shadcn-primary: hsl(222.2 47.4% 11.2%);
  --aih-shadcn-primary-foreground: hsl(210 40% 98%);
  --aih-shadcn-secondary: hsl(210 40% 96.1%);
  --aih-shadcn-secondary-foreground: hsl(222.2 47.4% 11.2%);
  --aih-shadcn-muted: hsl(210 40% 96.1%);
  --aih-shadcn-muted-foreground: hsl(215.4 16.3% 46.9%);
  --aih-shadcn-accent: hsl(210 40% 96.1%);
  --aih-shadcn-accent-foreground: hsl(222.2 47.4% 11.2%);
  --aih-shadcn-destructive: hsl(0 84.2% 60.2%);
  --aih-shadcn-destructive-foreground: hsl(210 40% 98%);
  --aih-shadcn-border: hsl(214.3 31.8% 91.4%);
  --aih-shadcn-input: hsl(214.3 31.8% 91.4%);
  --aih-shadcn-ring: hsl(222.2 84% 4.9%);
  --aih-shadcn-radius: 0.5rem;
  --aih-shadcn-dialog-z-index: 50;
  --aih-shadcn-popover-z-index: 70;
  --aih-shadcn-toast-z-index: 100;
  --aih-shadcn-chat-user: var(--aih-shadcn-primary);
  --aih-shadcn-chat-user-foreground: var(--aih-shadcn-primary-foreground);
  --aih-shadcn-chat-user-border: var(--aih-shadcn-ring);
  --aih-shadcn-chat-assistant: color-mix(in srgb, var(--aih-shadcn-card) 40%, var(--aih-shadcn-muted));
  --aih-shadcn-chat-assistant-foreground: var(--aih-shadcn-card-foreground);
  --aih-shadcn-chat-assistant-border: color-mix(in srgb, var(--aih-shadcn-border) 82%, var(--aih-shadcn-foreground));
}

.aih-shadcn-theme.dark,
.dark .aih-shadcn-theme,
.aih-shadcn-portal-root.dark,
.dark .aih-shadcn-portal-root,
html[data-theme="dark"] .aih-shadcn-portal-root {
  --aih-shadcn-background: hsl(222.2 84% 4.9%);
  --aih-shadcn-foreground: hsl(210 40% 98%);
  --aih-shadcn-card: hsl(222.2 47.4% 11.2%);
  --aih-shadcn-card-foreground: hsl(210 40% 98%);
  --aih-shadcn-popover: hsl(222.2 84% 4.9%);
  --aih-shadcn-popover-foreground: hsl(210 40% 98%);
  --aih-shadcn-primary: hsl(210 40% 98%);
  --aih-shadcn-primary-foreground: hsl(222.2 47.4% 11.2%);
  --aih-shadcn-secondary: hsl(217.2 32.6% 17.5%);
  --aih-shadcn-secondary-foreground: hsl(210 40% 98%);
  --aih-shadcn-muted: hsl(217.2 32.6% 17.5%);
  --aih-shadcn-muted-foreground: hsl(215 20.2% 65.1%);
  --aih-shadcn-accent: hsl(217.2 32.6% 17.5%);
  --aih-shadcn-accent-foreground: hsl(210 40% 98%);
  --aih-shadcn-destructive: hsl(0 62.8% 30.6%);
  --aih-shadcn-destructive-foreground: hsl(210 40% 98%);
  --aih-shadcn-border: hsl(217.2 32.6% 17.5%);
  --aih-shadcn-input: hsl(217.2 32.6% 17.5%);
  --aih-shadcn-ring: hsl(212.7 26.8% 83.9%);
  --aih-shadcn-chat-user: var(--aih-shadcn-secondary);
  --aih-shadcn-chat-user-foreground: var(--aih-shadcn-secondary-foreground);
  --aih-shadcn-chat-user-border: color-mix(in srgb, var(--aih-shadcn-ring) 45%, transparent);
  --aih-shadcn-chat-assistant: color-mix(in srgb, var(--aih-shadcn-background) 55%, var(--aih-shadcn-card));
  --aih-shadcn-chat-assistant-foreground: var(--aih-shadcn-card-foreground);
  --aih-shadcn-chat-assistant-border: color-mix(in srgb, var(--aih-shadcn-border) 80%, var(--aih-shadcn-ring));
}

.aih-shadcn-theme,
.aih-shadcn-theme *,
.aih-shadcn-portal-root,
.aih-shadcn-portal-root * { box-sizing: border-box; }

.aih-shadcn-theme,
.aih-shadcn-portal-root {
  min-height: 100%;
  color: var(--aih-shadcn-foreground);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.aih-shadcn-theme { background: var(--aih-shadcn-background); }
.aih-shadcn-portal-root { min-height: 0; }

.aih-shadcn-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  white-space: nowrap;
  border-radius: calc(var(--aih-shadcn-radius) - 2px);
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  transition: color .15s ease, background-color .15s ease, border-color .15s ease, opacity .15s ease;
  cursor: pointer;
}
.aih-shadcn-btn:disabled { pointer-events: none; opacity: .5; }
.aih-shadcn-btn:focus-visible,
.aih-shadcn-input:focus-visible,
.aih-shadcn-textarea:focus-visible,
.aih-shadcn-select-trigger:focus-visible { outline: 2px solid var(--aih-shadcn-ring); outline-offset: 2px; }
.aih-shadcn-btn-primary { background: var(--aih-shadcn-primary); color: var(--aih-shadcn-primary-foreground); }
.aih-shadcn-btn-primary:hover { opacity: .9; }
.aih-shadcn-btn-secondary { background: var(--aih-shadcn-secondary); color: var(--aih-shadcn-secondary-foreground); }
.aih-shadcn-btn-outline { border-color: var(--aih-shadcn-input); background: var(--aih-shadcn-background); color: var(--aih-shadcn-foreground); }
.aih-shadcn-btn-outline:hover,
.aih-shadcn-btn-secondary:hover,
.aih-shadcn-btn-ghost:hover,
.aih-shadcn-btn-subtle:hover { background: var(--aih-shadcn-accent); color: var(--aih-shadcn-accent-foreground); }
.aih-shadcn-btn-ghost,
.aih-shadcn-btn-subtle { background: transparent; color: var(--aih-shadcn-foreground); }
.aih-shadcn-btn-danger { background: var(--aih-shadcn-destructive); color: var(--aih-shadcn-destructive-foreground); }
.aih-shadcn-btn-sm { height: 2rem; padding: 0 .75rem; font-size: .8125rem; }
.aih-shadcn-btn-md { height: 2.25rem; padding: 0 1rem; }
.aih-shadcn-btn-lg { height: 2.5rem; padding: 0 1.25rem; }
.aih-shadcn-btn-icon { width: 2.25rem; padding: 0; }

.aih-shadcn-input,
.aih-shadcn-textarea,
.aih-shadcn-select-trigger {
  width: 100%;
  border-radius: calc(var(--aih-shadcn-radius) - 2px);
  border: 1px solid var(--aih-shadcn-input);
  background: var(--aih-shadcn-background);
  color: var(--aih-shadcn-foreground);
  font-size: .875rem;
  line-height: 1.25rem;
}
.aih-shadcn-input { height: 2.25rem; padding: 0 .75rem; }
.aih-shadcn-textarea { min-height: 5rem; padding: .5rem .75rem; resize: vertical; }
.aih-shadcn-field { display: grid; gap: .375rem; }
.aih-shadcn-label { font-size: .875rem; font-weight: 500; }
.aih-shadcn-hint { color: var(--aih-shadcn-muted-foreground); font-size: .8125rem; }

.aih-shadcn-card { border: 1px solid var(--aih-shadcn-border); border-radius: var(--aih-shadcn-radius); background: var(--aih-shadcn-card); color: var(--aih-shadcn-card-foreground); box-shadow: 0 1px 2px rgb(0 0 0 / .05); overflow: hidden; }
.aih-shadcn-card-header { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: flex-start; gap: .75rem; padding: 1rem 1rem .5rem; }
.aih-shadcn-card-header-no-image { grid-template-columns: minmax(0, 1fr) auto; }
.aih-shadcn-card-image { display: inline-flex; align-items: flex-start; justify-content: center; flex: none; min-width: 0; }
.aih-shadcn-card-image > * { flex: none; }
.aih-shadcn-card-header-main { min-width: 0; display: flex; flex-direction: column; gap: .25rem; }
.aih-shadcn-card-header-actions { display: inline-flex; align-items: flex-start; justify-content: flex-end; flex: none; min-width: 0; margin-left: auto; }
.aih-shadcn-card-title { margin: 0; font-size: 1rem; font-weight: 600; }
.aih-shadcn-card-description { color: var(--aih-shadcn-muted-foreground); font-size: .875rem; }
.aih-shadcn-card-content { padding: 1rem; }
.aih-shadcn-card-footer { border-top: 1px solid var(--aih-shadcn-border); padding: .75rem 1rem; }

.aih-shadcn-badge { display: inline-flex; align-items: center; gap: .25rem; border-radius: 999px; border: 1px solid transparent; padding: .125rem .625rem; font-size: .75rem; font-weight: 600; line-height: 1.25rem; }
.aih-shadcn-badge-primary { background: var(--aih-shadcn-primary); color: var(--aih-shadcn-primary-foreground); }
.aih-shadcn-badge-secondary { background: var(--aih-shadcn-secondary); color: var(--aih-shadcn-secondary-foreground); }
.aih-shadcn-badge-outline { border-color: var(--aih-shadcn-border); color: var(--aih-shadcn-foreground); }
.aih-shadcn-badge-danger { background: var(--aih-shadcn-destructive); color: var(--aih-shadcn-destructive-foreground); }

.aih-shadcn-popover { z-index: var(--aih-shadcn-popover-z-index); min-width: 12rem; border: 1px solid var(--aih-shadcn-border); border-radius: var(--aih-shadcn-radius); background: var(--aih-shadcn-popover); color: var(--aih-shadcn-popover-foreground); box-shadow: 0 10px 30px rgb(0 0 0 / .18); padding: .25rem; }
.aih-shadcn-menu-content,
.aih-shadcn-menu-sub-content { max-height: min(var(--radix-dropdown-menu-content-available-height, 24rem), 24rem); overflow-y: auto; }
.aih-shadcn-select-content { width: var(--radix-select-trigger-width); max-height: min(var(--radix-select-content-available-height, 24rem), 24rem); overflow: hidden; }
.aih-shadcn-select-viewport { max-height: min(var(--radix-select-content-available-height, 24rem), 24rem); overflow-y: auto; padding: .25rem; }
.aih-shadcn-select-scroll-button { display: flex; align-items: center; justify-content: center; height: 1.5rem; color: var(--aih-shadcn-muted-foreground); cursor: default; }
.aih-shadcn-tooltip-content { min-width: 0; max-width: min(24rem, calc(100vw - 2rem)); padding: .375rem .625rem; font-size: .8125rem; }
.aih-shadcn-menu-item { display: flex; align-items: center; gap: .5rem; width: 100%; border: 0; border-radius: calc(var(--aih-shadcn-radius) - 4px); background: transparent; color: inherit; padding: .5rem .625rem; font-size: .875rem; text-align: left; cursor: pointer; user-select: none; outline: none; }
.aih-shadcn-menu-item:hover,
.aih-shadcn-menu-item[data-highlighted] { background: var(--aih-shadcn-accent); color: var(--aih-shadcn-accent-foreground); }
.aih-shadcn-menu-item[data-disabled] { pointer-events: none; opacity: .5; }
.aih-shadcn-menu-item-danger { color: var(--aih-shadcn-destructive); }
.aih-shadcn-menu-separator { height: 1px; margin: .25rem 0; background: var(--aih-shadcn-border); }

.aih-shadcn-dialog-overlay { position: fixed; inset: 0; z-index: var(--aih-shadcn-dialog-z-index); background: rgb(0 0 0 / .55); }
.aih-shadcn-dialog-content { position: fixed; left: 50%; top: 50%; z-index: calc(var(--aih-shadcn-dialog-z-index) + 1); width: min(calc(100vw - 2rem), 36rem); transform: translate(-50%, -50%); border: 1px solid var(--aih-shadcn-border); border-radius: var(--aih-shadcn-radius); background: var(--aih-shadcn-background); color: var(--aih-shadcn-foreground); box-shadow: 0 20px 60px rgb(0 0 0 / .25); padding: 1rem; }
.aih-shadcn-drawer-content { position: fixed; inset-block: 0; right: 0; z-index: calc(var(--aih-shadcn-dialog-z-index) + 1); width: min(28rem, 90vw); border-left: 1px solid var(--aih-shadcn-border); background: var(--aih-shadcn-background); color: var(--aih-shadcn-foreground); box-shadow: -10px 0 30px rgb(0 0 0 / .18); padding: 1rem; overflow: auto; }

.aih-shadcn-tabs-list { display: inline-flex; align-items: center; gap: .25rem; border-radius: var(--aih-shadcn-radius); background: var(--aih-shadcn-muted); padding: .25rem; }
.aih-shadcn-tabs-trigger { border: 0; border-radius: calc(var(--aih-shadcn-radius) - 2px); background: transparent; color: var(--aih-shadcn-muted-foreground); padding: .375rem .75rem; font-size: .875rem; cursor: pointer; }
.aih-shadcn-tabs-trigger[data-state="active"] { background: var(--aih-shadcn-background); color: var(--aih-shadcn-foreground); box-shadow: 0 1px 2px rgb(0 0 0 / .05); }
.aih-shadcn-tabs-content { margin-top: .75rem; }

.aih-shadcn-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.aih-shadcn-table th,
.aih-shadcn-table td { border-bottom: 1px solid var(--aih-shadcn-border); padding: .625rem .75rem; text-align: left; vertical-align: top; }
.aih-shadcn-table th { color: var(--aih-shadcn-muted-foreground); font-weight: 600; }

.aih-shadcn-progress-root { position: relative; height: .5rem; overflow: hidden; border-radius: 999px; background: var(--aih-shadcn-secondary); }
.aih-shadcn-progress-indicator { height: 100%; background: var(--aih-shadcn-primary); transition: width .2s ease; }
.aih-shadcn-spinner { display: inline-block; border-radius: 999px; border: 2px solid var(--aih-shadcn-muted); border-top-color: var(--aih-shadcn-primary); animation: aih-shadcn-spin .8s linear infinite; }
@keyframes aih-shadcn-spin { to { transform: rotate(360deg); } }
.aih-shadcn-skeleton { display: inline-block; background: var(--aih-shadcn-muted); position: relative; overflow: hidden; }
.aih-shadcn-skeleton::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgb(255 255 255 / .25), transparent); animation: aih-shadcn-shimmer 1.5s infinite; }
@keyframes aih-shadcn-shimmer { to { transform: translateX(100%); } }

.aih-shadcn-chat { display: flex; flex-direction: column; gap: .75rem; padding: .75rem; }
.aih-shadcn-chat-message { width: min(75%, 52rem); border: 1px solid var(--aih-shadcn-border); border-radius: var(--aih-shadcn-radius); background: var(--aih-shadcn-card); color: var(--aih-shadcn-card-foreground); overflow: hidden; }
.aih-shadcn-chat-message-user { align-self: flex-end; border-color: var(--aih-shadcn-chat-user-border); background: var(--aih-shadcn-chat-user); color: var(--aih-shadcn-chat-user-foreground); }
.aih-shadcn-chat-message-assistant { align-self: flex-start; border-color: var(--aih-shadcn-chat-assistant-border); background: var(--aih-shadcn-chat-assistant); color: var(--aih-shadcn-chat-assistant-foreground); }
.aih-shadcn-chat-message-user .aih-shadcn-chat-header,
.aih-shadcn-chat-message-user .aih-shadcn-chat-footer { border-color: rgb(255 255 255 / .16); }
.aih-shadcn-chat-message-assistant .aih-shadcn-chat-header,
.aih-shadcn-chat-message-assistant .aih-shadcn-chat-footer { border-color: var(--aih-shadcn-chat-assistant-border); }
.aih-shadcn-chat-message-user .aih-shadcn-hint { color: color-mix(in srgb, var(--aih-shadcn-chat-user-foreground) 70%, transparent); }
.aih-shadcn-chat-header { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .625rem .75rem; border-bottom: 1px solid var(--aih-shadcn-border); font-size: .8125rem; }
.aih-shadcn-chat-body { padding: .75rem; }
.aih-shadcn-chat-footer { padding: .5rem .75rem; border-top: 1px solid var(--aih-shadcn-border); }

.aih-shadcn-toast-viewport { position: fixed; right: 1rem; bottom: 1rem; z-index: var(--aih-shadcn-toast-z-index); display: flex; max-width: min(24rem, calc(100vw - 2rem)); flex-direction: column; gap: .5rem; margin: 0; padding: 0; list-style: none; }
.aih-shadcn-toast-root { border: 1px solid var(--aih-shadcn-border); border-radius: var(--aih-shadcn-radius); background: var(--aih-shadcn-popover); color: var(--aih-shadcn-popover-foreground); padding: .75rem; box-shadow: 0 10px 30px rgb(0 0 0 / .15); }
`;

