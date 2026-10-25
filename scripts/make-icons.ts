/**
 * ホーム画面に追加したときのアイコン（PNG）を public/icon.svg から作る。ロゴを変えたら `npm run icons` で作り直す。
 * iPhone と Android の切り抜き用（maskable）は、端末が角を丸めたり形に切り抜いたりするため、角を丸めずに地を端まで敷く。
 */
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const dir = new URL("../public/", import.meta.url);
const rounded = await readFile(new URL("icon.svg", dir), "utf8");
const square = rounded.replace(' rx="8"', "");

const outputs: [name: string, svg: string, size: number][] = [
  ["apple-touch-icon.png", square, 180],
  ["icon-192.png", rounded, 192],
  ["icon-512.png", rounded, 512],
  ["icon-maskable-512.png", square, 512],
];
for (const [name, svg, size] of outputs) {
  const png = await sharp(Buffer.from(svg), { density: (72 * size) / 32 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(new URL(name, dir), png);
  console.log(`${name} ${size}px ${png.length} bytes`);
}
