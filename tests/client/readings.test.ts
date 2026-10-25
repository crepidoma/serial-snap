import { describe, expect, test } from "vitest";
import { daysLeft, type Reading } from "../../src/client/lib/readings.ts";

const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date(2026, 9, 13, 9, 0).getTime();

function reading(createdAt: number): Reading {
  return { id: "r", createdAt, entries: [] };
}

describe("daysLeft", () => {
  test("読み取った直後は30日", () => {
    expect(daysLeft(reading(T0), T0)).toBe(30);
  });

  test("1日を少しでも過ぎたら29日", () => {
    expect(daysLeft(reading(T0), T0 + DAY + 1)).toBe(29);
  });

  test("消える直前でも0日とは出さない", () => {
    expect(daysLeft(reading(T0), T0 + 30 * DAY - 1)).toBe(1);
    expect(daysLeft(reading(T0), T0 + 31 * DAY)).toBe(1);
  });
});
