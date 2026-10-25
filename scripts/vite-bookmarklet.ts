import { fileURLToPath } from "node:url";
import { build, type Plugin } from "vite";

const ENTRY = fileURLToPath(new URL("../src/bookmarklet/main.ts", import.meta.url));
const ID = "virtual:bookmarklet";
const RESOLVED = `\0${ID}`;

/** ブックマークレットを1つのファイルにまとめて縮め、`javascript:` のURLにする。 */
async function bundle(): Promise<string> {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    build: {
      write: false,
      minify: true,
      lib: { entry: ENTRY, formats: ["iife"], name: "serialSnapBookmarklet" },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  for (const out of outputs) {
    if (!("output" in out)) continue;
    const chunk = out.output.find((o) => o.type === "chunk");
    if (chunk && chunk.type === "chunk") return chunk.code.trim();
  }
  throw new Error("ブックマークレットを作れませんでした");
}

/**
 * `virtual:bookmarklet` で、ブックマークレットのURL（`javascript:…`）を渡す。
 * src/bookmarklet と src/shared/marker.ts を変えると、開発サーバーでも作り直す。
 */
export function bookmarklet(): Plugin {
  return {
    name: "serial-snap:bookmarklet",
    resolveId(id) {
      return id === ID ? RESOLVED : undefined;
    },
    async load(id) {
      if (id !== RESOLVED) return;
      for (const f of ["main.ts", "panel.ts", "plan.ts"]) {
        this.addWatchFile(fileURLToPath(new URL(`../src/bookmarklet/${f}`, import.meta.url)));
      }
      this.addWatchFile(fileURLToPath(new URL("../src/shared/marker.ts", import.meta.url)));
      // URLとして解釈されるため、% や改行などを符号化する。日本語もそのままでは貼り付けで化けることがある
      const href = `javascript:${encodeURIComponent(await bundle())}`;
      return `export const href = ${JSON.stringify(href)};\n`;
    },
  };
}
