import type { ReactNode } from "react";
import { css, cx } from "styled-system/css";
import { navigate } from "../lib/router.ts";
import { column } from "./AppShell.tsx";
import { Button } from "./Button.tsx";
import { Icon } from "./Icon.tsx";
import { Logo } from "./Logo.tsx";

/**
 * ヘッダーの1段目。左に戻る、中央に題、右に操作を置く。
 * @param back 戻るボタンの押したときの動きと、読み上げの名前
 * @param sub 題の下に小さく添える文（「あと29日で削除」など）
 * @param compact 題を一段小さくする（読み取り結果の日時のように、長い題で右の操作と並べるとき）
 * @param heading 題をページの見出し（h1）にする。本文に見出しのない画面（トップ）で使う
 */
export function TopBar({
  title,
  sub,
  leading,
  back,
  actions,
  compact = false,
  heading = false,
}: {
  title: ReactNode;
  sub?: ReactNode;
  /** 題の左に置くもの（トップのロゴマーク） */
  leading?: ReactNode;
  back?: { label: string; onClick: () => void };
  actions?: ReactNode;
  compact?: boolean;
  heading?: boolean;
}) {
  const Title = heading ? "h1" : "span";
  return (
    <div
      className={cx(
        column,
        css({
          h: "14",
          display: "flex",
          alignItems: "center",
          gap: "2",
          pl: back ? "1" : "4",
          pr: "1",
        }),
      )}
    >
      {back && (
        <button
          type="button"
          aria-label={back.label}
          onClick={back.onClick}
          className={css({
            w: "11",
            h: "11",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "md",
            color: "fg",
            _hoverable: { _hover: { bg: "bg.sunken" } },
          })}
        >
          <Icon name="chevronLeft" />
        </button>
      )}
      {leading}
      <div className={css({ flex: "1", minW: "0", display: "flex", flexDirection: "column" })}>
        <div className={css({ display: "flex", alignItems: "center", gap: "2" })}>
          <Title
            className={css({
              fontSize: compact ? "md" : "lg",
              fontWeight: "bold",
              lineHeight: "tight",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            })}
          >
            {title}
          </Title>
        </div>
        {sub && (
          <span className={css({ fontSize: "xs", color: "fg.muted", lineHeight: "tight" })}>
            {sub}
          </span>
        )}
      </div>
      {actions}
    </div>
  );
}

/** ヘッダーの「？」（使い方）のボタン。 */
export function HelpButton() {
  return (
    <Button
      variant="plain"
      size="icon"
      aria-label="使い方"
      onClick={() => navigate({ name: "howto" })}
    >
      <Icon name="help" />
    </Button>
  );
}

/** ヘッダーの「？」とメニューのボタン。 */
export function HeaderActions() {
  return (
    <>
      <HelpButton />
      <Button
        variant="plain"
        size="icon"
        aria-label="メニュー"
        onClick={() => navigate({ name: "menu" })}
      >
        <Icon name="menu" />
      </Button>
    </>
  );
}

/**
 * アプリの名前のヘッダー。トップと、読み取り中・まとめの画面のように、
 * 画面の名前を題にしない（本文の見出しで示す）画面で使う。
 * @param actions 右に置く操作。スキャン中は画面を離れないよう置かない
 * @param heading アプリの名前をページの見出し（h1）にする。トップで使う（検索エンジンがページの主題として読む）
 */
export function AppBar({ actions, heading }: { actions?: ReactNode; heading?: boolean }) {
  return (
    <TopBar
      title="シリアルスナップ"
      sub="forTUNE meets非公式ツール"
      leading={<Logo />}
      actions={actions}
      heading={heading}
    />
  );
}

/** 「写真もシリアルナンバーも、この端末の外へ送りません」の帯。トップと読み取り結果に出す。 */
export function PrivacyBand() {
  return (
    <div className={css({ bg: "accent.subtle", color: "accent.text" })}>
      <div
        className={cx(
          column,
          css({
            display: "flex",
            alignItems: "center",
            gap: "2",
            minH: "9",
            px: "4",
            py: "1.5",
            fontSize: "xs",
            fontWeight: "bold",
            lineHeight: "snug",
          }),
        )}
      >
        <Icon name="lock" size={18} />
        {/* 幅の狭い端末では、文の途中ではなく読点の後で折り返す */}
        <span>
          <span className={css({ display: "inline-block" })}>写真もシリアルナンバーも、</span>
          <span className={css({ display: "inline-block" })}>この端末の外へ送りません</span>
        </span>
      </div>
    </div>
  );
}
