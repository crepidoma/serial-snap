import type { SerialEntry } from "./readings.ts";

/** 応募先が分からないシリアルのまとまりの名前。 */
const UNKNOWN = "応募先不明";

/** 応募先1つ分のシリアル。 */
export interface Group {
  /** 応募サイトのURLのアーティスト部分。応募先不明なら undefined */
  artist?: string;
  /** 画面に出す名前（アーティスト部分、または「応募先不明」） */
  label: string;
  entries: SerialEntry[];
}

/** 読み取った順のまま、応募先ごとに束ねる。応募先不明は最後に置く。 */
export function groupEntries(entries: SerialEntry[]): Group[] {
  const map = new Map<string, Group>();
  for (const e of entries) {
    const key = e.artist ?? "";
    let g = map.get(key);
    if (!g) {
      g = { artist: e.artist, label: e.artist ?? UNKNOWN, entries: [] };
      map.set(key, g);
    }
    g.entries.push(e);
  }
  return [...map.values()].sort((a, b) => Number(!a.artist) - Number(!b.artist));
}
