import { describe, expect, test } from "vitest";
import { commonLength, issueOf, seenNotice, sightings } from "../../src/client/lib/checks.ts";
import { formatDateTime, formatRecentDateTime } from "../../src/client/lib/format.ts";
import type { Reading, SerialEntry } from "../../src/client/lib/readings.ts";

// 架空のシリアル
function entry(serial: string, patch: Partial<SerialEntry> = {}): SerialEntry {
  return {
    id: serial,
    serial,
    artistSource: "paper",
    conf: 0.99,
    minCharConf: 0.95,
    copied: false,
    thumb: new Blob(),
    ...patch,
  };
}

function reading(id: string, createdAt: number, entries: SerialEntry[]): Reading {
  return { id, createdAt, entries };
}

// 「今日」の判定に掛からないよう、テストを動かす日より前の日にする
const DAY1 = new Date(2025, 9, 12, 21, 30).getTime();
const DAY2 = new Date(2026, 9, 13, 9, 5).getTime();

describe("commonLength", () => {
  test("過半数の文字数を返す", () => {
    expect(commonLength([entry("AAAA1111"), entry("BBBB2222"), entry("CCC333")])).toBe(8);
  });

  test("2件未満では多数派と言えないため返さない", () => {
    expect(commonLength([entry("AAAA1111")])).toBeUndefined();
  });
});

describe("sightings", () => {
  test("今の読み取りは数えない", () => {
    const map = sightings([reading("now", DAY2, [entry("TEST0001AB")])], "now");
    expect(map.size).toBe(0);
  });

  test("コピー済みの読み取りを、より新しい読み取りより優先する", () => {
    const map = sightings(
      [
        reading("now", DAY2 + 1, [entry("TEST0001AB")]),
        reading("newer", DAY2, [entry("TEST0001AB")]),
        reading("older", DAY1, [entry("TEST0001AB", { copied: true })]),
      ],
      "now",
    );
    expect(map.get("TEST0001AB")).toEqual({ createdAt: DAY1, copied: true });
  });

  test("どれもコピーしていなければ、より新しい読み取りを選ぶ", () => {
    const map = sightings(
      [
        reading("older", DAY1, [entry("TEST0001AB")]),
        reading("newer", DAY2, [entry("TEST0001AB")]),
      ],
      "now",
    );
    expect(map.get("TEST0001AB")?.createdAt).toBe(DAY2);
  });
});

describe("issueOf", () => {
  test("文字数がほかと違えば知らせる", () => {
    expect(issueOf(entry("TEST0001A"), 10)?.kind).toBe("length");
  });

  test("確信度が低ければ、間違えやすい文字の組を添える", () => {
    const issue = issueOf(entry("TEST0001AB", { conf: 0.5 }), 10);
    expect(issue?.kind).toBe("lowConfidence");
    expect(issue?.text).toContain("0とO");
  });

  test("問題がなければ何も返さない", () => {
    expect(issueOf(entry("TEST0001AB"), 10)).toBeUndefined();
  });
});

describe("seenNotice", () => {
  test("ほかの読み取りでコピー済みなら、その日時とコピー済みを伝える", () => {
    expect(seenNotice({ createdAt: DAY1, copied: true })?.text).toBe(
      "2025/10/12 21:30:00 にコピー済み",
    );
  });

  test("コピーしていなければ、ほかにもスキャンされたことを伝える", () => {
    expect(seenNotice({ createdAt: DAY1, copied: false })?.text).toBe(
      "2025/10/12 21:30:00 にもスキャンされました",
    );
  });

  test("ほかの読み取りになければ何も返さない", () => {
    expect(seenNotice(undefined)).toBeUndefined();
  });
});

describe("formatDateTime", () => {
  test("年月日と時刻を出す", () => {
    expect(formatDateTime(DAY2)).toBe("2026/10/13 09:05:00");
  });
});

describe("formatRecentDateTime", () => {
  test("今日なら日付を「今日」にする", () => {
    expect(formatRecentDateTime(DAY2, DAY2 + 60_000)).toBe("今日 09:05:00");
  });

  test("今日でなければ年月日を出す", () => {
    expect(formatRecentDateTime(DAY1, DAY2)).toBe("2025/10/12 21:30:00");
  });
});
