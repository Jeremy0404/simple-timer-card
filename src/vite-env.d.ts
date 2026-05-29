/** Injected by Vite's `define` at build time. */
declare const __BUNDLE_VERSION__: string;
/** "-dev" in dev builds, "" in production. Suffixes the custom-element tag so dev can coexist with HACS-installed prod. */
declare const __CARD_NAME_SUFFIX__: string;

interface Window {
  customCards?: Array<{
    type: string;
    name: string;
    description?: string;
    preview?: boolean;
    documentationURL?: string;
  }>;
}
