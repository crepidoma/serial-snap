import { useSyncExternalStore } from "react";
import { type ArtistSource, canonicalArtists, type ScannedSerial } from "../../shared/scan.ts";
import { deleteReading, loadReadings, saveReading } from "./storage.ts";

/** 読み取ったシリアル1件。 */
export interface SerialEntry {
  id: string;
  serial: string;
  /** 応募サイトのURLのアーティスト部分。分からなければ undefined（応募先不明） */
  artist?: string;
  artistSource: ArtistSource;
  /** 文字認識の確信度。手で修正したものは 1 */
  conf: number;
  minCharConf: number;
  /** コピーしたか */
  copied: boolean;
  /** 写真の切り抜き（JPEG） */
  thumb: Blob;
}

/** 読み取り1回分。同じ時に撮った・選んだ写真から読んだシリアルをまとめる。 */
export interface Reading {
  id: string;
  createdAt: number;
  entries: SerialEntry[];
}

/** 読み取りを端末に残す日数。過ぎたものは次に開いたときに消す。 */
export const RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 読み取りを自動的に削除するまでの日数（1以上）。 */
export function daysLeft(reading: Reading, now = Date.now()): number {
  return Math.max(1, Math.ceil((reading.createdAt + RETENTION_DAYS * DAY_MS - now) / DAY_MS));
}

let readings: Reading[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

/** 保存の失敗は画面を止めずに記録だけする（ストレージが使えない設定でも、開いている間は使えるように）。 */
function persist(task: Promise<void>) {
  task.catch((err: unknown) => console.error("スキャンを端末に保存できませんでした", err));
}

/** 読み取りを置き換え、変わったものだけを端末に保存する（更新のたびに新しいオブジェクトを作るため、参照で比べる）。 */
function commit(next: Reading[]) {
  const prev = new Map(readings.map((r) => [r.id, r]));
  readings = next;
  for (const r of next) {
    if (prev.get(r.id) !== r) persist(saveReading(r));
    prev.delete(r.id);
  }
  for (const id of prev.keys()) persist(deleteReading(id));
  notify();
}

/**
 * 端末に保存した読み取りを読み込む。30日を過ぎたものと、中身が空のもの（読み取りの途中で閉じたときなど）は消す。
 * 読み込みの間に作った読み取りは残す。
 */
async function load() {
  try {
    const now = Date.now();
    const saved = await loadReadings();
    const keep: Reading[] = [];
    for (const r of saved) {
      const expired = now - r.createdAt >= RETENTION_DAYS * DAY_MS;
      if (expired || r.entries.length === 0) persist(deleteReading(r.id));
      else keep.push(r);
    }
    const fresh = new Set(readings.map((r) => r.id));
    readings = [...readings, ...keep.filter((r) => !fresh.has(r.id))].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  } catch (err) {
    console.error("保存したスキャンを読み込めませんでした", err);
  }
  loaded = true;
  notify();
}

if (typeof indexedDB !== "undefined") void load();
else loaded = true;

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** 端末に保存した読み取りを読み込み終えたか。読み込む前は、まだない読み取りを「ない」と判断しない。 */
export function useReadingsLoaded(): boolean {
  return useSyncExternalStore(subscribe, () => loaded);
}

/** すべての読み取り（新しい順）。 */
export function useReadings(): Reading[] {
  return useSyncExternalStore(subscribe, () => readings);
}

/** 読み取り1回分。見つからなければ undefined。 */
export function useReading(id: string): Reading | undefined {
  return useSyncExternalStore(subscribe, () => readings.find((r) => r.id === id));
}

/** 新しい読み取りを作る。 */
export function createReading(): Reading {
  const reading: Reading = { id: crypto.randomUUID(), createdAt: Date.now(), entries: [] };
  commit([reading, ...readings]);
  return reading;
}

/**
 * 写真1枚の読み取り結果を足し、足した件数を返す。
 * 同じ読み取りの中ですでにあるシリアル（同じ紙を2枚の写真に写したときなど）は足さない。
 * ほかの読み取りにあるシリアルは足し、結果の画面で注意を出す（今回読み取った分はすべて見せるため）。
 * アーティストの表記は、読み取り1回の中で多数決をとって揃える（重なった紙ではURLを読み違えるため）。
 */
export function addScanned(readingId: string, scanned: ScannedSerial[]): number {
  const known = new Set(readings.find((r) => r.id === readingId)?.entries.map((e) => e.serial));
  const fresh: SerialEntry[] = [];
  for (const s of scanned) {
    if (known.has(s.serial)) continue;
    known.add(s.serial);
    fresh.push({
      id: crypto.randomUUID(),
      serial: s.serial,
      artist: s.artist,
      artistSource: s.artistSource,
      conf: s.conf,
      minCharConf: s.minCharConf,
      copied: false,
      thumb: s.thumb,
    });
  }
  commit(
    readings.map((r) => {
      if (r.id !== readingId) return r;
      const entries = [...r.entries, ...fresh];
      const canonical = canonicalArtists(entries.flatMap((e) => e.artist ?? []));
      return {
        ...r,
        entries: entries.map((e) => (e.artist ? { ...e, artist: canonical.get(e.artist) } : e)),
      };
    }),
  );
  return fresh.length;
}

/** 中身が空の読み取りを消す（1件も読み取れなかったときなど）。 */
export function removeIfEmpty(readingId: string) {
  const r = readings.find((x) => x.id === readingId);
  if (r && r.entries.length === 0) commit(readings.filter((x) => x.id !== readingId));
}

function updateReading(readingId: string, change: (entries: SerialEntry[]) => SerialEntry[]) {
  commit(readings.map((r) => (r.id === readingId ? { ...r, entries: change(r.entries) } : r)));
}

/**
 * シリアルを手で直す。直したものは確かめ済みとして扱い、確信度の注意を消す。
 * 文字が変わったらコピー済みの印も外す（直す前の文字をコピーしていたため）。
 * 同じ読み取りに同じシリアルがあれば直さずに "duplicate" を返す。
 */
export function updateSerial(readingId: string, id: string, serial: string): "ok" | "duplicate" {
  const reading = readings.find((r) => r.id === readingId);
  if (reading?.entries.some((e) => e.serial === serial && e.id !== id)) return "duplicate";
  updateReading(readingId, (entries) =>
    entries.map((e) =>
      e.id === id
        ? { ...e, serial, conf: 1, minCharConf: 1, copied: e.serial === serial && e.copied }
        : e,
    ),
  );
  return "ok";
}

/** シリアルを消す。 */
export function removeSerial(readingId: string, id: string) {
  updateReading(readingId, (entries) => entries.filter((e) => e.id !== id));
}

/** コピーしたシリアルに印を付ける。 */
export function markCopied(readingId: string, ids: string[]) {
  const set = new Set(ids);
  updateReading(readingId, (entries) =>
    entries.map((e) => (set.has(e.id) ? { ...e, copied: true } : e)),
  );
}

/** 読み取り1回分を消す。 */
export function removeReading(readingId: string) {
  commit(readings.filter((r) => r.id !== readingId));
}

/** すべての読み取りを消す（メニューの「すべて削除」）。 */
export function removeAllReadings() {
  commit([]);
}
