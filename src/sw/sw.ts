/// <reference lib="webworker" />
/**
 * 一度開けば通信なしでも使えるようにする Service Worker。scripts/vite-sw.ts がビルドのときに
 * 配るファイルの一覧を埋め込んで `sw.js` として出力する。
 * - 画面（index.html）は通信を優先し、つながらなければ保存したものを返す（更新をすぐ届けるため）。
 * - ほかのファイルは保存したものを優先する。`assets/` の下は名前に中身のハッシュが入るため、変わらない。
 */

// モジュールにして、Worker 共通の self の型を Service Worker のものに置き換える
export {};

declare const self: ServiceWorkerGlobalScope;
/** 配るファイルの、このサイトの置き場所からの相対パス（index.html 以外）。 */
declare const __FILES__: string[];
/** この版の保存先の名前。ファイルの一覧から作るため、中身が変わると変わる。 */
declare const __CACHE__: string;

const CACHE_PREFIX = "serial-snap-";
/**
 * 入れ替えるときに先に保存しないファイル。文字認識のモデルとWASM（合わせて約31MB）は、
 * 画面が取得するときに保存する（取得の進み具合を画面に出すため）。
 */
const FETCH_LATER = /\.(onnx|wasm)$/;

const scope = self.registration.scope;
const toUrl = (path: string) => new URL(path, scope).href;
const files = new Set(__FILES__.map(toUrl));
/** 名前に中身のハッシュが入ったファイル。前の版で保存したものをそのまま使える。 */
const isHashed = (url: string) => url.startsWith(toUrl("assets/"));

async function fetchOk(url: string): Promise<Response> {
  // ブラウザのキャッシュにある古い画面を保存しないよう、サーバーに確かめる
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${url} を取得できませんでした（${res.status}）`);
  return res;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(__CACHE__);
      await Promise.all(
        [scope, ...__FILES__.filter((p) => !FETCH_LATER.test(p)).map(toUrl)].map(async (url) => {
          const kept = isHashed(url) ? await caches.match(url) : undefined;
          await cache.put(url, kept ?? (await fetchOk(url)));
        }),
      );
      // 開いている画面にもすぐ新しい版を使わせる。古い画面が読むファイルは、名前が同じなら引き継いだものを返す
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(__CACHE__);
      for (const name of await caches.keys()) {
        if (name === __CACHE__ || !name.startsWith(CACHE_PREFIX)) continue;
        // 前の版で取得したモデルなどを引き継ぎ、もう一度ダウンロードさせない
        const old = await caches.open(name);
        for (const req of await old.keys()) {
          if (!files.has(req.url) || !isHashed(req.url) || (await cache.match(req))) continue;
          const res = await old.match(req);
          if (res) await cache.put(req, res);
        }
        await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

/**
 * 取得したものを保存する。保存が終わるのを待たずに画面へ返す（モデルの取得の進み具合を画面に出すため）。
 */
function keep(event: FetchEvent, url: string, res: Response) {
  if (!res.ok) return;
  const copy = res.clone();
  event.waitUntil(caches.open(__CACHE__).then((cache) => cache.put(url, copy)));
}

/** 画面。通信を優先し、取得できたら保存し直す。 */
async function page(event: FetchEvent): Promise<Response> {
  try {
    const res = await fetch(event.request);
    keep(event, scope, res);
    return res;
  } catch {
    return (await caches.match(scope)) ?? Response.error();
  }
}

/** 画面以外のファイル。保存したものを優先し、なければ取得して保存する。 */
async function asset(event: FetchEvent): Promise<Response> {
  const url = event.request.url.split(/[?#]/)[0] ?? event.request.url;
  const kept = await caches.match(url);
  if (kept) return kept;
  // ブラウザのキャッシュを通さない。ここで保存するため二重に持つ必要がなく、取得の途中で画面を開き直すと、
  // 同じファイルの2つの取得がブラウザのキャッシュへの書き込みでぶつかり、片方が失敗するため（Chromiumで確かめた）
  const res = await fetch(url, { cache: "no-store" });
  keep(event, url, res);
  return res;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (request.mode === "navigate") {
    // 画面はハッシュで切り替えるため、このアプリのページは置き場所そのものか index.html のみ
    if (url.href.split(/[?#]/)[0] === scope || url.pathname.endsWith("/index.html")) {
      event.respondWith(page(event));
    }
    return;
  }
  if (files.has(url.origin + url.pathname)) event.respondWith(asset(event));
});
