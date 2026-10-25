import { useSyncExternalStore } from "react";

/** ブックマークレットを追加できたかの記録。アプリの画面で動いたか、案内で「追加済み」を押したら付ける。 */
const KEY = "serial-snap:bookmarklet";
/** ブックマークレットがアプリの画面で開かれたときに送るイベント（src/bookmarklet/main.ts）。 */
const INSTALLED_EVENT = "serial-snap:bookmarklet";

const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

let installed = read();

/** ブックマークレットを追加できたことを記録する。 */
export function markBookmarkletInstalled() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    // 記録できなくても、次に開いたときに案内がもう一度出るだけ
  }
  installed = true;
  for (const l of listeners) l();
}

window.addEventListener(INSTALLED_EVENT, markBookmarkletInstalled);

/** ブックマークレットを追加済みか。 */
export function useBookmarkletInstalled(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => installed,
  );
}
