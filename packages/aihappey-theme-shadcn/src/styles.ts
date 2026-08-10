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
  --aih-shadcn-info: hsl(221.2 83.2% 53.3%);
  --aih-shadcn-info-foreground: hsl(210 40% 98%);
  --aih-shadcn-success: hsl(142.1 76.2% 36.3%);
  --aih-shadcn-success-foreground: hsl(355.7 100% 97.3%);
  --aih-shadcn-border: hsl(214.3 31.8% 91.4%);
  --aih-shadcn-input: hsl(214.3 31.8% 91.4%);
  --aih-shadcn-ring: hsl(222.2 84% 4.9%);
  --aih-shadcn-radius: 0.5rem;
  --aih-shadcn-dialog-z-index: 50;
  --aih-shadcn-popover-z-index: 70;
  --aih-shadcn-toast-z-index: 100;
  --aih-shadcn-chat-user: var(--aih-shadcn-primary);
  --aih-shadcn-chat-user-foreground: var(--aih-shadcn-primary-foreground);
  --aih-shadcn-chat-user-border: transparent;
  --aih-shadcn-chat-assistant: color-mix(in srgb, var(--aih-shadcn-card) 40%, var(--aih-shadcn-muted));
  --aih-shadcn-chat-assistant-foreground: var(--aih-shadcn-card-foreground);
  --aih-shadcn-chat-assistant-border: color-mix(in srgb, var(--aih-shadcn-border) 82%, var(--aih-shadcn-foreground));
}

.aih-shadcn-theme.dark,
.dark .aih-shadcn-theme:not(.light),
.aih-shadcn-portal-root.dark,
.dark .aih-shadcn-portal-root:not(.light),
html[data-theme="dark"] .aih-shadcn-portal-root:not(.light) {
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
  --aih-shadcn-info: hsl(217.2 91.2% 59.8%);
  --aih-shadcn-info-foreground: hsl(222.2 47.4% 11.2%);
  --aih-shadcn-success: hsl(142.1 70.6% 45.3%);
  --aih-shadcn-success-foreground: hsl(144.9 80.4% 10%);
  --aih-shadcn-border: hsl(217.2 32.6% 17.5%);
  --aih-shadcn-input: hsl(217.2 32.6% 17.5%);
  --aih-shadcn-ring: hsl(212.7 26.8% 83.9%);
  --aih-shadcn-chat-user: var(--aih-shadcn-secondary);
  --aih-shadcn-chat-user-foreground: var(--aih-shadcn-secondary-foreground);
  --aih-shadcn-chat-user-border: transparent;
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
.aih-shadcn-theme.light,
.aih-shadcn-portal-root.light { color-scheme: light; }
.aih-shadcn-theme.dark,
.aih-shadcn-portal-root.dark { color-scheme: dark; }

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
.aih-shadcn-toggle-active {
  border-color: color-mix(in srgb, var(--aih-shadcn-primary) 26%, transparent);
  background: color-mix(in srgb, var(--aih-shadcn-primary) 12%, transparent);
  color: var(--aih-shadcn-primary);
  font-weight: 700;
}
.aih-shadcn-toggle-active:hover {
  background: color-mix(in srgb, var(--aih-shadcn-primary) 18%, transparent);
  color: var(--aih-shadcn-primary);
}
.aih-shadcn-toggle-active svg { stroke-width: 2.5; }

.aih-shadcn-input,
.aih-shadcn-textarea,
.aih-shadcn-select-trigger {
  border-radius: calc(var(--aih-shadcn-radius) - 2px);
  border: 1px solid var(--aih-shadcn-input);
  background: var(--aih-shadcn-background);
  color: var(--aih-shadcn-foreground);
  font-size: .875rem;
  line-height: 1.25rem;
}
.aih-shadcn-input,
.aih-shadcn-textarea { width: 100%; }
.aih-shadcn-field .aih-shadcn-select-trigger { width: 100%; }
.aih-shadcn-select-trigger { max-width: 100%; cursor: pointer; }
.aih-shadcn-select-trigger:disabled { cursor: not-allowed; opacity: .5; }
.aih-shadcn-select-value { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aih-shadcn-input { height: 2.25rem; padding: 0 .75rem; }
.aih-shadcn-textarea { min-height: 5rem; padding: .5rem .75rem; resize: vertical; }
.aih-shadcn-field { display: grid; gap: .375rem; }
.aih-shadcn-label { font-size: .875rem; font-weight: 500; }
.aih-shadcn-hint { color: var(--aih-shadcn-muted-foreground); font-size: .8125rem; }

.aih-shadcn-searchbox { position: relative; }
.aih-shadcn-searchbox-icon {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: .625rem;
  transform: translateY(-50%);
  color: var(--aih-shadcn-muted-foreground);
  pointer-events: none;
}
.aih-shadcn-searchbox-input { padding-left: 2.125rem; }
.aih-shadcn-searchbox-input-clearable { padding-right: 2.125rem; }
.aih-shadcn-searchbox-clear {
  position: absolute;
  top: 50%;
  right: .375rem;
  display: inline-flex;
  width: 1.5rem;
  height: 1.5rem;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
  border: 0;
  border-radius: calc(var(--aih-shadcn-radius) - 4px);
  background: transparent;
  color: var(--aih-shadcn-muted-foreground);
  cursor: pointer;
  transition: color .15s ease, background-color .15s ease;
}
.aih-shadcn-searchbox-clear:hover { background: var(--aih-shadcn-accent); color: var(--aih-shadcn-accent-foreground); }
.aih-shadcn-searchbox-clear:focus-visible { outline: 2px solid var(--aih-shadcn-ring); outline-offset: 1px; }

.aih-shadcn-switch { position: relative; width: 2.5rem; height: 1.375rem; flex: 0 0 auto; border: 1px solid var(--aih-shadcn-border); border-radius: 999px; background: var(--aih-shadcn-input); padding: 2px; cursor: pointer; transition: background-color .15s ease, border-color .15s ease, opacity .15s ease; }
.aih-shadcn-switch[data-state="checked"] { border-color: var(--aih-shadcn-primary); background: var(--aih-shadcn-primary); }
.aih-shadcn-switch[data-state="unchecked"] { border-color: color-mix(in srgb, var(--aih-shadcn-border) 55%, var(--aih-shadcn-ring)); background: color-mix(in srgb, var(--aih-shadcn-input) 78%, var(--aih-shadcn-foreground)); }
.aih-shadcn-switch:focus-visible { outline: 2px solid var(--aih-shadcn-ring); outline-offset: 2px; }
.aih-shadcn-switch[data-disabled] { cursor: not-allowed; opacity: .5; }
.aih-shadcn-switch-thumb { display: block; width: 1rem; height: 1rem; border-radius: 999px; background: var(--aih-shadcn-background); box-shadow: 0 1px 2px rgb(0 0 0 / .25); transition: transform .15s ease, background-color .15s ease; }
.aih-shadcn-switch-thumb[data-state="checked"] { transform: translateX(1.125rem); }
.aih-shadcn-switch-thumb[data-state="unchecked"] { transform: translateX(0); }

.aih-shadcn-slider { position: relative; display: flex; align-items: center; width: 100%; height: 1.25rem; touch-action: none; user-select: none; cursor: pointer; }
.aih-shadcn-slider[data-disabled] { cursor: not-allowed; opacity: .5; }
.aih-shadcn-slider-track { position: relative; flex-grow: 1; height: .375rem; overflow: hidden; border-radius: 999px; background: var(--aih-shadcn-secondary); }
.aih-shadcn-slider-range { position: absolute; height: 100%; border-radius: 999px; background: var(--aih-shadcn-primary); }
.aih-shadcn-slider-thumb { display: block; width: 1rem; height: 1rem; border: 2px solid var(--aih-shadcn-primary); border-radius: 999px; background: var(--aih-shadcn-background); box-shadow: 0 1px 2px rgb(0 0 0 / .12); transition: border-color .15s ease, background-color .15s ease, box-shadow .15s ease; }
.aih-shadcn-slider-thumb:focus-visible { outline: 2px solid var(--aih-shadcn-ring); outline-offset: 2px; }
.aih-shadcn-slider[data-disabled] .aih-shadcn-slider-range { background: var(--aih-shadcn-muted-foreground); }
.aih-shadcn-slider[data-disabled] .aih-shadcn-slider-thumb { border-color: var(--aih-shadcn-muted-foreground); background: var(--aih-shadcn-muted); box-shadow: none; }

.aih-shadcn-audio-player {
  display: flex;
  align-items: center;
  gap: .75rem;
  width: 100%;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--aih-shadcn-border) 70%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--aih-shadcn-muted) 82%, var(--aih-shadcn-background));
  color: var(--aih-shadcn-foreground);
  padding: .5rem .625rem;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .04), 0 1px 2px rgb(0 0 0 / .05);
}
.aih-shadcn-audio-player audio { display: none; }
.aih-shadcn-audio-button {
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  color: var(--aih-shadcn-foreground);
}
.aih-shadcn-audio-button:hover { background: color-mix(in srgb, var(--aih-shadcn-accent) 82%, var(--aih-shadcn-foreground)); }
.aih-shadcn-audio-main {
  display: grid;
  grid-template-columns: minmax(6rem, 1fr) auto;
  align-items: center;
  gap: .75rem;
  flex: 1 1 auto;
  min-width: 0;
}
.aih-shadcn-audio-seek { min-width: 4rem; }
.aih-shadcn-audio-seek .aih-shadcn-slider-track,
.aih-shadcn-audio-volume-slider .aih-shadcn-slider-track {
  background: color-mix(in srgb, var(--aih-shadcn-muted-foreground) 26%, transparent);
}
.aih-shadcn-audio-seek .aih-shadcn-slider-range,
.aih-shadcn-audio-volume-slider .aih-shadcn-slider-range { background: var(--aih-shadcn-primary); }
.aih-shadcn-audio-seek .aih-shadcn-slider-thumb,
.aih-shadcn-audio-volume-slider .aih-shadcn-slider-thumb {
  width: .875rem;
  height: .875rem;
  border-width: 2px;
}
.aih-shadcn-audio-time {
  display: inline-flex;
  align-items: center;
  gap: .25rem;
  min-width: max-content;
  color: var(--aih-shadcn-muted-foreground);
  font-size: .8125rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}
.aih-shadcn-audio-volume {
  display: inline-flex;
  align-items: center;
  gap: .375rem;
  flex: 0 0 auto;
}
.aih-shadcn-audio-volume-slider { width: 4.5rem; }
@media (max-width: 36rem) {
  .aih-shadcn-audio-player { gap: .5rem; border-radius: var(--aih-shadcn-radius); }
  .aih-shadcn-audio-main { grid-template-columns: minmax(0, 1fr); gap: .25rem; }
  .aih-shadcn-audio-time { justify-content: flex-start; font-size: .75rem; }
  .aih-shadcn-audio-volume-slider { display: none; }
}

.aih-shadcn-card { border: 1px solid var(--aih-shadcn-border); border-radius: var(--aih-shadcn-radius); background: var(--aih-shadcn-card); color: var(--aih-shadcn-card-foreground); box-shadow: 0 1px 2px rgb(0 0 0 / .05); overflow: hidden; }
.aih-shadcn-theme.light .aih-shadcn-card,
.aih-shadcn-portal-root.light .aih-shadcn-card { background: var(--aih-shadcn-card); color: var(--aih-shadcn-card-foreground); }
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

.aih-shadcn-json-viewer { overflow: auto; max-width: 100%; border: 1px solid var(--aih-shadcn-border); border-radius: var(--aih-shadcn-radius); background: var(--aih-shadcn-muted); padding: .75rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-size: .875rem; line-height: 1.45; white-space: pre-wrap; }
.aih-shadcn-json-viewer details { min-width: 0; }
.aih-shadcn-json-viewer summary { cursor: default; font-weight: 600; }
.aih-shadcn-json-viewer ul { margin: 0 0 0 1rem; padding: 0; list-style-position: outside; }
.aih-shadcn-json-viewer li { margin: .125rem 0; padding-left: .25rem; }
.aih-shadcn-json-primitive { color: var(--aih-shadcn-primary); word-break: break-word; overflow-wrap: anywhere; }
.aih-shadcn-json-error { color: var(--aih-shadcn-destructive); }

.aih-shadcn-badge { display: inline-flex; align-items: center; gap: .25rem; border-radius: 999px; border: 1px solid transparent; padding: .125rem .625rem; font-size: .75rem; font-weight: 600; line-height: 1.25rem; }
.aih-shadcn-badge-primary { background: var(--aih-shadcn-primary); color: var(--aih-shadcn-primary-foreground); }
.aih-shadcn-badge-secondary { background: var(--aih-shadcn-secondary); color: var(--aih-shadcn-secondary-foreground); }
.aih-shadcn-badge-outline { border-color: var(--aih-shadcn-border); color: var(--aih-shadcn-foreground); }
.aih-shadcn-badge-ghost { background: transparent; color: var(--aih-shadcn-foreground); }
.aih-shadcn-badge-subtle { background: color-mix(in srgb, var(--aih-shadcn-foreground) 8%, transparent); color: var(--aih-shadcn-foreground); }
.aih-shadcn-badge-tint { background: color-mix(in srgb, currentColor 12%, transparent); color: var(--aih-shadcn-foreground); }
.aih-shadcn-badge-danger { background: var(--aih-shadcn-destructive); color: var(--aih-shadcn-destructive-foreground); }
.aih-shadcn-badge-info { background: var(--aih-shadcn-info); color: var(--aih-shadcn-info-foreground); }
.aih-shadcn-badge-success { background: var(--aih-shadcn-success); color: var(--aih-shadcn-success-foreground); }
.aih-shadcn-badge-outline.aih-shadcn-badge-tone-primary { border-color: color-mix(in srgb, var(--aih-shadcn-primary) 64%, transparent); color: var(--aih-shadcn-primary); }
.aih-shadcn-badge-outline.aih-shadcn-badge-tone-info { border-color: color-mix(in srgb, var(--aih-shadcn-info) 64%, transparent); color: var(--aih-shadcn-info); }
.aih-shadcn-badge-outline.aih-shadcn-badge-tone-success { border-color: color-mix(in srgb, var(--aih-shadcn-success) 64%, transparent); color: var(--aih-shadcn-success); }
.aih-shadcn-badge-outline.aih-shadcn-badge-tone-danger { border-color: color-mix(in srgb, var(--aih-shadcn-destructive) 64%, transparent); color: var(--aih-shadcn-destructive); }
.aih-shadcn-badge-tint.aih-shadcn-badge-tone-primary { background: color-mix(in srgb, var(--aih-shadcn-primary) 12%, transparent); color: var(--aih-shadcn-primary); }
.aih-shadcn-badge-tint.aih-shadcn-badge-tone-info { background: color-mix(in srgb, var(--aih-shadcn-info) 12%, transparent); color: var(--aih-shadcn-info); }
.aih-shadcn-badge-tint.aih-shadcn-badge-tone-success { background: color-mix(in srgb, var(--aih-shadcn-success) 12%, transparent); color: var(--aih-shadcn-success); }
.aih-shadcn-badge-tint.aih-shadcn-badge-tone-danger { background: color-mix(in srgb, var(--aih-shadcn-destructive) 12%, transparent); color: var(--aih-shadcn-destructive); }
.aih-shadcn-tag-image { width: 1rem; height: 1rem; border-radius: 999px; object-fit: contain; }
.aih-shadcn-tag-remove { display: inline-flex; align-items: center; justify-content: center; width: 1rem; height: 1rem; margin-inline: .125rem -.25rem; padding: 0; border: 0; border-radius: 999px; background: transparent; color: currentColor; opacity: .75; cursor: pointer; }
.aih-shadcn-tag-remove:hover,
.aih-shadcn-tag-remove:focus-visible { opacity: 1; background: color-mix(in srgb, currentColor 12%, transparent); outline: none; }

.aih-shadcn-popover { z-index: var(--aih-shadcn-popover-z-index); min-width: 12rem; border: 1px solid var(--aih-shadcn-border); border-radius: var(--aih-shadcn-radius); background: var(--aih-shadcn-popover); color: var(--aih-shadcn-popover-foreground); box-shadow: 0 10px 30px rgb(0 0 0 / .18); padding: .25rem; }
.aih-shadcn-menu-content,
.aih-shadcn-menu-sub-content { max-height: min(var(--radix-dropdown-menu-content-available-height, 24rem), 24rem); overflow-y: auto; }
.aih-shadcn-select-content { width: var(--radix-select-trigger-width, var(--radix-dropdown-menu-trigger-width)); max-height: min(var(--radix-select-content-available-height, var(--radix-dropdown-menu-content-available-height, 24rem)), 24rem); overflow: hidden; }
.aih-shadcn-multiselect-content { width: var(--radix-dropdown-menu-trigger-width); max-height: min(var(--radix-dropdown-menu-content-available-height, 24rem), 24rem); overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y; -webkit-overflow-scrolling: touch; }
.aih-shadcn-select-viewport { max-height: min(var(--radix-select-content-available-height, var(--radix-dropdown-menu-content-available-height, 24rem)), 24rem); overflow-y: auto; padding: .25rem; touch-action: pan-y; -webkit-overflow-scrolling: touch; }
.aih-shadcn-dropdown-select-viewport { max-height: min(calc(var(--radix-dropdown-menu-content-available-height, 24rem) - 3rem), 21rem); overscroll-behavior: contain; }
.aih-shadcn-select-search { position: relative; padding: .25rem .25rem .375rem; }
.aih-shadcn-select-search-icon { position: absolute; left: .875rem; top: 50%; transform: translateY(-50%); color: var(--aih-shadcn-muted-foreground); pointer-events: none; }
.aih-shadcn-select-search-input { height: 2rem; padding-left: 2.125rem; }
.aih-shadcn-select-empty { padding: .625rem .75rem; color: var(--aih-shadcn-muted-foreground); font-size: .875rem; text-align: center; }
.aih-shadcn-select-scroll-button { display: flex; align-items: center; justify-content: center; width: 100%; height: 1.5rem; border: 0; border-radius: calc(var(--aih-shadcn-radius) - 2px); background: transparent; color: var(--aih-shadcn-muted-foreground); cursor: default; }
.aih-shadcn-select-scroll-button:not(:disabled) { cursor: pointer; }
.aih-shadcn-select-scroll-button:not(:disabled):hover { background: var(--aih-shadcn-accent); color: var(--aih-shadcn-accent-foreground); }
.aih-shadcn-select-scroll-button:disabled { opacity: .35; }
.aih-shadcn-select-group-label { padding: .375rem .625rem .25rem; color: var(--aih-shadcn-muted-foreground); font-size: .75rem; font-weight: 600; line-height: 1rem; }
.aih-shadcn-select-item-indicator,
.aih-shadcn-multiselect-item-indicator { position: absolute; left: .625rem; display: inline-flex; width: 1rem; align-items: center; justify-content: center; color: currentColor; }
.aih-shadcn-multiselect-item-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aih-shadcn-tooltip-content { min-width: 0; max-width: min(24rem, calc(100vw - 2rem)); padding: .375rem .625rem; font-size: .8125rem; }
.aih-shadcn-menu-item { display: flex; align-items: center; gap: .5rem; width: 100%; border: 0; border-radius: calc(var(--aih-shadcn-radius) - 4px); background: transparent; color: inherit; padding: .5rem .625rem; font-size: .875rem; text-align: left; cursor: pointer; user-select: none; outline: none; }
.aih-shadcn-menu-item.aih-shadcn-select-item,
.aih-shadcn-menu-item.aih-shadcn-multiselect-item { position: relative; padding-left: 2rem; }
.aih-shadcn-menu-item:hover,
.aih-shadcn-menu-item[data-highlighted] { background: var(--aih-shadcn-accent); color: var(--aih-shadcn-accent-foreground); }
.aih-shadcn-menu-item[data-disabled] { pointer-events: none; opacity: .5; }
.aih-shadcn-menu-item-danger { color: var(--aih-shadcn-destructive); }
.aih-shadcn-menu-separator { height: 1px; margin: .25rem 0; background: var(--aih-shadcn-border); }

.aih-shadcn-dialog-overlay { position: fixed; inset: 0; z-index: var(--aih-shadcn-dialog-z-index); background: rgb(0 0 0 / .55); }
.aih-shadcn-dialog-content { position: fixed; left: 50%; top: 50%; z-index: calc(var(--aih-shadcn-dialog-z-index) + 1); display: flex; width: min(calc(100vw - 2rem), 36rem); max-height: min(calc(100dvh - 2rem), calc(100vh - 2rem)); flex-direction: column; overflow: hidden; transform: translate(-50%, -50%); border: 1px solid var(--aih-shadcn-border); border-radius: var(--aih-shadcn-radius); background: var(--aih-shadcn-background); color: var(--aih-shadcn-foreground); box-shadow: 0 20px 60px rgb(0 0 0 / .25); }
.aih-shadcn-dialog-header { display: flex; flex: 0 0 auto; align-items: flex-start; justify-content: space-between; gap: .5rem; padding: 1rem 1rem 0; }
.aih-shadcn-dialog-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 1rem; }
.aih-shadcn-dialog-footer { display: flex; flex: 0 0 auto; justify-content: flex-end; gap: .5rem; border-top: 1px solid var(--aih-shadcn-border); background: var(--aih-shadcn-background); padding: .75rem 1rem 1rem; }
.aih-shadcn-drawer-content { position: fixed; inset-block: 0; right: 0; z-index: calc(var(--aih-shadcn-dialog-z-index) + 1); display: flex; width: min(28rem, 90vw); flex-direction: column; overflow: hidden; border-left: 1px solid var(--aih-shadcn-border); background: var(--aih-shadcn-background); color: var(--aih-shadcn-foreground); box-shadow: -10px 0 30px rgb(0 0 0 / .18); }
.aih-shadcn-drawer-small { width: min(28rem, 90vw); }
.aih-shadcn-drawer-medium { width: min(36rem, 90vw); }
.aih-shadcn-drawer-large { width: min(56rem, 90vw); }
.aih-shadcn-drawer-full { width: 100vw; max-width: 100vw; }
.aih-shadcn-drawer-header { display: flex; flex: 0 0 auto; flex-direction: column; gap: .5rem; padding: 1rem 1rem 0; }
.aih-shadcn-drawer-navigation { display: flex; width: 100%; align-items: center; justify-content: flex-end; }
.aih-shadcn-drawer-title-row { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: .5rem; }
.aih-shadcn-drawer-body { flex: 1 1 auto; min-height: 0; overflow: auto; overscroll-behavior: contain; padding: .75rem 1rem 1rem; }

.aih-shadcn-tabs-scroll { width: 100%; max-width: 100%; min-width: 0; overflow-x: auto; overflow-y: hidden; overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch; scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--aih-shadcn-muted-foreground) 30%, transparent) transparent; padding-bottom: .125rem; }
.aih-shadcn-tabs-scroll::-webkit-scrollbar { height: .375rem; }
.aih-shadcn-tabs-scroll::-webkit-scrollbar-track { background: transparent; }
.aih-shadcn-tabs-scroll::-webkit-scrollbar-thumb { border-radius: 999px; background: color-mix(in srgb, var(--aih-shadcn-muted-foreground) 30%, transparent); }
.aih-shadcn-tabs-scroll::-webkit-scrollbar-thumb:hover { background: color-mix(in srgb, var(--aih-shadcn-muted-foreground) 45%, transparent); }
.aih-shadcn-tabs { max-width: 100%; min-width: 0; min-height: 0; }
.aih-shadcn-tabs-vertical { align-items: stretch; }
.aih-shadcn-tabs-horizontal { width: 100%; }
.aih-shadcn-tabs-list { display: inline-flex; min-width: max-content; align-items: center; gap: .25rem; border-radius: var(--aih-shadcn-radius); background: var(--aih-shadcn-muted); padding: .25rem; }
.aih-shadcn-tabs-list-horizontal { max-width: none; }
.aih-shadcn-tabs-list-vertical { box-sizing: border-box; flex: 0 0 min(var(--aih-shadcn-tabs-vertical-list-width, 15rem), 42%); width: min(var(--aih-shadcn-tabs-vertical-list-width, 15rem), 42%); min-width: 0; max-width: 42%; flex-direction: column; align-items: stretch; align-self: flex-start; overflow: hidden; }
.aih-shadcn-tabs-list-fill { width: 100%; min-width: 0; }
.aih-shadcn-tabs-list-fill .aih-shadcn-tabs-trigger { flex: 1 1 0; justify-content: center; }
.aih-shadcn-tabs-trigger { display: inline-flex; flex: 0 0 auto; align-items: center; gap: .375rem; white-space: nowrap; border: 0; border-radius: calc(var(--aih-shadcn-radius) - 2px); background: transparent; color: var(--aih-shadcn-muted-foreground); padding: .375rem .75rem; font-size: .875rem; cursor: pointer; }
.aih-shadcn-tabs-list-vertical .aih-shadcn-tabs-trigger { width: 100%; min-width: 0; justify-content: flex-start; overflow: hidden; text-overflow: ellipsis; }
.aih-shadcn-tabs-list-vertical .aih-shadcn-tabs-trigger svg { flex: 0 0 auto; }
.aih-shadcn-tabs-trigger-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aih-shadcn-tabs-trigger[data-state="active"] { background: var(--aih-shadcn-background); color: var(--aih-shadcn-foreground); box-shadow: 0 1px 2px rgb(0 0 0 / .05); }
.aih-shadcn-tabs-content { flex: 1 1 auto; min-width: 0; min-height: 0; margin-top: .75rem; }
.aih-shadcn-tabs-vertical > .aih-shadcn-tabs-content { flex: 1 1 0; overflow: auto; margin-top: 0; }

.aih-shadcn-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.aih-shadcn-table th,
.aih-shadcn-table td { border-bottom: 1px solid var(--aih-shadcn-border); padding: .625rem .75rem; text-align: left; vertical-align: top; }
.aih-shadcn-table th { color: var(--aih-shadcn-muted-foreground); font-weight: 600; }

.aih-shadcn-nav { display: flex; width: min(var(--aih-shadcn-nav-width, 19.375rem), calc(100vw - 4rem)); min-width: min(var(--aih-shadcn-nav-width, 19.375rem), calc(100vw - 4rem)); max-width: min(var(--aih-shadcn-nav-width, 19.375rem), calc(100vw - 4rem)); flex: 0 0 min(var(--aih-shadcn-nav-width, 19.375rem), calc(100vw - 4rem)); flex-direction: column; gap: .25rem; }
.aih-shadcn-nav-header { display: flex; min-height: 3rem; align-items: center; justify-content: space-between; gap: .5rem; padding: .5rem .75rem; }
.aih-shadcn-nav-app-title { display: flex; min-width: 0; min-height: 2rem; flex: 1 1 auto; align-items: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 1.125rem; font-weight: 650; line-height: 2rem; color: var(--aih-shadcn-foreground); }
.aih-shadcn-nav-header-actions { display: inline-flex; min-height: 2rem; flex: 0 0 auto; align-items: center; gap: .125rem; }
.aih-shadcn-nav-list { display: flex; flex-direction: column; gap: .125rem; }
.aih-shadcn-nav-divider { height: 1px; background: var(--aih-shadcn-border); margin: .5rem 0; }
.aih-shadcn-nav-section-label { padding: .4375rem .75rem .3125rem; font-weight: 600; color: var(--aih-shadcn-foreground); }
.aih-shadcn-nav-row { position: relative; display: flex; align-items: center; min-width: 0; }
.aih-shadcn-nav-row-editing { padding: .125rem .25rem; }
.aih-shadcn-nav-button { width: 100%; min-width: 0; height: auto; justify-content: flex-start; gap: .75rem; padding: .375rem .75rem; line-height: 1.25rem; text-align: left; }
.aih-shadcn-nav-button svg { flex: 0 0 auto; }
.aih-shadcn-nav-label { min-width: 0; flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aih-shadcn-nav-action { position: absolute; right: .25rem; display: inline-flex; width: 1.75rem; height: 1.75rem; align-items: center; justify-content: center; border: 0; border-radius: calc(var(--aih-shadcn-radius) - 4px); background: transparent; color: var(--aih-shadcn-muted-foreground); opacity: 0; cursor: pointer; transition: opacity .15s ease, color .15s ease, background-color .15s ease; }
.aih-shadcn-nav-action:hover,
.aih-shadcn-nav-action[data-state="open"] { background: var(--aih-shadcn-accent); color: var(--aih-shadcn-accent-foreground); opacity: 1; }
.aih-shadcn-nav-action[data-pinned="true"],
.aih-shadcn-nav-row:hover .aih-shadcn-nav-action,
.aih-shadcn-nav-action:focus-visible { opacity: 1; }
.aih-shadcn-nav-edit-input { height: 2rem; }
.aih-shadcn-nav-category { display: flex; flex-direction: column; gap: 0; }
.aih-shadcn-nav-category > h3 { margin: 0; font: inherit; }
.aih-shadcn-nav-category-trigger { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: .75rem; border: 0; border-radius: calc(var(--aih-shadcn-radius) - 2px); background: transparent; color: var(--aih-shadcn-foreground); padding: .375rem .75rem; font: inherit; font-size: .875rem; font-weight: 500; line-height: 1.25rem; cursor: pointer; }
.aih-shadcn-nav-category-trigger:hover,
.aih-shadcn-nav-category-trigger[data-state="open"] { background: var(--aih-shadcn-accent); color: var(--aih-shadcn-accent-foreground); }
.aih-shadcn-nav-category-trigger:focus-visible { outline: 2px solid var(--aih-shadcn-ring); outline-offset: 2px; }
.aih-shadcn-nav-category-label { display: inline-flex; min-width: 0; align-items: center; gap: .75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aih-shadcn-nav-category-chevron { flex: 0 0 auto; color: var(--aih-shadcn-muted-foreground); transition: transform .15s ease; }
.aih-shadcn-nav-category-trigger[data-state="open"] .aih-shadcn-nav-category-chevron { transform: rotate(180deg); }
.aih-shadcn-nav-category-content { display: flex; height: var(--radix-accordion-content-height); flex-direction: column; gap: .0625rem; padding-left: 1rem; overflow: hidden; }
.aih-shadcn-nav-category-content[data-state="closed"] { height: 0; gap: 0; padding-left: 0; animation: aih-shadcn-accordion-up .15s ease-out; }
.aih-shadcn-nav-category-content[data-state="open"] { animation: aih-shadcn-accordion-down .15s ease-out; }
@keyframes aih-shadcn-accordion-down { from { height: 0; } to { height: var(--radix-accordion-content-height); } }
@keyframes aih-shadcn-accordion-up { from { height: var(--radix-accordion-content-height); } to { height: 0; } }

.aih-shadcn-progress { display: grid; width: 100%; gap: .375rem; }
.aih-shadcn-progress-root { position: relative; height: .5rem; overflow: hidden; border-radius: 999px; background: var(--aih-shadcn-secondary); width: 100%; }
.aih-shadcn-progress-indicator { height: 100%; background: var(--aih-shadcn-primary); transition: width .2s ease; }
.aih-shadcn-progress-indeterminate .aih-shadcn-progress-indicator { position: absolute; inset-block: 0; width: 42%; border-radius: inherit; background: linear-gradient(90deg, transparent, var(--aih-shadcn-primary), transparent); animation: aih-shadcn-progress-glow 1.25s ease-in-out infinite; }
@keyframes aih-shadcn-progress-glow { 0% { transform: translateX(-120%); opacity: .35; } 50% { opacity: 1; } 100% { transform: translateX(260%); opacity: .35; } }
.aih-shadcn-progress-label { color: var(--aih-shadcn-muted-foreground); font-size: .875rem; line-height: 1.25rem; }
.aih-shadcn-spinner { display: inline-block; border-radius: 999px; border: 2px solid var(--aih-shadcn-muted); border-top-color: var(--aih-shadcn-primary); animation: aih-shadcn-spin .8s linear infinite; }
@keyframes aih-shadcn-spin { to { transform: rotate(360deg); } }
.aih-shadcn-skeleton { display: inline-block; background: var(--aih-shadcn-muted); position: relative; overflow: hidden; }
.aih-shadcn-skeleton::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgb(255 255 255 / .25), transparent); animation: aih-shadcn-shimmer 1.5s infinite; }
@keyframes aih-shadcn-shimmer { to { transform: translateX(100%); } }

.aih-shadcn-chat { display: flex; flex-direction: column; gap: .75rem; width: min(100%, var(--aih-chat-content-max-width, 1056px)); max-width: var(--aih-chat-content-max-width, 1056px); margin-inline: auto; padding: .75rem; box-sizing: border-box; }
.aih-shadcn-chat-message { width: min(75%, 52rem); border: 1px solid var(--aih-shadcn-border); border-radius: var(--aih-shadcn-radius); background: var(--aih-shadcn-card); color: var(--aih-shadcn-card-foreground); overflow: hidden; }
.aih-shadcn-chat-message-user { align-self: flex-end; border-color: var(--aih-shadcn-chat-user-border); background: var(--aih-shadcn-chat-user); color: var(--aih-shadcn-chat-user-foreground); }
.aih-shadcn-chat-message-assistant { align-self: flex-start; border-color: var(--aih-shadcn-chat-assistant-border); background: var(--aih-shadcn-chat-assistant); color: var(--aih-shadcn-chat-assistant-foreground); }
.aih-shadcn-chat-message-activity { border-left: 4px solid var(--aih-shadcn-destructive); }
.aih-shadcn-chat-message-user .aih-shadcn-chat-header,
.aih-shadcn-chat-message-user .aih-shadcn-chat-footer { border-color: rgb(255 255 255 / .16); }
.aih-shadcn-chat-message-assistant .aih-shadcn-chat-header,
.aih-shadcn-chat-message-assistant .aih-shadcn-chat-footer { border-color: var(--aih-shadcn-chat-assistant-border); }
.aih-shadcn-chat-message-user .aih-shadcn-hint { color: color-mix(in srgb, var(--aih-shadcn-chat-user-foreground) 70%, transparent); }
.aih-shadcn-chat-header { display: flex; align-items: center; justify-content: flex-start; gap: .75rem; padding: .625rem .75rem; border-bottom: 1px solid var(--aih-shadcn-border); font-size: .8125rem; }
.aih-shadcn-chat-header-meta { display: inline-flex; align-items: center; gap: .5rem; min-width: 0; flex-wrap: wrap; }
.aih-shadcn-chat-header-icon { display: inline-flex; align-items: center; justify-content: center; margin-left: auto; color: currentColor; }
.aih-shadcn-chat-header-icon-activity svg { stroke-width: 2.5; }
.aih-shadcn-chat-body { padding: .75rem; }
.aih-shadcn-chat-footer { display: flex; align-items: center; min-height: 0; padding: .25rem .75rem; border-top: 1px solid var(--aih-shadcn-border); }
.aih-shadcn-chat-footer > div { height: auto !important; padding-top: 0 !important; align-items: center !important; }
.aih-shadcn-chat-footer .aih-shadcn-badge + .aih-shadcn-badge { margin-left: .25rem; }

@media (max-width: 767.98px) {
  .aih-shadcn-chat-message { width: 100%; }
}

.aih-shadcn-toast-viewport { position: fixed; right: 1rem; bottom: 1rem; z-index: var(--aih-shadcn-toast-z-index); display: flex; max-width: min(24rem, calc(100vw - 2rem)); flex-direction: column; gap: .5rem; margin: 0; padding: 0; list-style: none; }
.aih-shadcn-toast-root { border: 1px solid var(--aih-shadcn-border); border-radius: var(--aih-shadcn-radius); background: var(--aih-shadcn-popover); color: var(--aih-shadcn-popover-foreground); padding: .75rem; box-shadow: 0 10px 30px rgb(0 0 0 / .15); }
`;

