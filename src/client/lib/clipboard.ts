import { type CopyMarker, markerHtml } from "../../shared/marker.ts";

/** 選択してコピーする古い方法。Clipboard API が使えない環境（HTTPで開いたときなど）のため。 */
function copyBySelection(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.append(ta);
  ta.select();
  const ok = document.execCommand("copy");
  ta.remove();
  return ok;
}

/** 文字列をクリップボードへコピーする。 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return copyBySelection(text);
  }
}

/**
 * シリアルナンバーをコピーする。文字だけの内容は1行に1件で、手で貼り付けてもそのまま使える。
 * HTMLの内容には目印（応募先と何件目か）を入れ、ブックマークレットがこのアプリのコピーだと分かるようにする。
 * HTMLを書けない環境では、文字だけをコピーする（ブックマークレットは手で貼り付ける欄を出す）。
 */
export async function copySerials(serials: string[], marker: CopyMarker): Promise<boolean> {
  const text = serials.join("\n");
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
        "text/html": new Blob([markerHtml(marker, serials)], { type: "text/html" }),
      }),
    ]);
    return true;
  } catch {
    return copyText(text);
  }
}
