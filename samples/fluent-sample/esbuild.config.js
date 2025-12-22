
// esbuild.config.js

const esbuild = require("esbuild");
const isWatch = process.argv.includes("--watch");

// Laad .env of .env.production afhankelijk van NODE_ENV
require("dotenv").config({
  path: `.env${process.env.NODE_ENV === "production" ? ".production" : ""}`
});

// --- Environment variabelen inlezen met fallbacks ---
function safeParseJSON(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

const defaultA2AUrlsEnv = process.env.DEFAULT_A2A_AGENT_LIST_URLS_JSON;

let defaultA2AUrls = safeParseJSON(defaultA2AUrlsEnv, ["http://localhost:3025/agents.json"]);

const chatApi = process.env.CHAT_API_URL || "http://localhost:3010/api/chat";
const appName = process.env.APP_NAME || "YACB";
const modelsApi = process.env.MODELS_API_URL || "http://localhost:3010/models";
const samplingApi = process.env.SAMPLING_API_URL || "http://localhost:3010/sampling";
const conversationsApi = process.env.CONVERSATIONS_API_URL || "http://localhost:3021/conversations";
const transcriptionApi = process.env.TRANSCRIPTION_API || "http://localhost:3010/transcription";

const chatAppMcp = process.env.CHAT_APP_MCP || "http://localhost:3001/chatapp";
const a2aAppMcp = process.env.A2A_APP_MCP || "http://localhost:3001/agent2agent";

// Deze kunnen JSON of string zijn, dus altijd even JSON.stringify voor define
const conversationScopes = safeParseJSON(process.env.CONVERSATIONS_SCOPES, []);
const msalClientId = process.env.MSAL_CLIENT_ID || "<client_id>";
const msalAuthority = process.env.MSAL_AUTHORITY || "https://login.microsoftonline.com/<tenant_id>";
const msalRedirectUri = process.env.MSAL_REDIRECT_URI || "/";
const msalScopes = safeParseJSON(process.env.MSAL_SCOPES, ["<scope>"]);

// --- App version/tag op buildtijd (YYYYMMDD.HHmm) ---
const now = new Date();
const pad = (n) => n.toString().padStart(2, "0");
const buildDateVersion =
  now.getFullYear().toString().slice(-2) +
  pad(now.getMonth() + 1) +
  pad(now.getDate()) + "." +
  pad(now.getHours()) +
  pad(now.getMinutes());
  
// --- Esbuild opties ---
const buildOptions = {
  entryPoints: ["src/main.tsx"],
  bundle: true,
  outfile: "public/bundle.js",
  sourcemap: true,
  minify: !isWatch, // Alleen minify bij production build
  define: {
    "process.env.NODE_ENV": isWatch ? '"development"' : '"production"',
    "__DEFAULT_A2A_AGENT_LIST_URLS__": JSON.stringify(defaultA2AUrls),
    "__CHAT_API__": JSON.stringify(chatApi),
    "__APP_VERSION__": JSON.stringify(`${buildDateVersion}.fluent`),
    "__MODELS_API__": JSON.stringify(modelsApi),
    "__APP_NAME__": JSON.stringify(appName),
    "__CHAT_APP_MCP__": JSON.stringify(chatAppMcp),
    "__A2A_APP_MCP__": JSON.stringify(a2aAppMcp),
    "__SAMPLING_API__": JSON.stringify(samplingApi),
    "__TRANSCRIPTION_API__": JSON.stringify(transcriptionApi),
    "__MSAL_CLIENT_ID__": JSON.stringify(msalClientId),
    "__CONVERSATIONS_API_URL__": JSON.stringify(conversationsApi),
    "__CONVERSATIONS_SCOPES__": JSON.stringify(conversationScopes),
    "__MSAL_AUTHORITY__": JSON.stringify(msalAuthority),
    "__MSAL_REDIRECT_URI__": JSON.stringify(msalRedirectUri),
    "__MSAL_SCOPES__": JSON.stringify(msalScopes),
  },
  loader: { ".tsx": "tsx", ".ts": "ts" },
};

// --- Build of watch ---
if (isWatch) {
  esbuild.context(buildOptions)
    .then(ctx => {
      ctx.watch();
      console.log("Watching for changes...");
    })
    .catch((err) => {
      console.error("Build failed:", err);
      process.exit(1);
    });
} else {
  esbuild.build(buildOptions)
    .then(() => {
      console.log("Build complete.");
    })
    .catch((err) => {
      console.error("Build failed:", err);
      process.exit(1);
    });
}
