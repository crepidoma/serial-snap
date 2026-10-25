// コピーに付ける目印。アプリ（書く側）とブックマークレット（読む側）で同じ形を使う。
// ブラウザはクリップボードのHTMLを読み出すときに属性やmetaを取り除くことがあるため、目印は本文の文字として入れる。

/** コピーしたシリアルナンバーが、どの応募先の何件目か。 */
export interface CopyMarker {
  /** 応募サイトのURLのアーティスト部分。応募先不明なら undefined */
  artist?: string;
  /** 何件目から（1から数える） */
  from: number;
  /** 何件目まで */
  to: number;
  /** 応募先のシリアルナンバーの全件数 */
  total: number;
}

const LABEL = "シリアルスナップ";
/** 応募先不明を表す文字。アーティスト部分には使われない */
const UNKNOWN = "-";
// 閉じ括弧で終わりを示す。HTMLの本文を取り出すと次の行（シリアルナンバー）とつながり、
// 数字で始まるシリアルナンバーが全件数の続きに読まれてしまうため
const PATTERN = new RegExp(`${LABEL}（(\\S+) (\\d+)-(\\d+)/(\\d+)）`);

/** 目印の1行（例: `シリアルスナップ（nogizaka46 1-10/14）`）。 */
export function formatMarker(m: CopyMarker): string {
  return `${LABEL}（${m.artist ?? UNKNOWN} ${m.from}-${m.to}/${m.total}）`;
}

/** 文字の中から目印を探す。見つからなければ undefined。 */
export function parseMarker(text: string): CopyMarker | undefined {
  const m = PATTERN.exec(text);
  if (!m) return undefined;
  const [, artist, from, to, total] = m;
  return {
    artist: artist === UNKNOWN ? undefined : artist,
    from: Number(from),
    to: Number(to),
    total: Number(total),
  };
}

/**
 * コピーしたときのHTML。目印の1行と、シリアルナンバーの並びを入れる。
 * メモアプリなどへ貼り付けたときにも、何のコピーか分かるようにする。
 */
export function markerHtml(m: CopyMarker, serials: string[]): string {
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<p>${escapeHtml(formatMarker(m))}</p><pre>${serials.map(escapeHtml).join("\n")}</pre>`;
}

/** 貼り付けられた文字からシリアルナンバーの候補を取り出す。1行に1件、空白は除き、重複はまとめる。 */
export function serialsFromText(text: string): string[] {
  const list = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s/g, ""))
    .filter((line) => /^[A-Za-z0-9]{4,}$/.test(line));
  return [...new Set(list)];
}
