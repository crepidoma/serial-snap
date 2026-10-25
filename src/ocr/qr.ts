// 写真の中のQRコードを読む。QRコードの中身は紙に印刷された応募サイトのURLと同じで、
// URLの文字が隠れたり読み違えたりした紙でも、QRコードが見えていれば応募先が分かる。
import { readBarcodes } from "zxing-wasm/reader";
import type { RGBAImage, Vec } from "./core.ts";

/** 写真の中のQRコード1つ。座標は元の写真のもの。 */
export interface QrCode {
  text: string;
  center: Vec;
}

/**
 * 写真の中のQRコードをすべて読む。
 * zxing-wasm のWASMは、呼び出し側が `prepareZXingModule` で先に渡しておく（外部から読み込ませないため）。
 */
export async function readQrCodes(image: RGBAImage): Promise<QrCode[]> {
  // zxing-wasm は ImageData を受け取るが、使うのは data・width・height だけ。
  // Node.js には ImageData がないため、同じ形の値をそのまま渡す
  const results = await readBarcodes(image as ImageData, {
    formats: ["QRCode"],
    maxNumberOfSymbols: 50,
    tryHarder: true,
  });
  return results
    .filter((r) => r.isValid && r.text)
    .map((r) => {
      const { topLeft, topRight, bottomLeft, bottomRight } = r.position;
      return {
        text: r.text,
        center: [
          (topLeft.x + topRight.x + bottomLeft.x + bottomRight.x) / 4,
          (topLeft.y + topRight.y + bottomLeft.y + bottomRight.y) / 4,
        ],
      };
    });
}
