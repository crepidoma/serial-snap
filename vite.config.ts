import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { bookmarklet } from "./scripts/vite-bookmarklet.ts";
import { serviceWorker } from "./scripts/vite-sw.ts";

/**
 * ページを分離するヘッダー。文字認識を複数スレッドで動かすのに要る（SharedArrayBuffer を使うため）。
 * 公開先では public/_headers（Cloudflare Pages）で同じものを付ける。
 */
const ISOLATION_HEADERS = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

/** ビルドした日（日本時間）。「このアプリについて」に版として出す。 */
const BUILD_DATE = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})
  .format(new Date())
  .replaceAll("/", ".");

/** 静的サイトのビルド設定。GitHub Pagesのようにパスの途中に置かれても動くよう、相対パスで出力する。 */
export default defineConfig({
  base: "./",
  server: {
    headers: ISOLATION_HEADERS,
    // 実機で確かめるための Quick Tunnel（npm run tunnel）のURLから開けるようにする
    allowedHosts: [".trycloudflare.com"],
  },
  preview: { headers: ISOLATION_HEADERS, allowedHosts: [".trycloudflare.com"] },
  plugins: [react(), bookmarklet(), serviceWorker()],
  define: { __BUILD_DATE__: JSON.stringify(BUILD_DATE) },
  // 文字認識のWorkerは import で分割したファイルを読み込むため、ES Module として出力する
  worker: { format: "es" },
  resolve: {
    alias: {
      "styled-system": fileURLToPath(new URL("./styled-system", import.meta.url)),
    },
  },
  build: {
    // 小さなファイルも data: URL に埋め込まず、別ファイルにする。Workerは fetch で読み込むため、
    // data: URL だと CSP の connect-src 'self' に合わず、Service Worker のキャッシュにも入らない
    assetsInlineLimit: 0,
  },
});
