import "./index.css";
// シリアルの書体（IBM Plex Mono の Latin の版。このサイトから配る）
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
// ブックマークレットがこの画面で開かれたら追加済みと記録するため、起動時に知らせの受け取りを始める
import "./lib/bookmarklet.ts";
import { ocr } from "./lib/ocr.ts";
import { startServiceWorker } from "./lib/sw.ts";
import { initTheme } from "./lib/theme.ts";

// 描画の前にテーマを決め、明るい画面が一瞬出るのを防ぐ
initTheme();

const root = document.getElementById("root");
if (!root) throw new Error("#root が見つかりません");

// 写真を選ぶ前に文字認識のデータ（初回は約31MB）を取得し始め、待ち時間を減らす。
// 取得したデータを端末に保存して通信なしでも使えるよう、Service Worker が制御を始めてから取得する
void startServiceWorker().then(() => ocr.warmup());

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
