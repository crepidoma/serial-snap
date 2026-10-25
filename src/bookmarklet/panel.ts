// 応募サイトの上に重ねるパネル。サイトのCSSの影響を受けないよう、Shadow DOM の中に作る。
// ブックマークレットは Panda CSS を使えないため、色などはアプリの panda.config.ts と同じ値をここに書く。

const HOST_ID = "serial-snap-panel";

const CSS = `
:host { all: initial; }
* { box-sizing: border-box; margin: 0; padding: 0; }
.panel {
  --bg: #FFFFFF; --sunken: #ECEEF0; --border: #D5D9DD; --strong: #7D858D; --fg: #16191C; --muted: #535B63;
  --accent: #1D5C42; --accent-fg: #FFFFFF; --accent-subtle: #E3EFE8; --accent-text: #1D5C42;
  --warn: #8A4B00; --warn-subtle: #FFF1D6; --warn-border: #D9952F; --hl: #D9480F;
  position: fixed; left: 8px; right: 8px; top: 8px; z-index: 2147483647;
  max-width: 480px; margin: 0 auto; max-height: calc(100vh - 16px); overflow: auto;
  background: var(--bg); color: var(--fg); border: 2px solid var(--fg); border-radius: 16px;
  box-shadow: 0 12px 36px rgba(16, 19, 22, .30);
  font: 16px/1.6 "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
  word-break: keep-all; overflow-wrap: anywhere;
}
@media (prefers-color-scheme: dark) {
  .panel {
    --bg: #1A1D20; --sunken: #24282C; --border: #363B41; --strong: #7D868F; --fg: #ECEFF2; --muted: #A9B1B9;
    --accent: #2A6F50; --accent-fg: #FFFFFF; --accent-subtle: #1E3A2D; --accent-text: #A3CDB6;
    --warn: #FFC670; --warn-subtle: #3A2A0C; --warn-border: #B07A22; --hl: #FFB25B;
    box-shadow: 0 12px 36px rgba(0, 0, 0, .6);
  }
}
.head { display: flex; align-items: center; gap: 8px; min-height: 48px; padding: 0 4px 0 12px; border-bottom: 1px solid var(--border); font-weight: 700; }
.head .title { flex: 1; }
.tag { font-size: 13px; line-height: 1.4; padding: 1px 8px; border: 1px solid var(--strong); border-radius: 999px; color: var(--muted); font-weight: 400; }
.body { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
.foot { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: var(--sunken); color: var(--muted); font-size: 13px; }
.msg { display: flex; gap: 10px; align-items: flex-start; font-weight: 700; line-height: 1.5; }
.msg.warn { color: var(--warn); }
.ok { color: var(--accent-text); }
svg { width: 24px; height: 24px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.foot svg { width: 16px; height: 16px; }
.text { font-size: 15px; }
.muted { color: var(--muted); }
.warn-text { color: var(--warn); font-size: 14px; }
.warn-text:empty { display: none; }
.hint { margin-top: -4px; color: var(--muted); font-size: 13px; text-align: center; }
.divider { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
.divider::before, .divider::after { content: ""; flex: 1; border-top: 1px solid var(--border); }
.btn:disabled { opacity: .6; cursor: default; }
.btn { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 10px 20px; width: 100%;
  border-radius: 10px; border: 1px solid var(--strong); background: var(--bg); color: var(--fg); font-family: inherit; font-size: 16px; font-weight: 700; line-height: 1.3; cursor: pointer; }
.btn.primary { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }
.icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0; background: none; color: var(--fg); cursor: pointer; border-radius: 10px; }
.notice { display: flex; gap: 10px; padding: 12px; border-radius: 10px; font-size: 14px; line-height: 1.6; }
.notice.warn { align-items: flex-start; background: var(--warn-subtle); border: 1px solid var(--warn-border); color: var(--warn); }
dl { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 12px; font-size: 14px; }
dt { color: var(--muted); }
dd { font-weight: 700; }
.badge { display: inline-flex; padding: 2px 10px; border-radius: 999px; font-size: 13px; font-weight: 700; background: var(--warn-subtle); color: var(--warn); box-shadow: inset 0 0 0 1px var(--warn-border); white-space: nowrap; }
.row { display: flex; align-items: center; gap: 8px; }
ol { list-style: none; display: flex; flex-direction: column; gap: 4px; font-size: 14px; }
.serial { font: 500 16px/1.4 ui-monospace, Menlo, Consolas, monospace; letter-spacing: .04em; }
label { display: block; font-size: 14px; font-weight: 700; margin-bottom: 6px; }
textarea { display: block; width: 100%; padding: 10px 12px; border: 2px solid var(--strong); border-radius: 10px; background: var(--bg); color: var(--fg);
  font: 500 17px/1.5 ui-monospace, Menlo, Consolas, monospace; resize: none; }
.stack { display: flex; flex-direction: column; gap: 8px; }
`;

/** 線で描くアイコン。アプリの Icon.tsx と同じ形。 */
const ICONS = {
  logo: [
    "M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
    "M9 5V3h6v2M9 11h6M9 15h6",
  ],
  close: ["M6 6l12 12M18 6 6 18"],
  check: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z", "m8 12 3 3 5-6"],
  warn: ["M12 4 3 20h18z", "M12 10v5M12 17.5v.5"],
  info: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z", "M12 11v5M12 7.5v.5"],
  lock: [
    "M7 11h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z",
    "M8 11V8a4 4 0 0 1 8 0v3",
  ],
} as const;

/** パネルに置く要素。文字は textContent で入れ、サイトのHTMLとして解釈させない。 */
export type Child = Node | string | false | null | undefined;

/** 要素を作る。`class` などの属性と、子の要素・文字を渡す。 */
export function h(
  tag: string,
  attrs: Record<string, string> = {},
  ...children: Child[]
): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const c of children) if (c) el.append(c);
  return el;
}

/**
 * 文の区切りでだけ折り返す文字。日本語は語の途中でも折り返されるため、区切りに <wbr> を入れ、
 * それ以外では折り返さない（.panel の word-break: keep-all と組み合わせる）。
 */
export function phrases(...parts: string[]): HTMLElement {
  const span = h("span");
  parts.forEach((p, i) => {
    if (i > 0) span.append(h("wbr"));
    span.append(p);
  });
  return span;
}

/** アイコン。 */
export function icon(name: keyof typeof ICONS, cls = ""): SVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  if (cls) svg.setAttribute("class", cls);
  for (const d of ICONS[name]) {
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  return svg;
}

/** ボタン。 */
export function button(label: string, onClick: () => void, primary = false): HTMLButtonElement {
  const b = h("button", { type: "button", class: primary ? "btn primary" : "btn" }, label);
  b.addEventListener("click", onClick);
  return b as HTMLButtonElement;
}

/** パネル。中身は `show` で入れ替える。前に開いたパネルがあれば閉じてから作る。 */
export function createPanel(): { show: (...children: Child[]) => void; close: () => void } {
  document.getElementById(HOST_ID)?.remove();
  const host = h("div", { id: HOST_ID });
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = CSS;
  const body = h("div", { class: "body", "aria-live": "polite" });
  const close = () => host.remove();
  const closeBtn = h(
    "button",
    { type: "button", class: "icon-btn", "aria-label": "閉じる" },
    icon("close"),
  );
  closeBtn.addEventListener("click", close);
  const panel = h(
    "section",
    { class: "panel", role: "dialog", "aria-label": "シリアルスナップ" },
    h(
      "header",
      { class: "head" },
      icon("logo", "ok"),
      h("span", { class: "title" }, "シリアルスナップ"),
      h("span", { class: "tag" }, "非公式"),
      closeBtn,
    ),
    body,
    h(
      "footer",
      { class: "foot" },
      icon("lock"),
      phrases("シリアルナンバーはこのページの入力欄のみに入れ、", "外へ送りません"),
    ),
  );
  root.append(style, panel);
  document.body.append(host);
  return {
    show: (...children) => body.replaceChildren(...children.filter((c): c is Node | string => !!c)),
    close,
  };
}
