import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@domain': path.resolve(rootDir, 'packages/shared-domain/src/index.ts'),
      '@i18n': path.resolve(rootDir, 'packages/shared-i18n/src/index.ts'),
      '@storage': path.resolve(rootDir, 'packages/shared-storage/src/index.ts'),
      '@runtime': path.resolve(rootDir, 'packages/shared-runtime/src/index.ts'),
      '@api': path.resolve(rootDir, 'packages/shared-api/src/index.ts'),
      '@auth': path.resolve(rootDir, 'packages/shared-auth/src/index.ts'),
      '@player': path.resolve(rootDir, 'packages/shared-player/src/index.ts'),
    },
  },
});
