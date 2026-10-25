import { describe, expect, test } from "vitest";
import { formatMarker, markerHtml, parseMarker, serialsFromText } from "../../src/shared/marker.ts";

describe("目印", () => {
  test("書いた目印を読み戻せる", () => {
    const m = { artist: "nogizaka46", from: 11, to: 14, total: 14 };
    expect(formatMarker(m)).toBe("シリアルスナップ（nogizaka46 11-14/14）");
    expect(parseMarker(`前の文 ${formatMarker(m)} 後の文`)).toEqual(m);
  });

  test("すぐ後に数字で始まるシリアルナンバーが続いても、全件数を読み違えない", () => {
    const m = { artist: "nogizaka46", from: 1, to: 10, total: 14 };
    expect(parseMarker(`${formatMarker(m)}4K6GTXXBUZAWMCM`)).toEqual(m);
  });

  test("応募先不明も読み戻せる", () => {
    const m = { from: 1, to: 2, total: 2 };
    expect(parseMarker(formatMarker(m))).toEqual({ artist: undefined, ...m });
  });

  test("目印がなければ何も返さない", () => {
    expect(parseMarker("TEST0001ABCDEFG")).toBeUndefined();
  });

  test("HTMLの本文に目印とシリアルナンバーを入れ、記号は文字として扱う", () => {
    const html = markerHtml({ artist: "a<b", from: 1, to: 1, total: 1 }, ["TEST0001ABCDEFG"]);
    expect(html).toContain("a&lt;b");
    expect(html).toContain("<pre>TEST0001ABCDEFG</pre>");
  });
});

describe("serialsFromText", () => {
  test("1行に1件で取り出し、空白・空行・重複を除く", () => {
    expect(serialsFromText("TEST0001ABCDEFG\r\n\n TEST0002 ABCDEFG \nTEST0001ABCDEFG\n")).toEqual([
      "TEST0001ABCDEFG",
      "TEST0002ABCDEFG",
    ]);
  });

  test("英数字以外を含む行は除く", () => {
    expect(serialsFromText("シリアルスナップ（x 1-1/1）\nTEST0001ABCDEFG")).toEqual([
      "TEST0001ABCDEFG",
    ]);
  });
});
