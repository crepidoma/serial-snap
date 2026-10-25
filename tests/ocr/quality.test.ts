import { describe, expect, test } from "vitest";
import type { RGBAImage } from "../../src/ocr/core.ts";
import { measureQuality, qualityIssue } from "../../src/ocr/quality.ts";

/** 各画素の明るさ（0〜255）を返す関数から、灰色の画像を作る。 */
function image(width: number, height: number, value: (x: number, y: number) => number): RGBAImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const v = value(x, y);
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return { data, width, height };
}

describe("qualityIssue", () => {
  test("細かい白黒の模様は、明るさもピントも問題なし", () => {
    const sharp = image(400, 300, (x, y) => (((x >> 1) + (y >> 1)) % 2 ? 230 : 30));
    expect(qualityIssue(measureQuality(sharp))).toBeUndefined();
  });

  test("全体が暗ければ「暗い」", () => {
    const dark = image(400, 300, (x, y) => (((x >> 1) + (y >> 1)) % 2 ? 50 : 10));
    expect(qualityIssue(measureQuality(dark))).toBe("dark");
  });

  test("明暗の差はあるのに輪郭がなだらかなら「ぼやけている」", () => {
    const blurry = image(400, 300, (x) => 130 + 100 * Math.sin(x / 40));
    expect(qualityIssue(measureQuality(blurry))).toBe("blurry");
  });

  test("無地の写真（壁や机）は「ぼやけている」としない", () => {
    const plain = image(400, 300, () => 180);
    expect(qualityIssue(measureQuality(plain))).toBeUndefined();
  });
});
