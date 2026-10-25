// 写真1枚の文字の行とQRコードから、シリアルとその応募先（応募サイトのURLのアーティスト部分）を取り出す。
import { type ArtistSource, canonicalArtists } from "../shared/scan.ts";
import type { TextLine } from "./core.ts";
import type { QrCode } from "./qr.ts";

/** 写真から取り出したシリアル1件と、その行の位置。 */
export interface FoundSerial {
  serial: string;
  conf: number;
  minCharConf: number;
  artist?: string;
  artistSource: ArtistSource;
  line: TextLine;
}

const compact = (s: string) => s.replace(/\s+/g, "");

/**
 * シリアルらしい行か。英大文字と数字だけの10〜20文字で、英字と数字を両方含むものとする。
 * 説明文の中の型番（`SRCL13790` など）は、前後の文字とつながって読まれるため長さで外れる。
 * 英字だけの行は、一緒に写った説明書などの英単語（「OWNERSMANUAL」など）と見分けられないため、
 * ここでは外し、紙の上の位置と形から {@link isLettersOnlySerial} で改めて判断する。
 */
export function isSerial(text: string): boolean {
  const s = compact(text);
  return /^[A-Z0-9]{10,20}$/.test(s) && /[A-Z]/.test(s) && /[0-9]/.test(s);
}

/** 英大文字だけの10〜20文字の行。数字を1つも含まないシリアルの候補。 */
const isLettersOnly = (text: string) => /^[A-Z]{10,20}$/.test(compact(text));

/**
 * シリアルらしい行が1つでもあるか。大きい行だけを読んだ段階で、残りの行も読むかを決めるのに使う。
 * 英字だけの行は数えない。大きな英単語があるだけで、残りの行のシリアルを読まなくなるため。
 */
export const hasSerial = (lines: TextLine[]) => lines.some((l) => isSerial(l.text));

/**
 * 紙に印刷された応募サイトのURLから、アーティスト部分を取り出す。
 * 重なった紙ではURLが途中で切れて読まれるため、末尾の「/」まで読めたものだけを使う。
 * QRコードの中身も同じURL（ドメインは fortunemusic.app のこともある）なので、両方を受け付ける。
 */
export function findArtist(text: string): string | undefined {
  const m = /fortune(?:meets|music)\.app\/([a-z0-9_-]+)\//i.exec(compact(text));
  return m?.[1]?.toLowerCase();
}

/**
 * シリアルから同じ紙のURLまでの距離の上限（シリアルの行の高さの倍数）。
 * 試した写真7枚では、同じ紙のURLは2.3〜3.4倍、上に重ねた別の紙のURLは7.8倍以上離れていた。
 * 縦にずらして重ねた紙では自分のURLが隠れ、上の紙のURLだけが見えるため、広げすぎない。
 */
const SAME_PAPER_RANGE = 5;

/**
 * 同じ紙の上で、シリアルより上にあるURLのアーティストを探す。
 * 紙が回っていても判定できるよう、シリアルの行の向き（u・v）を基準にした座標で比べる。
 */
function artistAbove(serial: TextLine, lines: TextLine[]): string | undefined {
  let best: { artist: string; distance: number } | undefined;
  for (const l of lines) {
    const artist = findArtist(l.text);
    if (!artist) continue;
    // 向きの違う行は別の紙
    if (l.u[0] * serial.u[0] + l.u[1] * serial.u[1] < 0.8) continue;
    const dx = l.center[0] - serial.center[0];
    const dy = l.center[1] - serial.center[1];
    const along = dx * serial.u[0] + dy * serial.u[1];
    const across = dx * serial.v[0] + dy * serial.v[1];
    if (across >= 0 || -across > serial.h * SAME_PAPER_RANGE) continue;
    // 横に並べた隣の紙のURLを拾わないよう、横のずれはシリアルの行の幅より小さく抑える
    if (Math.abs(along) > serial.w * 0.8) continue;
    const distance = -across + Math.abs(along) * 0.5;
    if (!best || distance < best.distance) best = { artist, distance };
  }
  return best?.artist;
}

/**
 * シリアルの右隣にあるQRコードのアーティストを探す。
 * 紙の作りでは、QRコードはシリアルの枠のすぐ右、同じ高さにある。試した紙では、シリアルの行の中心から
 * 右へ行の幅のおよそ1倍、上下のずれは行の高さの半分以内だった。
 */
function artistBeside(serial: TextLine, qrs: QrCode[]): string | undefined {
  let best: { artist: string; distance: number } | undefined;
  for (const qr of qrs) {
    const artist = findArtist(qr.text);
    if (!artist) continue;
    const dx = qr.center[0] - serial.center[0];
    const dy = qr.center[1] - serial.center[1];
    const along = dx * serial.u[0] + dy * serial.u[1];
    const across = dx * serial.v[0] + dy * serial.v[1];
    if (along < serial.w * 0.3 || along > serial.w * 1.6 || Math.abs(across) > serial.h * 2.5) {
      continue;
    }
    const distance = along + Math.abs(across) * 2;
    if (!best || distance < best.distance) best = { artist, distance };
  }
  return best?.artist;
}

/** 最も多く出てくる値。 */
function mode(values: number[]): number | undefined {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

/**
 * 英字だけの行を、数字を含まないシリアルとみなすか。
 * 説明書などの英単語と見分けるため、次のどちらかに当てはまるものだけを拾う。
 * - 紙の上でシリアルがある位置にある（右隣にQRコード、またはすぐ上に応募サイトのURL）
 * - 同じ写真のほかのシリアルと、文字数が同じで文字の高さもほぼ同じ（±25%）
 */
function isLettersOnlySerial(line: TextLine, lines: TextLine[], qrs: QrCode[], strict: TextLine[]) {
  if (artistBeside(line, qrs) || artistAbove(line, lines)) return true;
  const length = mode(strict.map((l) => compact(l.text).length));
  if (length === undefined || compact(line.text).length !== length) return false;
  const heights = strict.map((l) => l.h).sort((a, b) => a - b);
  const median = heights[heights.length >> 1] ?? 0;
  return Math.abs(line.h - median) <= median * 0.25;
}

/**
 * 写真1枚の行とQRコードから、シリアルを読み順（上から、同じ段なら左から）に取り出す。
 * 応募先は、シリアルの右隣のQRコード、同じ紙のURL、写真の中の応募先が1種類ならそれ、の順に決める。
 * QRコードは中身を正確に読めるため、文字認識のURLより先に使う。
 */
export function extractSerials(lines: TextLine[], qrs: QrCode[] = []): FoundSerial[] {
  const strict = lines.filter((l) => isSerial(l.text));
  const serialLines = [
    ...strict,
    ...lines.filter((l) => isLettersOnly(l.text) && isLettersOnlySerial(l, lines, qrs, strict)),
  ];
  const urlArtists = [...lines.map((l) => l.text), ...qrs.map((q) => q.text)].flatMap(
    (t) => findArtist(t) ?? [],
  );
  const canonical = canonicalArtists(urlArtists);
  const photoArtists = new Set(canonical.values());
  // 紙のURLが隠れていても、写真の中の応募先が1種類ならそれとみなす
  const photoArtist = photoArtists.size === 1 ? [...photoArtists][0] : undefined;

  const result: FoundSerial[] = [];
  const seen = new Set<string>();
  for (const line of serialLines) {
    const serial = compact(line.text);
    if (seen.has(serial)) continue;
    seen.add(serial);
    const raw = artistBeside(line, qrs) ?? artistAbove(line, lines);
    let artist = raw && canonical.get(raw);
    let artistSource: ArtistSource = artist ? "paper" : "none";
    if (!artist && photoArtist) {
      artist = photoArtist;
      artistSource = "photo";
    }
    result.push({
      serial,
      conf: line.conf,
      minCharConf: line.minCharConf,
      artist,
      artistSource,
      line,
    });
  }
  // 同じ段とみなす高さの差は、シリアルの文字の高さの2倍まで
  result.sort((a, b) => {
    const dy = a.line.center[1] - b.line.center[1];
    return Math.abs(dy) > a.line.h * 2 ? dy : a.line.center[0] - b.line.center[0];
  });
  return result;
}
