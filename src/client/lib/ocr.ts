import { useSyncExternalStore } from "react";
import type {
  PhotoIssue,
  Pixels,
  ScannedSerial,
  ScanProgress,
  ScanResult,
  WorkerRequest,
  WorkerResponse,
  WorkerSerial,
} from "../../shared/scan.ts";

/**
 * 読み取りに使う写真の長い辺の上限。iPhoneのSafariはcanvasの画素数に上限（約1,670万）があり、
 * 2400万画素の写真をそのまま描くと失敗するため縮める。4000pxでもシリアルの文字は十分な大きさに写る。
 */
const FULL_MAX_SIDE = 4000;
/** 見つからなかった写真を示す見本の長い辺。画面では64px四方ほどで出すため、高精細の画面でも足りる大きさ。 */
const PREVIEW_MAX_SIDE = 240;
/** 文字の検出に使う写真の長い辺。試作では、これで紙10枚の写真のシリアルを読み切れた。 */
const DET_MAX_SIDE = 1920;

function draw(source: ImageBitmap, maxSide: number): Pixels {
  const s = Math.min(1, maxSide / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * s);
  canvas.height = Math.round(source.height * s);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("画像を読み込めませんでした");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // iOSはcanvasのメモリを解放するのが遅いため、大きさを0にして早めに手放す
  canvas.width = 0;
  canvas.height = 0;
  return { data, width, height };
}

function toBlob(p: Pixels): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = p.width;
  canvas.height = p.height;
  canvas
    .getContext("2d")
    ?.putImageData(new ImageData(new Uint8ClampedArray(p.data), p.width, p.height), 0, 0);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("切り抜きを作れませんでした"))),
      "image/jpeg",
      0.85,
    ),
  );
}

async function withBlobs(serials: WorkerSerial[]): Promise<ScannedSerial[]> {
  return Promise.all(serials.map(async (s) => ({ ...s, thumb: await toBlob(s.thumb) })));
}

type Listener = (msg: WorkerResponse) => void;

/**
 * 開発サーバーで `?fail-model` を付けて開くと、モデルの読み込みの失敗を再現する（準備の失敗の画面を確かめるため）。
 * 本番のビルドでは常に false になり、この分岐ごと取り除かれる。
 */
const FAIL_MODEL = import.meta.env.DEV && new URLSearchParams(location.search).has("fail-model");

/** 読み取りを中止したときに、読み取り中だった写真の `scan` が投げるエラー。 */
export class ScanCancelled extends Error {
  constructor() {
    super("スキャンを中止しました");
    this.name = "ScanCancelled";
  }
}

/** 読み取りの仕組み（モデル）の準備の状態。初回は約31MBを取得するため、進み具合を出す。 */
export type ModelStatus =
  | { kind: "loading"; progress: number }
  | { kind: "ready" }
  | { kind: "error" };

/**
 * 文字認識のWorkerを1つだけ持ち、写真を1枚ずつ順に渡す。
 * 同時に処理するとiPhoneでメモリが足りなくなるため、並べて待たせる。
 */
class OcrClient {
  private worker: Worker | undefined;
  private readonly listeners = new Set<Listener>();
  private nextId = 1;
  private queue: Promise<unknown> = Promise.resolve();
  private status: ModelStatus = { kind: "loading", progress: 0 };
  /** 中止するたびに増やす。中止より前に始めた読み取りを見分ける */
  private generation = 0;
  /** Workerの結果を待っている読み取りを、中止のときに終わらせる */
  private readonly aborts = new Set<() => void>();
  private readonly statusListeners = new Set<() => void>();

  private send(req: WorkerRequest, transfer: Transferable[] = []) {
    if (FAIL_MODEL) {
      const msg: WorkerResponse = {
        type: "error",
        id: req.type === "scan" ? req.id : -1,
        message: "fail-model",
      };
      setTimeout(() => {
        this.updateStatus(msg);
        for (const l of this.listeners) l(msg);
      }, 500);
      return;
    }
    if (!this.worker) {
      this.worker = new Worker(new URL("../../ocr/worker.ts", import.meta.url), { type: "module" });
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        this.updateStatus(e.data);
        for (const l of this.listeners) l(e.data);
      };
    }
    this.worker.postMessage(req, transfer);
  }

  private updateStatus(msg: WorkerResponse) {
    const next: ModelStatus | undefined =
      msg.type === "loading"
        ? { kind: "loading", progress: msg.progress }
        : msg.type === "ready"
          ? { kind: "ready" }
          : msg.type === "error" && msg.id === -1
            ? { kind: "error" }
            : undefined;
    if (!next) return;
    // 画面には理由を出さないため、調べられるよう記録する
    if (msg.type === "error") console.error("読み取りの準備に失敗しました", msg.message);
    this.status = next;
    for (const l of this.statusListeners) l();
  }

  /** モデルの準備の状態を受け取る（useSyncExternalStore 用）。 */
  subscribeStatus = (listener: () => void) => {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  };

  getStatus = () => this.status;

  /** Workerからの知らせを受け取る。戻り値の関数で受け取りをやめる。 */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** モデルを先に読み込んでおく。初回はここで約31MBを取得する。 */
  warmup() {
    this.send({ type: "warmup" });
  }

  /**
   * 読み取り中の写真をすぐにやめる。Workerは文字認識の途中では知らせを受け取れないため、止めて作り直す。
   * 作り直したWorkerは、ブラウザのキャッシュからモデルを読み直す。
   */
  cancel() {
    this.generation++;
    this.worker?.terminate();
    this.worker = undefined;
    for (const abort of this.aborts) abort();
    this.aborts.clear();
    this.updateStatus({ type: "loading", progress: 0 });
    this.warmup();
  }

  /** 写真1枚を読み取る。前の写真が終わるまで待ってから始める。中止されたら `ScanCancelled` を投げる。 */
  scan(file: Blob, onProgress?: (progress: ScanProgress) => void): Promise<ScanResult> {
    const run = async () => {
      const generation = this.generation;
      onProgress?.({ stage: "prepare", done: 0, total: 0, found: 0 });
      // createImageBitmap はEXIFの向きを反映する（スマホの縦向きの写真が横にならない）
      const bitmap = await createImageBitmap(file);
      const full = draw(bitmap, FULL_MAX_SIDE);
      const small = draw(bitmap, DET_MAX_SIDE);
      const preview = await toBlob(draw(bitmap, PREVIEW_MAX_SIDE));
      bitmap.close();
      // 写真の読み込みの間に中止されたときは、作り直したWorkerへ渡さない
      if (generation !== this.generation) throw new ScanCancelled();
      const result = await new Promise<{ serials: WorkerSerial[]; issue?: PhotoIssue }>(
        (resolve, reject) => {
          const id = this.nextId++;
          const done = () => {
            off();
            this.aborts.delete(abort);
          };
          const abort = () => {
            off();
            reject(new ScanCancelled());
          };
          this.aborts.add(abort);
          const off = this.subscribe((msg) => {
            if (msg.type === "progress" && msg.id === id) onProgress?.(msg);
            if (msg.type === "result" && msg.id === id) {
              done();
              resolve({ serials: msg.serials, issue: msg.issue });
            }
            if (msg.type === "error" && msg.id === id) {
              done();
              reject(new Error(msg.message));
            }
          });
          this.send({ type: "scan", id, full, small }, [full.data.buffer, small.data.buffer]);
        },
      );
      return { serials: await withBlobs(result.serials), issue: result.issue, preview };
    };
    const p = this.queue.then(run, run);
    this.queue = p.catch(() => undefined);
    return p;
  }
}

/** アプリ全体で使う文字認識。 */
export const ocr = new OcrClient();

/** 読み取りの仕組み（モデル）の準備の状態。 */
export function useModelStatus(): ModelStatus {
  return useSyncExternalStore(ocr.subscribeStatus, ocr.getStatus);
}
