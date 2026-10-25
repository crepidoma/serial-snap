// 写真の明るさとピントの具合。シリアルナンバーが見つからなかった写真に、理由を添えるために使う。
// Node.jsからも動かすため、DOMやWorker固有のAPIを使わない。
import type { RGBAImage } from "./core.ts";

/** 測るときに縮める長い辺。細かすぎると時間がかかり、粗すぎるとピントの甘さが分からなくなる。 */
const SAMPLE_SIDE = 800;

/** 写真の明るさ（0〜255の平均）、明暗の差（標準偏差）、輪郭のくっきりさ（ラプラシアンの分散）。 */
export interface PhotoQuality {
  brightness: number;
  contrast: number;
  sharpness: number;
}

/** 写真を灰色にして縮め、明るさ・明暗の差・輪郭のくっきりさを測る。 */
export function measureQuality(img: RGBAImage): PhotoQuality {
  const step = Math.max(1, Math.ceil(Math.max(img.width, img.height) / SAMPLE_SIDE));
  const w = Math.floor(img.width / step);
  const h = Math.floor(img.height / step);
  const gray = new Float32Array(w * h);
  let sum = 0;
  let sq = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * step * img.width + x * step) * 4;
      const v =
        0.299 * (img.data[i] ?? 0) +
        0.587 * (img.data[i + 1] ?? 0) +
        0.114 * (img.data[i + 2] ?? 0);
      gray[y * w + x] = v;
      sum += v;
      sq += v * v;
    }
  }
  let lapSum = 0;
  let lapSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const c = y * w + x;
      const lap =
        (gray[c - 1] ?? 0) +
        (gray[c + 1] ?? 0) +
        (gray[c - w] ?? 0) +
        (gray[c + w] ?? 0) -
        4 * (gray[c] ?? 0);
      lapSum += lap;
      lapSq += lap * lap;
      n++;
    }
  }
  const lapMean = n ? lapSum / n : 0;
  const count = w * h;
  const brightness = count ? sum / count : 0;
  return {
    brightness,
    contrast: count ? Math.sqrt(Math.max(0, sq / count - brightness * brightness)) : 0,
    sharpness: n ? lapSq / n - lapMean * lapMean : 0,
  };
}

/**
 * これより暗ければ「暗い」とする。手元の写真を3割の明るさにしたものは27〜51だった。
 * 普通に撮った写真でも37のものがあり、それは読めたため、シリアルナンバーが見つからなかった写真にだけ使う。
 */
const DARK_BRIGHTNESS = 55;
/**
 * これよりくっきりしていなければ「ぼやけている」とする。手元の写真は2,610〜21,601、
 * ぼかしたもの（半径3px）は59〜478だった。
 */
const BLURRY_SHARPNESS = 1000;
/**
 * 明暗の差がこれより小さい写真は、壁や机だけを写したものとみなし「ぼやけている」としない
 * （輪郭がないのはピントのせいではないため）。手元の写真をぼかしても40以上残り、無地の画像は0〜1だった。
 */
const MIN_CONTRAST = 30;

/** 写真の具合からみた、シリアルナンバーが見つからなかった理由の見当。当てはまらなければ undefined。 */
export function qualityIssue(q: PhotoQuality): "dark" | "blurry" | undefined {
  if (q.brightness < DARK_BRIGHTNESS) return "dark";
  if (q.sharpness < BLURRY_SHARPNESS && q.contrast >= MIN_CONTRAST) return "blurry";
  return undefined;
}
