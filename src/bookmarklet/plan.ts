// ブックマークレットの判定。画面に触れない部分を分け、テストできるようにする。
import type { CopyMarker } from "../shared/marker.ts";

/** 応募サイトが一度に受け付けるシリアルナンバーの数（入力欄は10個まで増やせる）。 */
export const MAX_FIELDS = 10;

/** 応募サイトのURLのアーティスト部分（`/nogizaka46/42nd` の `nogizaka46`）。 */
export function pageArtist(pathname: string): string | undefined {
  return pathname.split("/").filter(Boolean)[0];
}

/** コピーした応募先と、開いているページの応募先が違うか。どちらかが分からなければ違うとはしない。 */
export function isMismatch(marker: CopyMarker | undefined, page: string | undefined): boolean {
  return !!marker?.artist && !!page && marker.artist !== page;
}

/** 入力欄の文字数と違うシリアルナンバー。`index` は入れた中での順番（0から）。 */
export function lengthIssues(
  serials: string[],
  expected: number,
): { index: number; serial: string }[] {
  if (!(expected > 0)) return [];
  return serials.flatMap((serial, index) =>
    serial.length === expected ? [] : [{ index, serial }],
  );
}

/** まだコピーしていない残りの件数と、次にコピーする範囲（例: `11〜14`）。残りがなければ undefined。 */
export function remaining(
  marker: CopyMarker | undefined,
): { count: number; next: string } | undefined {
  if (!marker || marker.to >= marker.total) return undefined;
  const from = marker.to + 1;
  const to = Math.min(marker.total, marker.to + MAX_FIELDS);
  return { count: marker.total - marker.to, next: from === to ? `${from}` : `${from}〜${to}` };
}

/** 入力した件数の見出し（例: `nogizaka46の1〜10件目を入力しました`）。 */
export function doneTitle(marker: CopyMarker | undefined, count: number): string {
  if (!marker) return `${count}件を入力しました`;
  const range = marker.from === marker.to ? `${marker.from}` : `${marker.from}〜${marker.to}`;
  return `${marker.artist ? `${marker.artist}の` : ""}${range}件目を入力しました`;
}
