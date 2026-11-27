// The release version comes from package.json through Vite's `define` (vite.config.ts), so the
// title label cannot drift from the package again. tests/shell-version.test.ts checks both.
declare const __APP_VERSION__: string;

/** package.json version, e.g. '0.2.0'. */
export const APP_VERSION: string = __APP_VERSION__;

/** Major.minor for player-facing labels, e.g. '0.2'. */
export const RELEASE_LABEL: string = APP_VERSION.split('.').slice(0, 2).join('.');
