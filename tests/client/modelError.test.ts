import { describe, expect, test } from "vitest";
import { describeModelError } from "../../src/client/lib/modelError.ts";

describe("describeModelError", () => {
  test("ブラウザごとの通信の失敗を、通信できなかったと言い換える", () => {
    expect(describeModelError("TypeError: Failed to fetch")).toBe("通信できませんでした");
    expect(describeModelError("TypeError: network error")).toBe("通信できませんでした");
    expect(describeModelError("TypeError: Load failed")).toBe("通信できませんでした");
    expect(describeModelError("TypeError: NetworkError when attempting to fetch resource.")).toBe(
      "通信できませんでした",
    );
  });

  test("HTTPの状態が分かるときは添える", () => {
    expect(describeModelError("Error: 読み込みに失敗しました（404）")).toBe(
      "データを取得できませんでした(HTTP 404)",
    );
  });

  test("ほかの失敗は、データを読み込めなかったとする", () => {
    expect(describeModelError("RuntimeError: Aborted()")).toBe("データを読み込めませんでした");
  });
});
