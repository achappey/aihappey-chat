import React, { useEffect, useRef, useState } from "react";
import { useDarkMode } from "usehooks-ts";

export type OpenAIAppWidgetProps = {
  resourceHtml: string;
  toolInput?: any;
  toolOutput?: any;
  meta?: any;
  onCallTool?: (toolName: string, args: any) => Promise<any>;
  sendFollowupTurn?: ({ prompt }: any) => Promise<void>;

};

const calcHeight = () => 250

export const OpenAIAppWidget: React.FC<OpenAIAppWidgetProps> = ({
  resourceHtml,
  toolInput,
  toolOutput,
  meta,
  sendFollowupTurn,
  onCallTool,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [iframeWidth, setIframeWidth] = useState("100%");
  const [displayMode, setDisplayMode] = useState("inline");
  const { isDarkMode } = useDarkMode();
  const maxHeight = displayMode === "inline" ? 250 : window.innerHeight;

  useEffect(() => {
    const iframe = iframeRef.current;
    const win = iframe?.contentWindow;
    if (!iframe || !win) return;

    const handleFullscreenChange = () => {
      // User pressed ESC or left fullscreen by other means
      const isFullscreen = !!document.fullscreenElement;

      let newMode = displayMode;
      // let newHeight = maxHeight;

      if (!isFullscreen && displayMode === "fullscreen") {
        // Browser left fullscreen → revert to inline layout
        newMode = "inline";
        // newHeight = calcHeight();
        setDisplayMode(newMode);
        //   setMaxHeight(newHeight);

        win.postMessage(
          {
            type: "openai:set_globals",
            globals: { displayMode: newMode, maxHeight: maxHeight },
          },
          "*"
        );
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [displayMode, maxHeight]);

  // 🧩 1. Handle responsive width
  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      // ✅ If screen wider than 800px → cap iframe at 700px centered
      //setIframeWidth(screenWidth > 1000 ? "900px" : "100%");
      setIframeWidth(screenWidth > 1000 ? "900px" : `${screenWidth - 100}px`);
    };
    handleResize(); // run once
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🧩 2. Load HTML once
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    iframe.srcdoc = resourceHtml;
    const handleLoad = () => setReady(true);
    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [resourceHtml]);

  // 🧠 3. Inject openai context
  useEffect(() => {
    if (!ready) return;
    const iframe = iframeRef.current;
    const win = iframe?.contentWindow;


    if (!win) return;

    (win as any).openai = {
      toolInput,
      toolOutput,
      toolResponseMetadata: meta,
      locale: meta?.["openai/locale"],
      maxHeight: maxHeight,
      theme: isDarkMode ? "dark" : "light",
      displayMode: displayMode,
      widgetState: {},
      requestDisplayMode: async ({ mode }: any) => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        setDisplayMode(mode);
        let newHeight = calcHeight();

        if (mode === "fullscreen" && iframe.requestFullscreen) {
          if (!document.fullscreenElement) {
            await iframe.requestFullscreen().catch(console.warn);
          }
          newHeight = window.innerHeight - 80;
        } else if (mode === "pip") {
          newHeight = window.innerHeight * 0.7;
        }

        //setMaxHeight(newHeight);

        (win as any).openai.displayMode = mode;
        (win as any).openai.maxHeight = newHeight;

        win.postMessage(
          {
            type: "openai:set_globals",
            globals: { displayMode: mode, maxHeight: newHeight, theme: isDarkMode ? "dark" : "light" },
          },
          "*"
        );
      },
      setWidgetState: (state: any) => {
        (win as any).openai.widgetState = state;
      },
      callTool: async (name: string, args: any) => {
        const result = await onCallTool?.(name, args);
        win.postMessage({ type: "tool_response", tool: { name, args, result } }, "*");
        return result;
      },
      sendFollowupTurn: (msg: any) => sendFollowupTurn && sendFollowupTurn(msg)
    };

    win.postMessage({ type: "toolOutput", payload: toolOutput }, "*");
    win.postMessage({ type: "toolInput", payload: toolInput }, "*");
    win.postMessage({
      type: "openai:set_globals",
      globals: { maxHeight: maxHeight, theme: isDarkMode ? "dark" : "light" },
    }, "*");

  }, [ready, toolInput, toolOutput, meta, onCallTool, isDarkMode]);

  // 🧩 4. Return iframe with responsive wrapper
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center", // center iframe when narrower
        width: "100%",
      }}
    >
      <iframe
        ref={iframeRef}
        style={{
          width: iframeWidth,
          //height: 500,
          height: maxHeight,
          overflow: "hidden",
          border: "none",
          //backgroundColor: darkMode.isDarkMode ? "#FFFFFF" : undefined,
          transition: "opacity 0.2s ease, width 0.3s ease",
          opacity: ready ? 1 : 0,
          borderRadius: 4,
        }}
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-popups allow-top-navigation allow-forms allow-popups-to-escape-sandbox allow-modals"
      />
    </div>
  );
};
