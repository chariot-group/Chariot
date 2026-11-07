/**
 * Current application version — driven by NEXT_PUBLIC_APP_VERSION (same variable shown in the sidebar footer).
 * Bump that env var alongside package.json on each release; no code change needed here.
 * Kept apart from `versions.ts` so the layout does not ship every release note (FR-web-first-load-performance).
 */
export const CURRENT_APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';
