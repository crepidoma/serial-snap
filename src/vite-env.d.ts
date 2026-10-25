/// <reference types="vite/client" />

/** ブックマークレットのURL（`javascript:…`）。scripts/vite-bookmarklet.ts がビルドのときに作る。 */
declare module "virtual:bookmarklet" {
  export const href: string;
}

/** ビルドした日（「2026.10.25」の形）。「このアプリについて」に版として出す。vite.config.ts で埋め込む。 */
declare const __BUILD_DATE__: string;
