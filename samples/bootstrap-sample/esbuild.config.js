

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


const chatApi         = process.env.CHAT_API_URL            || "http://localhost:3010/api/chat";
const appName         = process.env.APP_NAME                || "YACB";
const modelsApi       = process.env.MODELS_API_URL          || "http://localhost:3010/models";
const samplingApi     = process.env.SAMPLING_API_URL        || "http://localhost:3010/sampling";
const conversationsApi= process.env.CONVERSATIONS_API_URL   || "http://localhost:3021/conversations";

// Deze kunnen JSON of string zijn, dus altijd even JSON.stringify voor define
const conversationScopes = safeParseJSON(process.env.CONVERSATIONS_SCOPES, []);
const msalClientId   = process.env.MSAL_CLIENT_ID           || "<client_id>";
const msalAuthority  = process.env.MSAL_AUTHORITY           || "https://login.microsoftonline.com/<tenant_id>";
const msalRedirectUri= process.env.MSAL_REDIRECT_URI        || "/";
const msalScopes     = safeParseJSON(process.env.MSAL_SCOPES, ["<scope>"]);

// --- App version/tag op buildtijd (YYYYMMDD.HHmm) ---
const now = new Date();
const pad = (n) => n.toString().padStart(2, "0");
const buildDateVersion =
  now.getFullYear().toString() +
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
    "__CHAT_API__": JSON.stringify(chatApi),
    "__APP_VERSION__": JSON.stringify(`${buildDateVersion}.fluent`),
    "__MODELS_API__": JSON.stringify(modelsApi),
    "__APP_NAME__": JSON.stringify(appName),
    "__SAMPLING_API__": JSON.stringify(samplingApi),
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