import { useSyncExternalStore } from "react";
import type { PhotoIssue, ScanProgress } from "../../shared/scan.ts";
import { ocr, ScanCancelled } from "./ocr.ts";
import { addScanned, createReading, removeIfEmpty } from "./readings.ts";
import { navigate } from "./router.ts";

/** 写真1枚の読み取りの状態。 */
export type PhotoStatus = "waiting" | "reading" | "done" | "failed";

/** 写真1枚の状態と、見つけたシリアルの件数。`issue` は1件も見つからなかったときの理由の見当。 */
export interface PhotoState {
  status: PhotoStatus;
  count: number;
  issue?: PhotoIssue;
  /** 1件も見つからなかった写真の小さな見本。まとめの画面で写真を示すためだけに持つ */
  preview?: Blob;
  /**
   * 1件も見つからなかった写真のファイル。まとめの画面で、見本を押したときに大きく見せるためだけに持つ。
   * 次のスキャンを始めるまでメモリに置き、端末には保存しない
   */
  file?: File;
}

/** 写真をまとめて読み取る1回分の進み具合と結果。 */
export interface ScanJob {
  readingId: string;
  photos: PhotoState[];
  /** 読み取り中の写真の段階と進み具合。`since` はその段階に入った時刻 */
  current?: ScanProgress & { since: number };
  finished: boolean;
  cancelled: boolean;
  added: number;
  /** 読み取れなかった写真の番号（0から） */
  failed: number[];
  /** 文字認識のモデルを読み込めず、読み取りを続けられなかった */
  modelFailed: boolean;
}

let job: ScanJob | undefined;
const listeners = new Set<() => void>();

function update(patch: Partial<ScanJob>) {
  if (!job) return;
  job = { ...job, ...patch };
  for (const l of listeners) l();
}

/** 今の読み取りの進み具合。読み取りを始めていなければ undefined。 */
export function useScanJob(): ScanJob | undefined {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => job,
  );
}

/**
 * 写真をまとめて読み取る。読み取り中の画面へ移り、終わったら結果の画面へ移る。
 * 写真を選ぶたびに、新しい読み取りとして分ける。
 */
export async function startScan(files: File[]) {
  if (files.length === 0 || (job && !job.finished)) return;
  const id = createReading().id;
  job = {
    readingId: id,
    photos: files.map(() => ({ status: "waiting", count: 0 })),
    finished: false,
    cancelled: false,
    added: 0,
    failed: [],
    modelFailed: false,
  };
  navigate({ name: "scan" });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file || !job || job.cancelled) break;
    setPhoto(i, "reading", 0);
    update({ current: undefined });
    try {
      const { serials, issue, preview } = await ocr.scan(file, (progress) => {
        const since = job?.current?.stage === progress.stage ? job.current.since : Date.now();
        update({ current: { ...progress, since } });
      });
      const added = addScanned(id, serials);
      // 読み取り中の数えた数を、確定した件数（写真の中の重複を除いたもの）に置き換える
      if (serials.length === 0) setPhoto(i, "done", 0, issue, preview, file);
      else setPhoto(i, "done", serials.length);
      update({ current: undefined, added: job.added + added });
    } catch (err) {
      // モデルを読み込めないときは、残りの写真も読めない。写真のせいにせず、準備の失敗として知らせる
      if (ocr.getStatus().kind === "error") {
        setPhoto(i, "waiting", 0);
        update({ modelFailed: true });
        break;
      }
      if (err instanceof ScanCancelled) {
        setPhoto(i, "waiting", 0);
        break;
      }
      // 画面には件数だけを出す。原因はブラウザの開発者ツールで確かめられるよう残す
      console.error("写真を読み取れませんでした", err);
      setPhoto(i, "failed", 0);
      update({ failed: [...job.failed, i] });
    }
  }
  finish();
}

/**
 * 写真1枚の中の進み具合（0〜1）。かかる時間の割合に合わせて段階ごとに区切る。
 * 紙10枚の写真では、文字の行の検出が約2割、文字の認識が約8割だった（写真の読み込みと、
 * QRコード・応募先の確定はどちらも0.1〜0.5秒ほどで、ほぼ幅を取らない）。検出は1回の処理で途中経過が
 * 取れないため、時間に合わせて進め、区切りの手前でゆっくり止まるようにする（止まって見えないため）。
 * 残りの行の認識は、大きい行にシリアルがなかったときだけ起きるため、狭い幅に収める。
 */
export function photoRatio(current: ScanJob["current"], now: number): number {
  if (!current) return 0;
  const part = current.total > 0 ? current.done / current.total : 1;
  switch (current.stage) {
    case "prepare":
      return 0.01;
    case "detect":
      return 0.02 + 0.18 * (1 - Math.exp(-(now - current.since) / 1500));
    case "large":
      return 0.2 + 0.75 * part;
    case "rest":
      return 0.95 + 0.04 * part;
    case "finish":
      return 0.99;
  }
}

/** 読み取り中の写真で、ここまでに見つけたシリアルらしい行の数。 */
export function currentFound(current: ScanJob["current"]): number {
  return current?.found ?? 0;
}

function setPhoto(
  index: number,
  status: PhotoStatus,
  count: number,
  issue?: PhotoIssue,
  preview?: Blob,
  file?: File,
) {
  if (!job) return;
  update({
    photos: job.photos.map((p, i) => (i === index ? { status, count, issue, preview, file } : p)),
  });
}

/** シリアルナンバーを1件も得られなかった写真の番号（0から）。開けなかった写真も含む。 */
export function missingPhotos(job: ScanJob): number[] {
  return job.photos.flatMap((p, i) =>
    p.status === "failed" || (p.status === "done" && p.count === 0) ? [i] : [],
  );
}

function finish() {
  if (!job) return;
  update({ finished: true });
  removeIfEmpty(job.readingId);
  // すべての写真から読めたときだけ、そのまま結果へ移る。0件の写真・開けない写真・準備の失敗が
  // あったときは、読み取り中の画面にまとめを出して、撮り直すかどうかを選んでもらう
  if (job.cancelled) {
    if (job.added > 0) {
      navigate({ name: "results", readingId: job.readingId }, { replace: true });
    } else {
      navigate({ name: "top" }, { replace: true });
    }
  } else if (!job.modelFailed && job.added > 0 && missingPhotos(job).length === 0) {
    navigate({ name: "results", readingId: job.readingId }, { replace: true });
  }
}

/** 読み取りをすぐにやめる。読み取り中の写真の結果は捨て、読み終えた写真の結果は残す。 */
export function cancelScan() {
  if (!job || job.finished) return;
  update({ cancelled: true });
  ocr.cancel();
}
