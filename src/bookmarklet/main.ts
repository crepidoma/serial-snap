// シリアルナンバーを応募サイトの入力欄へ入れるブックマークレット。
// 入力欄に値を入れるだけで、登録ボタンは押さない。応募サイトのAPIやストレージには触れず、外部とも通信しない。
// クリップボードは、このアプリのコピーに付けた目印があるときだけ自動で使う。
import { type CopyMarker, parseMarker, serialsFromText } from "../shared/marker.ts";
import { button, type Child, createPanel, h, icon, phrases } from "./panel.ts";
import { doneTitle, isMismatch, lengthIssues, MAX_FIELDS, pageArtist, remaining } from "./plan.ts";

/** アプリの画面に置いてある目印。ここで開いたら、追加できたことを知らせる。 */
const APP_META = 'meta[name="serial-snap"]';
/** アプリへ、ブックマークレットが動いたことを知らせるイベントの名前。 */
const INSTALLED_EVENT = "serial-snap:bookmarklet";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fields = () =>
  [...document.querySelectorAll('input[id^="inputSerial"]')].filter(
    (el): el is HTMLInputElement => el instanceof HTMLInputElement,
  );

const addButton = () =>
  [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("入力枠を追加"));

/**
 * 応募サイトは React で作られており、value を書き換えるだけでは画面の状態に反映されない。
 * 本来の setter で値を入れてから input イベントを送り、手で入力したのと同じ扱いにする。
 */
function setValue(el: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/** 入力欄へ入れる。足りなければサイトの「入力枠を追加」を押して増やし、余った欄は空にする。 */
async function fill(serials: string[]) {
  const take = serials.slice(0, MAX_FIELDS);
  for (let i = 0; i < MAX_FIELDS && fields().length < take.length; i++) {
    const add = addButton();
    if (!add) break;
    // 「入力枠を追加」はフォームを送信しない（応募サイトで確かめた）。欄が1つ増えるのを待つ
    add.click();
    await wait(80);
  }
  const inputs = fields();
  for (const [i, el] of inputs.entries()) {
    setValue(el, take[i] ?? "");
    // 入力のたびにサイトの画面が描き直されるのを待つ。続けて送ると前の値が消えることがある
    await wait(30);
  }
  return { count: Math.min(take.length, inputs.length), expected: inputs[0]?.maxLength ?? 0 };
}

/** 入力した件数の見出し。応募先の後ろで折り返せるようにする。 */
function titlePhrases(marker: CopyMarker | undefined, count: number) {
  const title = doneTitle(marker, count);
  const cut = marker?.artist ? marker.artist.length + 1 : 0;
  return cut > 0 ? phrases(title.slice(0, cut), title.slice(cut)) : phrases(title);
}

/** iPhone・iPad の Safari か。読み取りの確認の出方（「ペースト」）が違うため。 */
function isIos(): boolean {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1)
  );
}

/** クリップボードの、文字だけの内容とHTMLの本文。読めなければ undefined。 */
async function readClipboard(): Promise<{ text: string; html: string } | undefined> {
  try {
    const items = await navigator.clipboard.read();
    let text = "";
    let html = "";
    for (const item of items) {
      if (!text && item.types.includes("text/plain"))
        text = await (await item.getType("text/plain")).text();
      if (!html && item.types.includes("text/html")) {
        const raw = await (await item.getType("text/html")).text();
        // スクリプトは動かさず、本文の文字だけを取り出す
        html = new DOMParser().parseFromString(raw, "text/html").body.textContent ?? "";
      }
    }
    return { text, html };
  } catch {
    return undefined;
  }
}

(async () => {
  const panel = createPanel();

  if (document.querySelector(APP_META)) {
    window.dispatchEvent(new CustomEvent(INSTALLED_EVENT));
    panel.show(
      h("p", { class: "msg" }, icon("check", "ok"), phrases("追加完了。", "応募サイトで使えます")),
      button("閉じる", panel.close),
    );
    return;
  }

  if (fields().length === 0) {
    panel.show(
      h(
        "p",
        { class: "msg warn" },
        icon("warn"),
        phrases("シリアルナンバー登録の画面では", "ないようです"),
      ),
      h(
        "p",
        { class: "text" },
        phrases("「シリアルナンバー登録」の画面を開いてから、", "もう一度開いてください。"),
      ),
      button("閉じる", panel.close),
    );
    return;
  }

  const showDone = (
    marker: CopyMarker | undefined,
    serials: string[],
    count: number,
    expected: number,
  ) => {
    const issues = lengthIssues(serials.slice(0, count), expected);
    const rest = remaining(marker);
    const children: Child[] = [
      h("p", { class: "msg" }, icon("check", "ok"), titlePhrases(marker, count)),
      h(
        "p",
        { class: "text" },
        phrases("内容を確認してから、", "「シリアルナンバー登録」を押してください。"),
      ),
    ];
    if (issues.length > 0) {
      const which = issues.map((x) => `${x.index + 1}件目`).join("・");
      children.push(
        h(
          "div",
          { class: "notice warn" },
          icon("warn"),
          h(
            "div",
            { class: "stack" },
            h("b", {}, `${which}${issues.length === 1 ? "のみ" : "の"}文字数が違います`),
            ...issues.map((x) =>
              h("span", {}, h("span", { class: "serial" }, x.serial), `(${x.serial.length}文字)`),
            ),
            phrases(
              `このページの入力欄は${expected}文字です。`,
              "登録の前に、紙と見比べてください。",
            ),
          ),
        ),
      );
    }
    if (rest) {
      children.push(
        h(
          "div",
          { class: "row" },
          h("span", { class: "badge" }, `残り ${rest.count}件`),
          h("span", { class: "text" }, "一度に登録できるのは10件まで"),
        ),
        h(
          "ol",
          {},
          h("li", {}, "1. 確認して「シリアルナンバー登録」"),
          h("li", {}, `2. アプリで「${rest.next}件目をコピー」`),
          h("li", {}, "3. 再び、このブックマークレットを開く"),
        ),
      );
    }
    children.push(button("閉じる", panel.close));
    panel.show(...children);
  };

  const run = async (marker: CopyMarker | undefined, serials: string[]) => {
    const { count, expected } = await fill(serials);
    showDone(marker, serials, count, expected);
  };

  /** 応募先が違うときの確認。まだ入力していないことを伝え、入力するかを選んでもらう。 */
  const confirmMismatch = (marker: CopyMarker, serials: string[], page: string | undefined) => {
    panel.show(
      h("p", { class: "msg warn" }, icon("warn"), h("span", {}, "応募先が違う可能性があります")),
      h("p", { class: "text" }, "まだ入力していません。"),
      h(
        "dl",
        {},
        h("dt", {}, "開いているページ"),
        h("dd", {}, page ?? ""),
        h("dt", {}, "コピーしたシリアルナンバー"),
        h("dd", {}, marker.artist ?? ""),
      ),
      h(
        "div",
        { class: "stack" },
        button("入力しない", panel.close, true),
        button("このページに入力", () => void run(marker, serials)),
      ),
    );
  };

  /**
   * 開いたときの画面。「クリップボードから入力」のボタンと、手で貼り付ける入力欄を並べる。
   * クリップボードはボタンを押したときだけ読む（Safariは押した直後でないと読ませないため。
   * また、開いただけで読み取りの確認が出ると戸惑うため）。
   */
  const showStart = () => {
    const clipNote = h("p", { class: "warn-text", role: "status" });
    const fromClipboard = button(
      "クリップボードから入力",
      async () => {
        clipNote.replaceChildren();
        // 押した直後に読み取りを始める（ここより前に await を挟むと、Safariでは読めなくなる）
        const reading = readClipboard();
        fromClipboard.disabled = true;
        const clip = await reading;
        fromClipboard.disabled = false;
        if (!clip) {
          clipNote.replaceChildren(
            phrases(
              "クリップボードを読み取れませんでした。",
              "下の欄に貼り付けて「入力」を押してください。",
            ),
          );
          return;
        }
        // 目印のない内容（パスワードなど）は入力欄に入れない
        const marker = parseMarker(clip.html);
        const serials = serialsFromText(clip.text);
        if (!marker || serials.length === 0) {
          clipNote.replaceChildren(
            phrases(
              "アプリでコピーした",
              "シリアルナンバーが",
              "見つかりませんでした。",
              "アプリでコピーし直すか、",
              "下の欄に貼り付けて「入力」を押してください。",
            ),
          );
          return;
        }
        const page = pageArtist(location.pathname);
        if (isMismatch(marker, page)) {
          confirmMismatch(marker, serials, page);
          return;
        }
        await run(marker, serials);
      },
      true,
    );
    const area = h("textarea", {
      id: "manual",
      rows: "3",
      spellcheck: "false",
      autocapitalize: "characters",
    }) as HTMLTextAreaElement;
    const note = h("p", { class: "warn-text", role: "status" });
    panel.show(
      fromClipboard,
      h(
        "p",
        { class: "hint" },
        isIos()
          ? phrases("押したあとに出る", "「ペースト」を押します。")
          : phrases("初回は、", "クリップボードへのアクセスを", "「許可」します。"),
      ),
      clipNote,
      h("p", { class: "divider" }, "または"),
      h("div", {}, h("label", { for: "manual" }, "ここに貼り付け(1行に1件、10件まで)"), area),
      note,
      button("入力", () => {
        const serials = serialsFromText(area.value);
        if (serials.length === 0) {
          note.replaceChildren(
            phrases("シリアルナンバーが見つかりません。", "1行に1件ずつ貼り付けてください。"),
          );
          return;
        }
        void run(undefined, serials);
      }),
    );
  };

  showStart();
})();
