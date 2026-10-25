import { useSyncExternalStore } from "react";

/** テーマの設定。`system` は端末の設定（ダークモード）に合わせる。 */
export type ThemeSetting = "system" | "light" | "dark";

const STORAGE_KEY = "serial-snap:theme";
const media = window.matchMedia("(prefers-color-scheme: dark)");
/** ブラウザの上部（iPhoneの時計のあたり）の色。ヘッダーの地の色と揃える。 */
const THEME_COLOR = { light: "#FFFFFF", dark: "#1A1D20" } as const;

const listeners = new Set<() => void>();

function readSetting(): ThemeSetting {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // プライベートブラウズなどで読めない場合は、端末に合わせる
  }
  return "system";
}

let setting = readSetting();

/** 設定を、実際に使う明るい・暗いに解決して <html> と theme-color に反映する。 */
function apply() {
  const resolved = setting === "system" ? (media.matches ? "dark" : "light") : setting;
  document.documentElement.dataset.theme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[resolved]);
}

/** 起動時に一度だけ呼ぶ。端末の設定が変わったときも追従する。 */
export function initTheme() {
  apply();
  media.addEventListener("change", apply);
}

/** テーマの設定を変える。 */
export function setThemeSetting(next: ThemeSetting) {
  setting = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // 保存できなくても、開いている間は反映する
  }
  apply();
  for (const l of listeners) l();
}

/** 今のテーマの設定。 */
export function useThemeSetting(): ThemeSetting {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => setting,
  );
}
