import type { Reading, SerialEntry } from "./readings.ts";

const DB_NAME = "serial-snap";
const DB_VERSION = 1;
/** 読み取り1回分を1件として、`id` を鍵に保存する。 */
const STORE = "readings";

/**
 * 保存する形。切り抜きは Blob のままではなくバイト列で持つ。
 * Blob をそのまま入れられないブラウザ（WebKitの一部の版など）でも保存できるようにするため。
 */
type StoredEntry = Omit<SerialEntry, "thumb"> & { thumb: { type: string; data: ArrayBuffer } };
type StoredReading = Omit<Reading, "entries"> & { entries: StoredEntry[] };

let dbPromise: Promise<IDBDatabase> | undefined;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  // 開けなかったとき（ストレージが使えない設定など）に、次の操作でもう一度試せるようにする
  dbPromise.catch(() => {
    dbPromise = undefined;
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = action(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

/**
 * 書き込みを1つずつ順に行う。切り抜きをバイト列にする間に次の書き込みが追い越すと、
 * 古い内容で上書きしてしまうため。
 */
let writes: Promise<unknown> = Promise.resolve();
function enqueue(task: () => Promise<void>): Promise<void> {
  const next = writes.then(task, task);
  writes = next.catch(() => undefined);
  return next;
}

async function toStored(reading: Reading): Promise<StoredReading> {
  const entries = await Promise.all(
    reading.entries.map(async (e) => ({
      ...e,
      thumb: { type: e.thumb.type, data: await e.thumb.arrayBuffer() },
    })),
  );
  return { ...reading, entries };
}

function fromStored(stored: StoredReading): Reading {
  return {
    ...stored,
    entries: stored.entries.map((e) => ({
      ...e,
      thumb: new Blob([e.thumb.data], { type: e.thumb.type }),
    })),
  };
}

/** 端末に保存したすべての読み取り。 */
export async function loadReadings(): Promise<Reading[]> {
  const stored = await run("readonly", (store) => store.getAll() as IDBRequest<StoredReading[]>);
  return stored.map(fromStored);
}

/** 読み取り1回分を保存する（同じ `id` があれば置き換える）。 */
export function saveReading(reading: Reading): Promise<void> {
  return enqueue(async () => {
    const stored = await toStored(reading);
    await run("readwrite", (store) => store.put(stored));
  });
}

/** 読み取り1回分を消す。 */
export function deleteReading(id: string): Promise<void> {
  return enqueue(async () => {
    await run("readwrite", (store) => store.delete(id));
  });
}
