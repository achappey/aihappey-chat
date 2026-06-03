const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.cwd();
const allowCycles = process.argv.includes("--allow-cycles");

const workspaceRoots = [
  path.join(root, "packages"),
  path.join(root, "samples"),
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function getWorkspacePackageDirs() {
  const dirs = [];

  for (const workspaceRoot of workspaceRoots) {
    if (!fs.existsSync(workspaceRoot)) continue;

    for (const name of fs.readdirSync(workspaceRoot)) {
      const dir = path.join(workspaceRoot, name);
      const pkg = path.join(dir, "package.json");

      if (fs.existsSync(pkg)) {
        dirs.push(dir);
      }
    }
  }

  return dirs;
}

const packages = new Map();

for (const dir of getWorkspacePackageDirs()) {
  const pkg = readJson(path.join(dir, "package.json"));

  packages.set(pkg.name, {
    name: pkg.name,
    dir,
    pkg,
    deps: new Set(),
  });
}

for (const item of packages.values()) {
  const allDeps = {
    ...(item.pkg.dependencies ?? {}),
    ...(item.pkg.devDependencies ?? {}),
  };

  for (const depName of Object.keys(allDeps)) {
    if (packages.has(depName)) {
      item.deps.add(depName);
    }
  }
}

const sorted = [];
const visited = new Set();
const visiting = new Set();
const stack = [];

function visit(name) {
  if (visited.has(name)) return;

  if (visiting.has(name)) {
    const cycleStart = stack.indexOf(name);
    const cycle = [...stack.slice(cycleStart), name];

    const message = `Circular workspace dependency detected:\n\n  ${cycle.join(" -> ")}\n`;

    if (!allowCycles) {
      throw new Error(message);
    }

    console.warn(`\nWARNING: ${message}`);
    console.warn(`Skipping circular edge back to ${name} so build can continue.\n`);
    return;
  }

  visiting.add(name);
  stack.push(name);

  const item = packages.get(name);

  for (const depName of item.deps) {
    visit(depName);
  }

  stack.pop();
  visiting.delete(name);
  visited.add(name);
  sorted.push(item);
}

for (const name of packages.keys()) {
  visit(name);
}

console.log("\nBuild order:");
for (const item of sorted) {
  if (item.pkg.scripts?.build) {
    console.log(`- ${item.name}`);
  }
}

for (const item of sorted) {
  const hasBuild = item.pkg.scripts && item.pkg.scripts.build;
  if (!hasBuild) continue;

  console.log(`\n\n=== Building ${item.name} ===`);

  const result = spawnSync(
    "npm",
    ["run", "build", "--workspace", item.name],
    {
      stdio: "inherit",
      shell: true,
    }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}