import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const capacitorConfigPath = path.join(repoRoot, 'apps/native-shell/capacitor.config.ts');
const androidManifestPath = path.join(repoRoot, 'apps/native-shell/android/app/src/main/AndroidManifest.xml');
const deepLinksPath = path.join(repoRoot, 'apps/native-shell/src/router/deep-links.ts');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const capacitorConfig = readFile(capacitorConfigPath);
  const androidManifest = readFile(androidManifestPath);
  const deepLinksSource = readFile(deepLinksPath);

  assert(
    capacitorConfig.includes("const serverUrl = process.env.CAP_SERVER_URL?.trim();"),
    'Native capacitor config must derive server.url from CAP_SERVER_URL only.'
  );
  assert(
    capacitorConfig.includes('...(resolvedServerUrl'),
    'Native capacitor config must gate server.url behind resolvedServerUrl.'
  );
  assert(
    capacitorConfig.includes("webDir: 'dist'"),
    'Native capacitor config must ship from apps/native-shell/dist.'
  );

  assert(
    androidManifest.includes('android:autoVerify="true"'),
    'AndroidManifest must keep autoVerify enabled for app links.'
  );
  assert(
    androidManifest.includes('android:host="tinytale.top"') &&
      androidManifest.includes('android:host="www.tinytale.top"'),
    'AndroidManifest must include both tinytale.top and www.tinytale.top hosts.'
  );
  assert(
    androidManifest.includes('android:scheme="top.tinytale.app"'),
    'AndroidManifest must include the top.tinytale.app custom scheme.'
  );

  assert(
    deepLinksSource.includes('^\\/drama\\/([^/]+)\\/play\\/([^/]+)$'),
    'Deep-link router must remap /drama/:id/play/:episodeId into native /play routes.'
  );
  assert(
    deepLinksSource.includes("'/about'") &&
      deepLinksSource.includes("'/privacy'") &&
      deepLinksSource.includes("'/help'"),
    'Deep-link router must preserve web-only fallback paths.'
  );
  assert(
    deepLinksSource.includes('data.route') && deepLinksSource.includes('notificationRecord.route'),
    'Push route resolver must support route fields from push payloads.'
  );
  assert(
    deepLinksSource.includes("return isKnownNativePath(pathname) ? normalized : '/'"),
    'Unknown native routes must safely fall back to /.'
  );

  console.log('Native release config check passed.');
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
