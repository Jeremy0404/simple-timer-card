/**
 * Loader registered as the Lovelace resource. Dynamically imports the bundle
 * with a cache-buster query so HA's service worker can't serve a stale build.
 *
 * - Dev (`vite build --mode deploy`): buster is `Date.now()` at runtime → always fresh.
 * - Production (`vite build`): buster is the package version → stable per release.
 */
const versionTag =
  __BUNDLE_VERSION__ === 'dev' ? Date.now().toString() : __BUNDLE_VERSION__;

const bundleUrl = new URL('./simple-timer-card.js', import.meta.url);
bundleUrl.searchParams.set('v', versionTag);

import(/* @vite-ignore */ bundleUrl.href).catch((err) => {
  console.error('[simple-timer-card] loader: bundle failed to load', err);
});
