import { formatRecentDateTime } from "./format.ts";
import type { Reading, SerialEntry } from "./readings.ts";

/** 文字認識の確信度がこれ未満なら、写真と見比べるよう促す。 */
const LOW_CONF = 0.9;
/** 1文字でもこれ未満なら、その文字の読み違いを疑う。 */
const LOW_CHAR_CONF = 0.8;

/**
 * シリアル1件の注意。応募サイトは登録の失敗が続くとアカウントを一時停止するため、コピーの前に気付かせる。
 * `text` は行に出す一言。
 */
export interface SerialIssue {
  kind: "chars" | "length" | "seen" | "lowConfidence";
  text: string;
}

/** 同じ応募先のシリアルの中で、最も多い文字数。 */
export function commonLength(entries: SerialEntry[]): number | undefined {
  const counts = new Map<number, number>();
  for (const e of entries) counts.set(e.serial.length, (counts.get(e.serial.length) ?? 0) + 1);
  let best: [number, number] | undefined;
  for (const entry of counts) if (!best || entry[1] > best[1]) best = entry;
  // 1〜2件では多数派と言えないため判定しない
  return best && best[1] >= 2 && best[1] > entries.length / 2 ? best[0] : undefined;
}

/** ほかの読み取りにも同じシリアルがあったこと。すでに応募サイトへ登録している可能性がある。 */
export interface Sighting {
  createdAt: number;
  copied: boolean;
}

/**
 * ほかの読み取りにもあるシリアルの表。コピー済みのものを優先し、同じならより新しい読み取りを選ぶ
 * （登録した可能性が高い方を知らせるため）。
 */
export function sightings(readings: Reading[], readingId: string): Map<string, Sighting> {
  const map = new Map<string, Sighting>();
  for (const r of readings) {
    if (r.id === readingId) continue;
    for (const e of r.entries) {
      const prev = map.get(e.serial);
      const better =
        !prev ||
        (e.copied && !prev.copied) ||
        (e.copied === prev.copied && r.createdAt > prev.createdAt);
      if (better) map.set(e.serial, { createdAt: r.createdAt, copied: e.copied });
    }
  }
  return map;
}

/** 間違えやすい文字の組。シリアルに含まれる組を、確信度が低いときの一言に添える。 */
const CONFUSABLE = [
  { chars: /[0O]/, text: "0とO" },
  { chars: /[1I]/, text: "1とI" },
];

/**
 * シリアル1件の読み違いの疑い。最も注意が必要なもの1つだけを返す（行に出すのは一言だけのため）。
 * ほかの読み取りにあることは `seenNotice` で別に知らせる（直す必要があるものと色で見分けるため）。
 */
export function issueOf(entry: SerialEntry, length: number | undefined): SerialIssue | undefined {
  const other = entry.serial.match(/[^A-Za-z0-9]/)?.[0];
  if (other) return { kind: "chars", text: `英数字以外の文字(${other})あり` };
  if (length !== undefined && entry.serial.length !== length) {
    const diff = entry.serial.length - length;
    const amount = Math.abs(diff);
    return {
      kind: "length",
      text: `ほかより${amount}文字${diff < 0 ? "少ない" : "多い"}(${entry.serial.length}文字)`,
    };
  }
  if (entry.conf < LOW_CONF || entry.minCharConf < LOW_CHAR_CONF) {
    const pairs = CONFUSABLE.filter((c) => c.chars.test(entry.serial)).map((c) => c.text);
    return {
      kind: "lowConfidence",
      text: `読み取りに自信なし${pairs.length ? `(${pairs.join("・")})` : ""}`,
    };
  }
  return undefined;
}

/** ほかの読み取りにもあることの知らせ。すでに応募サイトへ登録している可能性を伝える。 */
export function seenNotice(seen: Sighting | undefined): SerialIssue | undefined {
  if (!seen) return undefined;
  const when = formatRecentDateTime(seen.createdAt);
  return {
    kind: "seen",
    text: seen.copied ? `${when} にコピー済み` : `${when} にもスキャンされました`,
  };
}
