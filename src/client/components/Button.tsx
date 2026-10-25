import type { ComponentProps } from "react";
import { cva, cx, type RecipeVariantProps } from "styled-system/css";

/**
 * ボタンの見た目。色と大きさは variant・size で選び、className では上書きしない
 * （同じ指定を2つのクラスで持つと、どちらが勝つかがCSSの並びで変わるため）。
 * className には位置（余白・揃え・幅）だけを渡す。
 */
const button = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2",
    borderRadius: "md",
    borderWidth: "1px",
    borderColor: "transparent",
    fontSize: "md",
    fontWeight: "bold",
    lineHeight: "tight",
    textAlign: "center",
    whiteSpace: "nowrap",
    textDecoration: "none",
    transition: "[background 0.15s]",
    _disabled: { bg: "bg.sunken", color: "fg.muted", borderColor: "border", cursor: "not-allowed" },
  },
  variants: {
    variant: {
      primary: {
        bg: "accent",
        color: "accent.fg",
        _enabled: { _hoverable: { _hover: { bg: "accent.hover" } } },
      },
      secondary: {
        bg: "bg.surface",
        color: "accent.text",
        borderColor: "accent.text",
        _enabled: { _hoverable: { _hover: { bg: "accent.subtle" } } },
      },
      ghost: {
        bg: "transparent",
        color: "accent.text",
        _enabled: { _hoverable: { _hover: { bg: "bg.sunken" } } },
      },
      /** ヘッダーの「？」やメニューなど、文字と同じ色のアイコンのボタン。 */
      plain: {
        bg: "transparent",
        color: "fg",
        _enabled: { _hoverable: { _hover: { bg: "bg.sunken" } } },
      },
      danger: {
        bg: "danger",
        color: "danger.fg",
      },
      /** 一覧の中の「削除」など、枠のない危ない操作。 */
      ghostDanger: {
        bg: "transparent",
        color: "danger",
        _enabled: { _hoverable: { _hover: { bg: "danger.subtle" } } },
      },
    },
    size: {
      /** トップの「撮る」「写真を選ぶ」。アイコンを上、文字を下に置く大きなボタン。 */
      tile: {
        minH: "28",
        flexDirection: "column",
        gap: "2",
        px: "3",
        fontSize: "lg",
        borderRadius: "lg",
      },
      /** 画面の主な操作。 */
      lg: { minH: "16", px: "5", fontSize: "lg", borderRadius: "lg" },
      md: { minH: "12", px: "5" },
      /** 一覧の行の中など、詰めて並べる場所。押せる大きさは44pxを保つ。 */
      sm: { minH: "11", px: "3", fontSize: "sm" },
      /** アイコンだけのボタン。名前は aria-label で付ける。 */
      icon: { w: "11", h: "11", px: "0" },
    },
  },
  defaultVariants: { variant: "secondary", size: "md" },
});

export type ButtonVariants = RecipeVariantProps<typeof button>;

/** ボタン。`type="button"` を既定にする。 */
export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & ButtonVariants) {
  return <button type="button" {...props} className={cx(button({ variant, size }), className)} />;
}

/** ボタンと同じ見た目のリンク（外部のサイトを開くときなど）。 */
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"a"> & ButtonVariants) {
  return <a {...props} className={cx(button({ variant, size }), className)} />;
}
