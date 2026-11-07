const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");
const { buildSync } = require("esbuild");

const root = path.resolve(__dirname, "..");
const locales = ["nl", "fr", "de", "es", "hu", "pl", "tr", "ru", "ja", "ro", "fi", "it", "vi", "th", "pt_BR", "da", "sv", "nb_NO"];
const expected = {
    nl: ["1 minuut geleden", "over 1 minuut"],
    fr: ["il y a 1 minute", "dans 1 minute"],
    de: ["vor 1 Minute", "in 1 Minute"],
    es: ["hace 1 minuto", "en 1 minuto"],
    hu: ["1 perce", "1 percen belül"],
    pl: ["1 minutę temu", "za 1 minutę"],
    tr: ["1 dakika önce", "1 dakika içinde"],
    ru: ["минуту назад", "через минуту"],
    ja: ["1分前", "1分後"],
    ro: ["acum un minut", "peste un minut"],
    fi: ["minuutti sitten", "minuutin päästä"],
    it: ["un minuto fa", "fra un minuto"],
    vi: ["1 phút trước", "trong 1 phút"],
    th: ["1 นาทีที่แล้ว", "ใน 1 นาที"],
    pt: ["há um minuto", "em um minuto"],
    da: ["for 1 minut siden", "om 1 minut"],
    sv: ["1 minut sedan", "om 1 minut"],
    nb: ["1 minutt siden", "om 1 minutt"],
};

test("timeago export patch adds declaration targets without changing runtime exports", () => {
    const metadata = JSON.parse(fs.readFileSync(path.join(root, "node_modules/timeago.js/package.json"), "utf8"));
    assert.deepEqual(metadata.exports, {
        ".": { types: "./dist/index.d.ts", import: "./dist/index.mjs", require: "./dist/index.cjs" },
        "./lib/*": { types: "./dist/*.d.ts", import: "./dist/esm/*.js", require: "./dist/lib/*.js" },
        "./esm/*": { types: "./dist/*.d.ts", import: "./dist/esm/*.js" },
    });
    for (const entry of Object.values(metadata.exports)) {
        assert.equal(Object.keys(entry)[0], "types", "TypeScript must see types before runtime conditions");
    }
});

test("strict bundler resolution retains real types for the main API and every locale", () => {
    // An in-memory entry keeps test artifacts out of the source tree while resolving
    // imports from this repository's actual installed dependency.
    const filename = path.join(__dirname, "timeago-typecheck.ts").replace(/\\/g, "/");
    const source = `
        import { format, register, render, cancel, type LocaleFunc } from "timeago.js";
        import { registerTimeagoLocales } from "../packages/aihappey-i18n/src/timeago";
        ${locales.map((locale, index) => `
            import locale${index} from "timeago.js/lib/lang/${locale}";
            import esmLocale${index} from "timeago.js/esm/lang/${locale}";
            register("${locale}", locale${index});
            const translated${index}: [string, string] = esmLocale${index}(1, 2);
            // @ts-expect-error Locale parameters must not become any.
            locale${index}("invalid", 2);
            // @ts-expect-error The ESM alias must also retain its real types.
            esmLocale${index}("invalid", 2);
        `).join("\n")}
        registerTimeagoLocales();
        const formatted: string = format(new Date(), "nl", { relativeDate: Date.now() });
        const custom: LocaleFunc = () => ["past", "future"];
        register("custom", custom);
        render(document.querySelectorAll("time"), "nl");
        cancel();
        // @ts-expect-error Invalid dates must still be rejected.
        format({ invalid: true });
        // @ts-expect-error Invalid locale callbacks must still be rejected.
        register("invalid", () => "not a tuple");
    `;
    const options = {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        strict: true,
        skipLibCheck: false,
        noEmit: true,
        types: [],
    };
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (name, languageVersion, onError, shouldCreateNewSourceFile) =>
        name === filename
            ? ts.createSourceFile(name, source, languageVersion, true)
            : getSourceFile(name, languageVersion, onError, shouldCreateNewSourceFile);
    const program = ts.createProgram([filename], options, host);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: name => name,
        getCurrentDirectory: () => root,
        getNewLine: () => "\n",
    }));
});

for (const platform of ["browser", "node"]) {
    test(`timeago ${platform} bundle preserves all locale registrations, aliases, and fallback`, () => {
        const result = buildSync({
            absWorkingDir: root,
            stdin: {
                contents: `
                    import { format } from "timeago.js";
                    import { registerTimeagoLocales } from "./packages/aihappey-i18n/src/timeago";
                    export { format, registerTimeagoLocales };
                `,
                resolveDir: root,
                sourcefile: "timeago-runtime-regression.ts",
                loader: "ts",
            },
            bundle: true,
            platform,
            format: "cjs",
            write: false,
        });
        const module = { exports: {} };
        new Function("module", "exports", result.outputFiles[0].text)(module, module.exports);
        const { format, registerTimeagoLocales } = module.exports;
        registerTimeagoLocales();
        registerTimeagoLocales(); // Repeated i18n initialization remains harmless.
        const now = Date.UTC(2026, 0, 1);
        const options = { relativeDate: now };
        for (const [locale, [past, future]] of Object.entries(expected)) {
            assert.equal(format(now - 60_000, locale, options), past, `${locale}: past`);
            assert.equal(format(now + 60_000, locale, options), future, `${locale}: future`);
        }
        for (const locale of [undefined, "en", "unknown-locale"]) {
            assert.equal(format(now - 60_000, locale, options), "1 minute ago");
            assert.equal(format(now + 60_000, locale, options), "in 1 minute");
        }
    });
}
