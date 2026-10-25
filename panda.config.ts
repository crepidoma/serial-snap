import { defineConfig, definePreset, defineSemanticTokens, defineTokens } from "@pandacss/dev";
import { preset as pandaPreset } from "@pandacss/preset-panda";

/**
 * 色。地と文字は無彩色、基調色は深い緑にする。応募サイトのミント色（#1CD0AC）より暗く鮮やかさも抑え、
 * 公式と間違われないようにする。暗いテーマ（`data-theme="dark"`）では `_dark` の値になる。
 */
const colors = defineSemanticTokens.colors({
  bg: {
    canvas: { value: { base: "#F5F6F7", _dark: "#111315" } },
    surface: { value: { base: "#FFFFFF", _dark: "#1A1D20" } },
    /** くぼみ・押せない部分 */
    sunken: { value: { base: "#ECEEF0", _dark: "#24282C" } },
  },
  border: {
    DEFAULT: { value: { base: "#D5D9DD", _dark: "#363B41" } },
    /** 入力欄の枠 */
    strong: { value: { base: "#7D858D", _dark: "#7D868F" } },
  },
  fg: {
    DEFAULT: { value: { base: "#16191C", _dark: "#ECEFF2" } },
    muted: { value: { base: "#535B63", _dark: "#A9B1B9" } },
  },
  accent: {
    /** 主なボタンの地。暗いテーマでも白い文字が読める明るさに抑える */
    DEFAULT: { value: { base: "#1D5C42", _dark: "#2A6F50" } },
    hover: { value: { base: "#26704F", _dark: "#33805D" } },
    /** 主なボタンの文字 */
    fg: { value: "#FFFFFF" },
    /** 済み・安心の帯の地 */
    subtle: { value: { base: "#E3EFE8", _dark: "#1E3A2D" } },
    /** 地の上に置く基調色の文字・アイコン */
    text: { value: { base: "#1D5C42", _dark: "#A3CDB6" } },
  },
  warn: {
    DEFAULT: { value: { base: "#8A4B00", _dark: "#FFC670" } },
    subtle: { value: { base: "#FFF1D6", _dark: "#3A2A0C" } },
    border: { value: { base: "#D9952F", _dark: "#B07A22" } },
  },
  /**
   * ほかの読み取りにもあるシリアルの印。「前に扱ったもの」として無彩色にし、直す必要がある注意（warn）の
   * 橙・済み（accent）の緑と見分ける
   */
  seen: {
    DEFAULT: { value: "{colors.fg.muted}" },
    subtle: { value: "{colors.bg.sunken}" },
    border: { value: "{colors.border.strong}" },
  },
  danger: {
    DEFAULT: { value: { base: "#B3261E", _dark: "#FF9B93" } },
    fg: { value: { base: "#FFFFFF", _dark: "#3D0A06" } },
    subtle: { value: { base: "#FCE8E6", _dark: "#3D1917" } },
  },
  focus: { value: { base: "#1F5FD1", _dark: "#8AB4FF" } },
  /** 案内の図の「ここを押す」 */
  highlight: {
    DEFAULT: { value: { base: "#D9480F", _dark: "#FFB25B" } },
    fg: { value: { base: "#FFFFFF", _dark: "#2B1600" } },
  },
  scrim: { value: { base: "rgba(14, 16, 18, 0.55)", _dark: "rgba(0, 0, 0, 0.66)" } },
});

const shadows = defineSemanticTokens.shadows({
  sm: {
    value: { base: "0 1px 2px rgba(16, 19, 22, 0.10)", _dark: "0 1px 2px rgba(0, 0, 0, 0.4)" },
  },
  md: {
    value: { base: "0 6px 20px rgba(16, 19, 22, 0.14)", _dark: "0 6px 20px rgba(0, 0, 0, 0.45)" },
  },
  lg: {
    value: { base: "0 12px 36px rgba(16, 19, 22, 0.30)", _dark: "0 12px 36px rgba(0, 0, 0, 0.6)" },
  },
});

const tokens = defineTokens({
  /** 文字の大きさ。この段階だけを使う。入力欄はiPhoneの自動ズームを防ぐため md（16px）以上にする。 */
  fontSizes: {
    xs: { value: "13px" },
    sm: { value: "14px" },
    md: { value: "16px" },
    lg: { value: "18px" },
    xl: { value: "22px" },
    "2xl": { value: "24px" },
  },
  fonts: {
    body: { value: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif' },
    /** シリアル。0に点が入り、Oと見分けられる IBM Plex Mono を使う */
    mono: { value: '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace' },
  },
  /** 行の高さ。見出し・札は詰め、本文は読みやすく空ける。 */
  lineHeights: {
    tight: { value: "1.3" },
    snug: { value: "1.4" },
    normal: { value: "1.6" },
  },
  radii: {
    sm: { value: "6px" },
    md: { value: "10px" },
    lg: { value: "16px" },
    full: { value: "9999px" },
  },
});

/**
 * 余白などは既定のプリセットを使い、色・書体・文字の大きさ・角丸・影はこのアプリの値だけにする。
 * 既定の色パレットが残ると、トークンを経由しない色が紛れ込むため外す。
 */
const basePreset = definePreset({
  name: "serial-snap-base",
  theme: {
    ...pandaPreset.theme,
    tokens: {
      ...pandaPreset.theme?.tokens,
      colors: {
        current: { value: "currentColor" },
        transparent: { value: "transparent" },
        white: { value: "#ffffff" },
        black: { value: "#000000" },
      },
      fonts: {},
      fontSizes: {},
      lineHeights: {},
      radii: {},
      shadows: {},
    },
  },
});

export default defineConfig({
  presets: ["@pandacss/preset-base", basePreset],
  preflight: true,
  include: ["./src/client/**/*.{ts,tsx}"],
  exclude: [],
  outdir: "styled-system",
  jsxFramework: "react",
  strictTokens: true,
  conditions: {
    extend: {
      // テーマは src/client/lib/theme.ts が <html> の data-theme に置く（端末に合わせる場合も解決して置く）
      dark: '[data-theme="dark"] &',
      hoverable: "@media (hover: hover)",
    },
  },
  theme: {
    extend: {
      tokens,
      semanticTokens: { colors, shadows },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        sheetIn: { from: { transform: "translateY(100%)" }, to: { transform: "none" } },
        // 「スキャン中...」の点を1つずつ出す。同じ周期で、2つ目・3つ目は出し始めを遅らせる
        dot1: { "0%, 24%": { opacity: "0" }, "25%, 100%": { opacity: "1" } },
        dot2: { "0%, 49%": { opacity: "0" }, "50%, 100%": { opacity: "1" } },
        dot3: { "0%, 74%": { opacity: "0" }, "75%, 100%": { opacity: "1" } },
        // 案内の図で「ここを押す」を示す枠を、ゆっくり脈打たせる
        highlightPulse: {
          "0%, 100%": { boxShadow: "0 0 0 3px var(--colors-highlight), 0 0 0 3px transparent" },
          "50%": {
            boxShadow: "0 0 0 3px var(--colors-highlight), 0 0 0 9px rgba(217, 72, 15, 0.25)",
          },
        },
        // パソコンの案内で、ボタンをブックマークバーまでドラッグする動き（下から上へ72px）
        dragToBar: {
          "0%, 15%": { transform: "translateY(0)", opacity: "1" },
          "70%, 88%": { transform: "translateY(-72px)", opacity: "1" },
          "100%": { transform: "translateY(-72px)", opacity: "0" },
        },
        // 使い方の図の動き（デザインのキャンバスに合わせる）。どれもくり返し動かす
        // 撮影の枠が寄って合う
        howtoFrame: {
          "0%, 30%": { transform: "scale(1.08)", opacity: "0.4" },
          "50%, 100%": { transform: "scale(1)", opacity: "1" },
        },
        // 撮ったときの光
        howtoFlash: {
          "0%, 55%": { opacity: "0" },
          "60%": { opacity: "0.85" },
          "75%, 100%": { opacity: "0" },
        },
        // 切り抜きを1文字ずつ見比べる帯
        howtoScan: { from: { left: "0%" }, to: { left: "100%" } },
        // ボタンを押す
        howtoTap: {
          "0%, 60%": { transform: "scale(1)" },
          "75%": { transform: "scale(0.96)" },
          "90%, 100%": { transform: "scale(1)" },
        },
        // コピーの図。始めのほうで押し、押したあとの表示（コピー済み）を長く見せる
        howtoCopyTap: {
          "0%, 20%": { transform: "scale(1)" },
          "30%": { transform: "scale(0.96)" },
          "40%, 100%": { transform: "scale(1)" },
        },
        howtoBeforeTap: { "0%, 30%": { opacity: "1" }, "34%, 100%": { opacity: "0" } },
        howtoAfterTap: { "0%, 30%": { opacity: "0" }, "34%, 100%": { opacity: "1" } },
        // ブックマークレットのパネルが上から出る
        howtoDrop: {
          "0%, 10%": { transform: "translateY(-120%)" },
          "30%, 100%": { transform: "translateY(0)" },
        },
        // 入力欄に文字が入る
        howtoFill: { "0%, 35%": { opacity: "0" }, "50%, 100%": { opacity: "1" } },
        // 確かめた印が付く
        howtoCheck: {
          "0%, 40%": { opacity: "0", transform: "scale(0.6)" },
          "55%, 100%": { opacity: "1", transform: "scale(1)" },
        },
        // 自動で次のステップへ進むまでの残り時間を示す棒
        autoNext: { from: { width: "0%" }, to: { width: "100%" } },
        spin: { to: { transform: "rotate(360deg)" } },
      },
    },
  },
  globalCss: {
    "html, body": {
      bg: "bg.canvas",
      color: "fg",
      fontFamily: "body",
      lineHeight: "normal",
    },
    html: { WebkitTextSizeAdjust: "100%" },
    ":focus-visible": { outline: "3px solid {colors.focus}", outlineOffset: "2px" },
    "button:not(:disabled)": { cursor: "pointer" },
    button: { WebkitTapHighlightColor: "transparent" },
    "@media (prefers-reduced-motion: reduce)": {
      "*, *::before, *::after": {
        animationDuration: "0.01ms !important",
        transitionDuration: "0.01ms !important",
      },
    },
  },
});
