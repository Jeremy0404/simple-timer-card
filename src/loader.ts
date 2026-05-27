/**
 * Tiny loader registered as the Lovelace resource. Dynamically imports the
 * real bundle with a cache-busting query so HA's service worker can't serve
 * a stale build.
 *
 * - Dev (`vite build --mode deploy`): version tag is `Date.now()` at runtime,
 *   so every browser refresh fetches the latest bundle automatically.
 * - Production (`vite build`): version tag is the package version baked at
 *   build time — stable per release, cached normally.
 *
 * The loader file itself rarely changes, so the resource URL stays stable
 * once the user registers it.
 */
declare const __BUNDLE_VERSION__: string;

const versionTag =
  __BUNDLE_VERSION__ === 'dev' ? Date.now().toString() : __BUNDLE_VERSION__;

const bundleUrl = new URL('./simple-timer-card.js', import.meta.url);
bundleUrl.searchParams.set('v', versionTag);

import(/* @vite-ignore */ bundleUrl.href).catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[simple-timer-card] loader: bundle failed to load', err);
});
