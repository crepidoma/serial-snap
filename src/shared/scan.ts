/**
 * 応募先をどこから決めたか。
 * `paper` はシリアルと同じ紙のQRコードかURL、`photo` は写真の中の応募先が1種類だけだったので推定、
 * `none` は決められなかった（応募先不明）。
 */
export type ArtistSource = "paper" | "photo" | "none";

/** RGBAの画素列。ImageData と同じ形で、Workerとの受け渡しに使う。 */
export interface Pixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** 写真から読み取ったシリアル1件。 */
export interface ScannedSerial {
  serial: string;
  /** 文字認識の確信度（0〜1、文字ごとの平均） */
  conf: number;
  /** 最も自信の低い1文字の確信度。1文字だけの読み違いに気付くために使う */
  minCharConf: number;
  /** 応募サイトのURLのアーティスト部分（例: `nogizaka46`）。分からなければ undefined */
  artist?: string;
  artistSource: ArtistSource;
  /** 写真のシリアル部分の切り抜き（JPEG） */
  thumb: Blob;
}

/**
 * シリアルナンバーが見つからなかった写真の、写真の具合からみた理由の見当。
 * `dark` は暗い、`blurry` はぼやけている。
 */
export type PhotoIssue = "dark" | "blurry";

/** 写真1枚の読み取り結果。 */
export interface ScanResult {
  serials: ScannedSerial[];
  /** 1件も見つからなかったときだけ、写真の具合から理由の見当を付ける */
  issue?: PhotoIssue;
  /**
   * 写真の小さな見本（JPEG）。見つからなかった写真を「何枚目」だけでなく絵で示すために使う。
   * 次のスキャンを始めるまでメモリに置き、端末には保存しない
   */
  preview: Blob;
}

/** Workerが返すシリアル1件。切り抜きは画素のまま返し、画面側で画像にする。 */
export type WorkerSerial = Omit<ScannedSerial, "thumb"> & { thumb: Pixels };

/**
 * 写真1枚の読み取りの段階と進み具合。
 * `prepare` は写真の読み込みと縮小（画面側）、`detect` は文字の行の検出（途中経過は取れない）、
 * `large`・`rest` は文字の認識（大きい行・残りの行）、`finish` はQRコードを読んで応募先を決める段階。
 * `found` はそれまでに読んだ行のうち、シリアルらしい行の数（最後に確定する件数と少しずれることがある）。
 */
export interface ScanProgress {
  stage: "prepare" | "detect" | "large" | "rest" | "finish";
  done: number;
  total: number;
  found: number;
}

/**
 * 画面からWorkerへの依頼。
 * 写真のデコードは画面側で行い、画素だけを渡す（Workerで画像を扱う OffscreenCanvas が使えないブラウザがあるため）。
 * `small` は文字の検出用に縮めた写真。
 */
export type WorkerRequest =
  | { type: "warmup" }
  | { type: "scan"; id: number; full: Pixels; small: Pixels };

/** Workerから画面への知らせ。 */
export type WorkerResponse =
  | { type: "loading"; progress: number }
  | { type: "ready" }
  | ({ type: "progress"; id: number } & ScanProgress)
  | { type: "result"; id: number; serials: WorkerSerial[]; issue?: PhotoIssue }
  | { type: "error"; id: number; message: string };

/** 応募サイトのURL。紙に印刷されたものと同じ形にする。 */
export function applyUrl(artist: string): string {
  return `https://ticket.fortunemeets.app/${artist}/`;
}

/** 2つの文字列の似ている度合い（0〜1）。レーベンシュタイン距離を長い方の長さで割る。 */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    prev = cur;
  }
  return 1 - (prev[b.length] ?? 0) / Math.max(a.length, b.length);
}

/** アーティストが同じとみなす似ている度合い。URLの1〜2文字の読み違い（`nogi-aka46` など）を吸収する。 */
const SAME_ARTIST_SIMILARITY = 0.8;

/** 2つのアーティストが同じか。URLの読み違いを吸収して比べる。 */
export function isSameArtist(a: string, b: string): boolean {
  return similarity(a, b) >= SAME_ARTIST_SIMILARITY;
}

/**
 * 読み取ったアーティストを、似ているものどうしでまとめ、それぞれを最も多く読まれた表記に置き換える表を作る。
 * 重なった紙ではURLを読み違えることがあるため、多数決で正しい表記に寄せる。
 */
export function canonicalArtists(artists: string[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const a of artists) counts.set(a, (counts.get(a) ?? 0) + 1);
  // 多く読まれた表記から順に代表にする
  const ordered = [...counts.entries()].sort((x, y) => y[1] - x[1]).map(([a]) => a);
  const result = new Map<string, string>();
  const representatives: string[] = [];
  for (const a of ordered) {
    const rep = representatives.find((r) => isSameArtist(r, a));
    if (rep) result.set(a, rep);
    else {
      representatives.push(a);
      result.set(a, a);
    }
  }
  return result;
}
