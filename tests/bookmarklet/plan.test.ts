import { describe, expect, test } from "vitest";
import {
  doneTitle,
  isMismatch,
  lengthIssues,
  pageArtist,
  remaining,
} from "../../src/bookmarklet/plan.ts";

describe("pageArtist", () => {
  test("URLの先頭のパスを応募先とする", () => {
    expect(pageArtist("/nogizaka46/42nd")).toBe("nogizaka46");
    expect(pageArtist("/")).toBeUndefined();
  });
});

describe("isMismatch", () => {
  test("応募先が違えば知らせる", () => {
    expect(isMismatch({ artist: "a", from: 1, to: 1, total: 1 }, "b")).toBe(true);
  });

  test("どちらかが分からなければ違うとしない", () => {
    expect(isMismatch({ from: 1, to: 1, total: 1 }, "b")).toBe(false);
    expect(isMismatch({ artist: "a", from: 1, to: 1, total: 1 }, undefined)).toBe(false);
  });
});

describe("lengthIssues", () => {
  test("入力欄の文字数と違うものを順番付きで返す", () => {
    expect(lengthIssues(["AAAA", "BBB", "CCCC"], 4)).toEqual([{ index: 1, serial: "BBB" }]);
  });

  test("入力欄の文字数が分からなければ判定しない", () => {
    expect(lengthIssues(["AAAA", "BBB"], 0)).toEqual([]);
  });
});

describe("remaining", () => {
  test("残りの件数と次の範囲を返す", () => {
    expect(remaining({ from: 1, to: 10, total: 14 })).toEqual({ count: 4, next: "11〜14" });
    expect(remaining({ from: 1, to: 10, total: 25 })).toEqual({ count: 15, next: "11〜20" });
    expect(remaining({ from: 1, to: 10, total: 11 })).toEqual({ count: 1, next: "11" });
  });

  test("残りがなければ何も返さない", () => {
    expect(remaining({ from: 11, to: 14, total: 14 })).toBeUndefined();
  });
});

describe("doneTitle", () => {
  test("応募先と範囲を見出しにする", () => {
    expect(doneTitle({ artist: "nogizaka46", from: 1, to: 10, total: 14 }, 10)).toBe(
      "nogizaka46の1〜10件目を入力しました",
    );
    expect(doneTitle({ from: 3, to: 3, total: 5 }, 1)).toBe("3件目を入力しました");
  });

  test("目印がない（手で貼り付けた）ときは件数だけ", () => {
    expect(doneTitle(undefined, 2)).toBe("2件を入力しました");
  });
});
