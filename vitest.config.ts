import { defineConfig } from "vitest/config";

/** Node.js で動かす単体テスト。 */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
