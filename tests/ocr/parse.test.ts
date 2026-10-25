import { describe, expect, it } from "vitest";
import type { TextLine, Vec } from "../../src/ocr/core.ts";
import { extractSerials, findArtist, isSerial } from "../../src/ocr/parse.ts";

/** 写真の中の1行。紙を回した写真も表せるよう、読む向き `u` を指定できる。 */
function line(text: string, center: Vec, h: number, u: Vec = [1, 0]): TextLine {
  const v: Vec = [-u[1], u[0]];
  const w = text.length * h * 0.6;
  const p0: Vec = [center[0] - (u[0] * w + v[0] * h) / 2, center[1] - (u[1] * w + v[1] * h) / 2];
  return { text, conf: 0.99, minCharConf: 0.98, p0, u, v, w, h, center };
}

/** 試作の紙と同じ並び（タイトル・説明文・URL・シリアル・注意書き）の1枚。`y` は紙の上端。 */
function paper(x: number, y: number, artist: string, serial: string): TextLine[] {
  return [
    line("スペシャル抽選応募シリアルナンバー", [x, y + 40], 40),
    line("この度は、ご購入いただき誠にありがとうございます。", [x, y + 190], 22),
    line(`https://ticket.fortunemeets.app/${artist}/`, [x, y + 300], 30),
    line(serial, [x - 60, y + 380], 40),
    line("※裏面の注意事項もご確認ください", [x, y + 440], 20),
  ];
}

describe("isSerial", () => {
  it("英大文字と数字の10〜20文字をシリアルとみなす", () => {
    expect(isSerial("AB12CD34EF56GHX")).toBe(true);
    expect(isSerial("AB12 CD34 EF56GHX")).toBe(true);
    expect(isSerial("SRCL13790")).toBe(false);
    expect(isSerial("TYPE-A(SRCL13790~1)")).toBe(false);
  });

  it("英字だけ・数字だけの行はシリアルとみなさない", () => {
    // 一緒に写った説明書の英単語や、伝票の番号を拾わないため
    expect(isSerial("OWNERSMANUAL")).toBe(false);
    expect(isSerial("012212221791")).toBe(false);
  });
});

describe("findArtist", () => {
  it("末尾の「/」まで読めたURLからアーティストを取り出す", () => {
    expect(findArtist("https://ticket.fortunemeets.app/nogizaka46/")).toBe("nogizaka46");
    // QRコードの中身は fortunemusic.app のこともある
    expect(findArtist("https://ticket.fortunemusic.app/equal-love/")).toBe("equal-love");
  });

  it("途中で切れたURLは使わない", () => {
    expect(findArtist("https://ticket.fortunemeets.app/nogi")).toBeUndefined();
  });
});

describe("extractSerials", () => {
  it("シリアルごとに同じ紙のURLのアーティストを結び付ける", () => {
    const lines = [
      ...paper(500, 0, "nogizaka46", "AAAAAAAAAA1111"),
      ...paper(1300, 0, "hinatazaka46", "BBBBBBBBBB2222"),
    ];
    expect(extractSerials(lines).map((f) => [f.serial, f.artist, f.artistSource])).toEqual([
      ["AAAAAAAAAA1111", "nogizaka46", "paper"],
      ["BBBBBBBBBB2222", "hinatazaka46", "paper"],
    ]);
  });

  it("逆さまの紙でも、その紙のURLを結び付ける", () => {
    // 180°回した紙: 読む向きが左向きで、紙の「上」は写真の下側になる
    const lines = paper(0, 0, "nogizaka46", "CCCCCCCCCC3333").map((l) =>
      line(l.text, [1000 - l.center[0], 1000 - l.center[1]], l.h, [-1, 0]),
    );
    expect(extractSerials(lines)[0]?.artist).toBe("nogizaka46");
  });

  it("URLの読み違いは、写真の中の多数派の表記に寄せる", () => {
    const lines = [
      ...paper(500, 0, "nogizaka46", "DDDDDDDDDD4444"),
      ...paper(1300, 0, "nogizaka46", "EEEEEEEEEE5555"),
      ...paper(2100, 0, "nogi-aka46", "FFFFFFFFFF6666"),
    ];
    expect(extractSerials(lines).map((f) => f.artist)).toEqual([
      "nogizaka46",
      "nogizaka46",
      "nogizaka46",
    ]);
  });

  it("URLが隠れていても、写真の中の応募先が1種類ならそれとみなす", () => {
    const lines = [
      ...paper(500, 0, "nogizaka46", "GGGGGGGGGG7777"),
      line("HHHHHHHHHH8888", [1500, 900], 40),
    ];
    const hidden = extractSerials(lines).find((f) => f.serial === "HHHHHHHHHH8888");
    expect(hidden?.artist).toBe("nogizaka46");
    expect(hidden?.artistSource).toBe("photo");
  });

  it("縦にずらして重ねた紙では、上の紙のURLではなく右隣のQRコードを使う", () => {
    // 上の紙はURLが見えている。下の紙はURLが上の紙に隠れ、シリアルとQRコードだけが見えている
    const lines = [
      ...paper(500, 0, "nogizaka46", "LLLLLLLLLL2222"),
      line("MMMMMMMMMM3333", [440, 640], 40),
    ];
    const lower = lines.find((l) => l.text === "MMMMMMMMMM3333");
    if (!lower) throw new Error("見本の行がありません");
    const qrs = [
      {
        text: "https://ticket.fortunemusic.app/hinatazaka46/",
        center: [440 + lower.w, 640] as Vec,
      },
    ];
    const found = extractSerials(lines, qrs).find((f) => f.serial === "MMMMMMMMMM3333");
    expect(found?.artist).toBe("hinatazaka46");
    expect(found?.artistSource).toBe("paper");
  });

  it("縦にずらして重ねた紙でQRコードも読めなければ、上の紙のURLは使わない", () => {
    const lines = [
      ...paper(500, 0, "nogizaka46", "NNNNNNNNNN4444"),
      ...paper(1300, 0, "hinatazaka46", "OOOOOOOOOO5555"),
      line("PPPPPPPPPP6666", [440, 640], 40),
    ];
    const found = extractSerials(lines).find((f) => f.serial === "PPPPPPPPPP6666");
    expect(found?.artistSource).toBe("none");
  });

  it("英字だけのシリアルも、右隣にQRコードがあれば拾う", () => {
    const lines = [line("QQQQQQQQQQRRRRR", [440, 640], 40)];
    const serial = lines[0];
    if (!serial) throw new Error("見本の行がありません");
    const qrs = [
      { text: "https://ticket.fortunemusic.app/nogizaka46/", center: [440 + serial.w, 640] as Vec },
    ];
    expect(extractSerials(lines, qrs).map((f) => f.serial)).toEqual(["QQQQQQQQQQRRRRR"]);
  });

  it("英字だけのシリアルも、すぐ上に応募サイトのURLがあれば拾う", () => {
    const lines = paper(500, 0, "nogizaka46", "SSSSSSSSSSTTTTT");
    expect(extractSerials(lines).map((f) => f.serial)).toEqual(["SSSSSSSSSSTTTTT"]);
  });

  it("英字だけのシリアルも、ほかのシリアルと文字数と大きさが同じなら拾う", () => {
    const lines = [
      line("AB12CD34EF56GHX", [400, 100], 40),
      line("UUUUUUUUUUVVVVV", [400, 900], 40),
    ];
    expect(extractSerials(lines).map((f) => f.serial)).toEqual([
      "AB12CD34EF56GHX",
      "UUUUUUUUUUVVVVV",
    ]);
  });

  it("一緒に写った説明書などの英単語は拾わない", () => {
    const lines = [
      ...paper(500, 0, "nogizaka46", "AB12CD34EF56GHX"),
      // 文字数が違う英単語
      line("OWNERSMANUAL", [1500, 300], 40),
      // 文字数は同じだが、文字の大きさが違う英単語
      line("INSTRUCTIONSABC", [1500, 700], 80),
    ];
    expect(extractSerials(lines).map((f) => f.serial)).toEqual(["AB12CD34EF56GHX"]);
  });

  it("URLが隠れていて、写真の中の応募先が2種類以上なら応募先不明にする", () => {
    const lines = [
      ...paper(500, 0, "nogizaka46", "IIIIIIIIII9999"),
      ...paper(1300, 0, "hinatazaka46", "JJJJJJJJJJ0000"),
      line("KKKKKKKKKK1111", [900, 1500], 40),
    ];
    const hidden = extractSerials(lines).find((f) => f.serial === "KKKKKKKKKK1111");
    expect(hidden?.artist).toBeUndefined();
    expect(hidden?.artistSource).toBe("none");
  });
});
