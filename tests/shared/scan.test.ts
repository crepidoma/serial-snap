import { describe, expect, it } from "vitest";
import { canonicalArtists, isSameArtist, similarity } from "../../src/shared/scan.ts";

describe("similarity", () => {
  it("同じ文字列は1、1文字違いは長さに応じて下がる", () => {
    expect(similarity("ABCD", "ABCD")).toBe(1);
    expect(similarity("ABCD", "ABCE")).toBe(0.75);
    expect(similarity("", "ABCD")).toBe(0);
  });
});

describe("isSameArtist", () => {
  it("URLの1文字の読み違いは同じアーティストとみなす", () => {
    expect(isSameArtist("nogizaka46", "nogi-aka46")).toBe(true);
  });

  it("似た名前の別のアーティストを見分ける", () => {
    expect(isSameArtist("hinatazaka46", "nogizaka46")).toBe(false);
    expect(isSameArtist("sakurazaka46", "hinatazaka46")).toBe(false);
  });
});

describe("canonicalArtists", () => {
  it("読み違えた表記を、最も多く読まれた表記に寄せる", () => {
    const map = canonicalArtists(["nogizaka46", "nogi-aka46", "nogizaka46", "hinatazaka46"]);
    expect(map.get("nogi-aka46")).toBe("nogizaka46");
    expect(map.get("nogizaka46")).toBe("nogizaka46");
    expect(map.get("hinatazaka46")).toBe("hinatazaka46");
  });
});
