# Dependency patches

## timeago.js 4.3.0

Version 4.3.0 ships declarations but omits them from its package exports. TypeScript
with bundler resolution therefore reports missing declarations for the main API
and locale imports.

The [versioned patch](timeago.js+4.3.0.patch) adds types-first export conditions for
the root entry point and both existing wildcard entry points, referencing the
declarations already shipped with the library. No JavaScript, runtime export
targets, application imports, locale registrations, or public contracts change.

The [root install hook](../package.json) applies patches automatically with
patch-package and fails installation if a patch cannot be applied. Build/development
installs must include development dependencies and allow lifecycle scripts. After
an install with scripts disabled, run the root postinstall script before building.

Existing timeago.js dependency ranges are deliberately unchanged. The lockfile
currently selects 4.3.0; this patch does not prevent newer versions from being
selected by future dependency updates. When updating the lockfile, review any
patch-package version warnings and run the
[regression suite](../scripts/timeago-regression.test.cjs) with Node's test runner.
Remove this patch once an upstream release exposes all these declarations, after
verifying the regression suite and affected workspace builds. If a newer release
still needs a patch, regenerate it against that release instead of keeping a stale
versioned patch. Patch generation must explicitly include the package metadata,
which patch-package excludes by default (use its exclude option with a pattern
that matches nothing).
