import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build, type Plugin } from "vite";

const ENTRY = fileURLToPath(new URL("../src/sw/sw.ts", import.meta.url));
const PUBLIC_DIR = new URL("../public/", import.meta.url);
/** 配信の設定で、ブラウザには届かないファイル。 */
const NOT_SERVED = new Set(["_headers"]);

/** Service Worker を、配るファイルの一覧と保存先の名前を埋め込んで1つのファイルにまとめる。 */
async function bundle(files: string[], cacheName: string): Promise<string> {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    define: {
      __FILES__: JSON.stringify(files),
      __CACHE__: JSON.stringify(cacheName),
    },
    build: {
      write: false,
      minify: true,
      lib: { entry: ENTRY, formats: ["iife"], name: "serialSnapServiceWorker" },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  for (const out of outputs) {
    if (!("output" in out)) continue;
    const chunk = out.output.find((o) => o.type === "chunk");
    if (chunk && chunk.type === "chunk") return chunk.code;
  }
  throw new Error("Service Worker を作れませんでした");
}

/**
 * ビルドのときに `sw.js` を出力する。開発サーバーでは出さない（保存したファイルが変更の確認を邪魔するため）。
 * 保存先の名前は配るファイルから作り、どれかが変われば新しい版として入れ替わる。
 */
export function serviceWorker(): Plugin {
  return {
    name: "serial-snap:sw",
    apply: "build",
    // index.html の中身も版に含めるため、画面のファイルを出力し終えたあとに作る
    enforce: "post",
    async generateBundle(_options, output) {
      const publicFiles = (await readdir(PUBLIC_DIR)).filter((f) => !NOT_SERVED.has(f));
      const files = [
        ...Object.keys(output).filter((f) => f !== "index.html"),
        ...publicFiles,
      ].sort();
      // assets のファイルは名前にハッシュが入るため名前で、index.html と public のファイルは中身で見分ける
      const hash = createHash("sha256");
      for (const name of files) hash.update(name);
      const index = output["index.html"];
      if (index?.type === "asset") hash.update(index.source);
      for (const name of publicFiles) hash.update(await readFile(new URL(name, PUBLIC_DIR)));
      const cacheName = `serial-snap-${hash.digest("hex").slice(0, 12)}`;
      this.emitFile({ type: "asset", fileName: "sw.js", source: await bundle(files, cacheName) });
    },
  };
}
