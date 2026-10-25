import { useSyncExternalStore } from "react";

/**
 * 画面。URLのハッシュ（`#/r/<id>` など）で切り替える。静的ホスティングでも再読み込みで迷わず、
 * Androidの戻るボタンでも前の画面に戻れるようにするため。
 */
export type Route =
  | { name: "top" }
  | { name: "scan" }
  | { name: "history" }
  | { name: "addBookmarklet" }
  | { name: "pasteGuide" }
  | { name: "howto" }
  | { name: "menu" }
  | { name: "about" }
  | { name: "results"; readingId: string };

function parse(hash: string): Route {
  const path = hash.replace(/^#/, "");
  if (path === "/scan") return { name: "scan" };
  if (path === "/history") return { name: "history" };
  if (path === "/bookmarklet") return { name: "addBookmarklet" };
  if (path === "/paste") return { name: "pasteGuide" };
  if (path === "/howto") return { name: "howto" };
  if (path === "/menu") return { name: "menu" };
  if (path === "/about") return { name: "about" };
  const m = /^\/r\/([\w-]+)$/.exec(path);
  if (m?.[1]) return { name: "results", readingId: m[1] };
  return { name: "top" };
}

function toHash(route: Route): string {
  switch (route.name) {
    case "top":
      return "#/";
    case "scan":
      return "#/scan";
    case "history":
      return "#/history";
    case "addBookmarklet":
      return "#/bookmarklet";
    case "pasteGuide":
      return "#/paste";
    case "howto":
      return "#/howto";
    case "menu":
      return "#/menu";
    case "about":
      return "#/about";
    case "results":
      return `#/r/${route.readingId}`;
  }
}

let current = parse(location.hash);
/** ひとつ前の画面。案内を終えたときに、開いた元の画面へ戻るために使う。 */
let previous: Route | undefined;
const listeners = new Set<() => void>();

function update() {
  previous = current;
  current = parse(location.hash);
  for (const l of listeners) l();
}
// 戻る・進むと、URLを直接書き換えたとき
window.addEventListener("hashchange", update);

/**
 * このアプリを開いてから、履歴を何画面進んだか。履歴の state に持つ。
 * 0 のときに履歴をひとつ戻ると、アプリの外（開く前のページ）へ出てしまう。
 */
function depthOf(state: unknown): number {
  const depth = (state as { depth?: unknown } | null)?.depth;
  return typeof depth === "number" ? depth : 0;
}

/** 今の画面。 */
export function useRoute(): Route {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}

/** このアプリの中で、ひとつ前にいた画面。アプリを開いたばかりなら undefined。 */
export function previousRoute(): Route | undefined {
  return previous;
}

/**
 * 画面を移る。
 * @param replace 履歴に残さない（読み取り中の画面から結果へ移るときなど、戻るで戻したくない場合）
 */
export function navigate(route: Route, { replace = false } = {}) {
  const hash = toHash(route);
  const depth = depthOf(history.state);
  // pushState・replaceState は hashchange を起こさないため、画面の切り替えはここで知らせる
  if (replace) history.replaceState({ depth }, "", hash);
  else history.pushState({ depth: depth + 1 }, "", hash);
  update();
}

/** 戻る先にしない画面。案内は、終えたあとに案内へ戻すと同じ案内を繰り返すため。スキャン中は終わった処理のため。 */
const NOT_BACK_TARGET = new Set<Route["name"]>(["addBookmarklet", "pasteGuide", "howto", "scan"]);

/**
 * 開いた元の画面へ戻る（案内・メニューを閉じるとき）。
 * ひとつ前の履歴がこのアプリの画面なら、履歴をひとつ戻る（同じ画面を履歴に重ねないため）。
 * ひとつ前がアプリの外（URLを直接開いたときなど）か、案内・スキャン中なら、トップに置き換える。
 */
export function goBack() {
  if (previous && !NOT_BACK_TARGET.has(previous.name) && depthOf(history.state) > 0) {
    history.back();
  } else {
    navigate({ name: "top" }, { replace: true });
  }
}
