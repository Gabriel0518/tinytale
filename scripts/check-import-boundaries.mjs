import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.mjs']);
const ignoredSegments = new Set(['node_modules', '.next', 'dist', 'android', '.turbo', '.git']);

const projectRoots = {
  nativeShell: path.join(repoRoot, 'apps/native-shell'),
  webShell: path.join(repoRoot, 'apps/web'),
  packages: path.join(repoRoot, 'packages'),
  rootWeb: path.join(repoRoot, 'src'),
};

const importPatterns = [
  /\bimport\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g,
  /\bexport\s+(?:type\s+)?[^'"]*?\s+from\s+['"]([^'"]+)['"]/g,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
];

function shouldSkipDirectory(name) {
  return ignoredSegments.has(name);
}

function walkFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (shouldSkipDirectory(entry.name)) continue;
      files.push(...walkFiles(fullPath));
      continue;
    }

    if (!sourceExtensions.has(path.extname(entry.name))) continue;
    files.push(fullPath);
  }

  return files;
}

function collectImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];

  for (const pattern of importPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        imports.push(match[1]);
      }
    }
  }

  return imports;
}

function normalizePosix(input) {
  return input.split(path.sep).join('/');
}

function classifyImporter(filePath) {
  if (filePath.startsWith(projectRoots.nativeShell)) return 'native-shell';
  if (filePath.startsWith(projectRoots.webShell)) return 'web-shell';
  if (filePath.startsWith(projectRoots.packages)) return 'shared-package';
  if (filePath.startsWith(projectRoots.rootWeb)) return 'root-web';
  return 'other';
}

function isInside(targetPath, rootPath) {
  const relative = path.relative(rootPath, targetPath);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function resolveImportTarget(importerPath, specifier) {
  if (!specifier.startsWith('.')) return null;

  const importerDir = path.dirname(importerPath);
  const rawTarget = path.resolve(importerDir, specifier);
  const candidates = [
    rawTarget,
    `${rawTarget}.ts`,
    `${rawTarget}.tsx`,
    `${rawTarget}.js`,
    `${rawTarget}.mjs`,
    path.join(rawTarget, 'index.ts'),
    path.join(rawTarget, 'index.tsx'),
    path.join(rawTarget, 'index.js'),
    path.join(rawTarget, 'index.mjs'),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || rawTarget;
}

function evaluateImport(importerPath, specifier) {
  const importerType = classifyImporter(importerPath);
  const resolvedTarget = resolveImportTarget(importerPath, specifier);
  const normalizedSpecifier = normalizePosix(specifier);

  if (importerType === 'shared-package') {
    if (normalizedSpecifier.includes('/src/')) {
      return {
        ok: false,
        reason: 'Shared packages must not import from app source trees.',
      };
    }

    if (resolvedTarget && (isInside(resolvedTarget, projectRoots.nativeShell) || isInside(resolvedTarget, projectRoots.rootWeb))) {
      return {
        ok: false,
        reason: 'Shared packages must only depend on other shared packages or external modules.',
      };
    }
  }

  if (importerType === 'native-shell') {
    if (normalizedSpecifier.includes('/src/') && !normalizedSpecifier.startsWith('./') && !normalizedSpecifier.startsWith('../')) {
      return {
        ok: false,
        reason: 'Native shell must not import from the legacy root web app via direct src aliases.',
      };
    }

    if (resolvedTarget && (isInside(resolvedTarget, projectRoots.rootWeb) || isInside(resolvedTarget, projectRoots.webShell))) {
      return {
        ok: false,
        reason: 'Native shell must depend on packages only, not web app files.',
      };
    }
  }

  if (importerType === 'web-shell') {
    if (resolvedTarget && isInside(resolvedTarget, projectRoots.nativeShell)) {
      return {
        ok: false,
        reason: 'apps/web must not import from apps/native-shell.',
      };
    }
  }

  if (importerType === 'root-web') {
    if (resolvedTarget && isInside(resolvedTarget, projectRoots.nativeShell)) {
      return {
        ok: false,
        reason: 'Legacy root web app must not import from apps/native-shell.',
      };
    }
  }

  return { ok: true };
}

function run() {
  const scanRoots = [
    projectRoots.nativeShell,
    projectRoots.webShell,
    projectRoots.packages,
    projectRoots.rootWeb,
  ].filter((directory) => fs.existsSync(directory));

  const violations = [];

  for (const scanRoot of scanRoots) {
    for (const filePath of walkFiles(scanRoot)) {
      const imports = collectImports(filePath);
      for (const specifier of imports) {
        const result = evaluateImport(filePath, specifier);
        if (!result.ok) {
          violations.push({
            filePath,
            specifier,
            reason: result.reason,
          });
        }
      }
    }
  }

  if (violations.length === 0) {
    console.log('Import boundary check passed.');
    return;
  }

  console.error('Import boundary check failed:\n');
  for (const violation of violations) {
    const relativeFile = normalizePosix(path.relative(repoRoot, violation.filePath));
    console.error(`- ${relativeFile}`);
    console.error(`  import: ${violation.specifier}`);
    console.error(`  reason: ${violation.reason}`);
  }

  process.exitCode = 1;
}

run();
