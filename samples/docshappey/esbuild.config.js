// esbuild.config.js
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const { copyI18nLocalesToPublic } = require("../../packages/aihappey-i18n/scripts/copy-locales.cjs");
const isWatch = process.argv.includes("--watch");

// Laad .env of .env.production afhankelijk van NODE_ENV
require("dotenv").config({
  path: `.env${process.env.NODE_ENV === "production" ? ".production" : ""}`
});

// --- Environment variabelen inlezen met fallbacks ---
function safeParseJSON(str, fallback) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function parseList(str) {
  const parsed = safeParseJSON(str, undefined);
  if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
  return String(str ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const agentEndpoint = process.env.AGENT_ENDPOINT || "http://localhost:3036";
const appName = process.env.APP_NAME || "YACB";
const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3010";
const appInsightsConnectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || "";

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
  sourcemap: false,
  minify: !isWatch, // Alleen minify bij production build
  define: {
    "process.env.NODE_ENV": isWatch ? '"development"' : '"production"',
    "__AGENT_ENDPOINT__": JSON.stringify(agentEndpoint),
    "__APP_VERSION__": JSON.stringify(`${buildDateVersion}.docshappey`),
    "__APP_NAME__": JSON.stringify(appName),
    "__API_BASE_URL__": JSON.stringify(apiBaseUrl),
    "__APPLICATIONINSIGHTS_CONNECTION_STRING__": JSON.stringify(appInsightsConnectionString),
  },
  loader: { ".tsx": "tsx", ".ts": "ts" },
};

copyI18nLocalesToPublic(path.join(__dirname, "public"));

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
