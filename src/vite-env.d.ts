/** Injected by Vite's `define` at build time. */
declare const __BUNDLE_VERSION__: string;

interface Window {
  customCards?: Array<{
    type: string;
    name: string;
    description?: string;
    preview?: boolean;
    documentationURL?: string;
  }>;
}
