import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'assets');
const publicDir = path.join(assetsDir, 'public');
const capacitorConfigPath = path.join(assetsDir, 'capacitor.config.json');

async function ensureDir(target) {
  await fs.mkdir(target, { recursive: true });
}

async function removeDir(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function copyDir(source, target) {
  await ensureDir(target);
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
    } else {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

async function main() {
  await fs.access(distDir);
  await ensureDir(assetsDir);
  await removeDir(publicDir);
  await copyDir(distDir, publicDir);

  const capacitorConfig = {
    appId: 'top.tinytale.shell',
    appName: 'TinyTale Shell',
    webDir: 'dist',
  };

  await fs.writeFile(capacitorConfigPath, `${JSON.stringify(capacitorConfig, null, 2)}\n`);
  console.log(`Synced ${distDir} -> ${publicDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
