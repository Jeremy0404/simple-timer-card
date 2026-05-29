import { defineConfig, type Plugin, type LibraryFormats } from 'vite';
import { copyFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Kept separate from the HACS-managed `simple-timer-card/` folder so HACS's
// pre-gzipped assets don't shadow our fresh dev builds.
const DEPLOY_DEST = '//192.168.1.177/config/www/community/simple-timer-card-dev';
const BUNDLE_NAME = 'simple-timer-card.js';
const LOADER_NAME = 'simple-timer-card-loader.js';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8')) as { version: string };

function deployPlugin(): Plugin {
  return {
    name: 'deploy-to-ha',
    apply: 'build',
    async closeBundle() {
      await mkdir(DEPLOY_DEST, { recursive: true });
      for (const name of [BUNDLE_NAME, LOADER_NAME]) {
        await copyFile(resolve('dist', name), resolve(DEPLOY_DEST, name));
      }
      console.log(`[deploy] copied bundle + loader -> ${DEPLOY_DEST}`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const isDevDeploy = mode === 'deploy';
  const formats: LibraryFormats[] = ['es'];
  return {
    define: {
      __BUNDLE_VERSION__: JSON.stringify(isDevDeploy ? 'dev' : pkg.version),
      // Dev builds register under <simple-timer-card-dev> so they coexist with
      // a HACS-installed production build on the same dashboard.
      __CARD_NAME_SUFFIX__: JSON.stringify(isDevDeploy ? '-dev' : ''),
    },
    build: {
      lib: {
        entry: {
          'simple-timer-card': 'src/simple-timer-card.ts',
          'simple-timer-card-loader': 'src/loader.ts',
        },
        formats,
        fileName: (_format: string, entryName: string) => `${entryName}.js`,
      },
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: true,
      emptyOutDir: true,
    },
    plugins: mode === 'deploy' ? [deployPlugin()] : [],
  };
});
