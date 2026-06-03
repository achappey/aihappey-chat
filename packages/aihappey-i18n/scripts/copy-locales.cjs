const fs = require("fs");
const path = require("path");

const sourceLocalesDir = path.resolve(__dirname, "..", "src", "locales");

function copyJsonFile(sourceFile, targetFile) {
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.copyFileSync(sourceFile, targetFile);
}

function getNamespaceFileName(language, fileName) {
  return fileName === `${language}.json` ? "common.json" : fileName;
}

function copyI18nLocalesToPublic(publicDir = path.resolve(process.cwd(), "public")) {
  const targetLocalesDir = path.resolve(publicDir, "locales");

  fs.rmSync(targetLocalesDir, { recursive: true, force: true });
  fs.mkdirSync(targetLocalesDir, { recursive: true });

  for (const languageEntry of fs.readdirSync(sourceLocalesDir, { withFileTypes: true })) {
    if (!languageEntry.isDirectory()) continue;

    const language = languageEntry.name;
    const sourceLanguageDir = path.join(sourceLocalesDir, language);
    const targetLanguageDir = path.join(targetLocalesDir, language);

    for (const namespaceEntry of fs.readdirSync(sourceLanguageDir, { withFileTypes: true })) {
      if (!namespaceEntry.isFile() || path.extname(namespaceEntry.name) !== ".json") continue;

      const namespaceFileName = getNamespaceFileName(language, namespaceEntry.name);
      copyJsonFile(
        path.join(sourceLanguageDir, namespaceEntry.name),
        path.join(targetLanguageDir, namespaceFileName)
      );
    }
  }

  return targetLocalesDir;
}

if (require.main === module) {
  const publicDir = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
  const targetLocalesDir = copyI18nLocalesToPublic(publicDir);
  console.log(`Copied i18n locales to ${targetLocalesDir}`);
}

module.exports = { copyI18nLocalesToPublic };
