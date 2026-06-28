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

const appName = process.env.APP_NAME || "YACB";
const chatbotInstructions = process.env.CHATBOT_INSTRUCTIONS || "";
const mcpCatalogUrls = parseList(process.env.MCP_CATALOG_URLS);
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
    "__APP_VERSION__": JSON.stringify(`${buildDateVersion}.chathappey`),
    "__APP_NAME__": JSON.stringify(appName),
    "__CHATBOT_INSTRUCTIONS__": JSON.stringify(chatbotInstructions),
    "__MCP_CATALOG_URLS__": JSON.stringify(mcpCatalogUrls),
    "__APPLICATIONINSIGHTS_CONNECTION_STRING__": JSON.stringify(appInsightsConnectionString),
  },
  loader: { ".tsx": "tsx", ".ts": "ts" },
};

function copyFfmpegAssets() {
  const publicDir = path.join(__dirname, "public");
  const ffmpegDir = path.join(publicDir, "ffmpeg");
  const rootDir = path.resolve(__dirname, "../..");

  fs.mkdirSync(ffmpegDir, { recursive: true });

  const copyFile = (from, to) => {
    if (fs.existsSync(from)) {
      fs.copyFileSync(from, to);
    } else {
      console.warn(`Missing optional ffmpeg smoke-test asset: ${from}`);
    }
  };

  const copyDir = (fromDir, toDir) => {
    fs.mkdirSync(toDir, { recursive: true });
    for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
      const from = path.join(fromDir, entry.name);
      const to = path.join(toDir, entry.name);
      if (entry.isDirectory()) copyDir(from, to);
      else copyFile(from, to);
    }
  };

  copyDir(path.join(rootDir, "node_modules", "@ffmpeg", "ffmpeg", "dist", "esm"), path.join(ffmpegDir, "ffmpeg"));
  copyDir(path.join(rootDir, "node_modules", "@ffmpeg", "core", "dist", "esm"), path.join(ffmpegDir, "core"));
}

copyFfmpegAssets();
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
