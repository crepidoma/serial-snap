import { type ReactNode, useState } from "react";
import { css } from "styled-system/css";
import { AppShell } from "../../components/AppShell.tsx";
import { Button } from "../../components/Button.tsx";
import { DeleteDialog } from "../../components/DeleteDialog.tsx";
import { Icon, type IconName } from "../../components/Icon.tsx";
import { showToast } from "../../components/Toast.tsx";
import { HelpButton, TopBar } from "../../components/TopBar.tsx";
import { removeAllReadings, useReadings } from "../../lib/readings.ts";
import { goBack, navigate, type Route } from "../../lib/router.ts";
import { setThemeSetting, type ThemeSetting, useThemeSetting } from "../../lib/theme.ts";

const THEMES: { value: ThemeSetting; label: string }[] = [
  { value: "system", label: "端末に合わせる" },
  { value: "light", label: "明るい" },
  { value: "dark", label: "暗い" },
];

const row = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  w: "full",
  minH: "14",
  px: "4",
  bg: "bg.surface",
  borderBottomWidth: "1px",
  borderColor: "border",
  fontWeight: "bold",
  textAlign: "left",
  _hoverable: { _hover: { bg: "bg.sunken" } },
});

/** 別の画面へ移るメニューの1行。 */
function MenuLink({ icon, to, children }: { icon: IconName; to: Route; children: ReactNode }) {
  return (
    <button type="button" className={row} onClick={() => navigate(to)}>
      <Icon name={icon} />
      <span className={css({ flex: "1" })}>{children}</span>
      <span className={css({ display: "inline-flex", color: "fg.muted" })}>
        <Icon name="chevronRight" size={18} />
      </span>
    </button>
  );
}

/** テーマの切り替え（端末に合わせる・明るい・暗い）。 */
function ThemePicker() {
  const theme = useThemeSetting();
  return (
    <div
      className={css({
        display: "grid",
        gap: "2.5",
        px: "4",
        py: "3.5",
        bg: "bg.surface",
        borderBottomWidth: "1px",
        borderColor: "border",
      })}
    >
      <span
        className={css({ display: "flex", alignItems: "center", gap: "3", fontWeight: "bold" })}
      >
        <Icon name="theme" />
        テーマ
      </span>
      <fieldset
        className={css({ display: "flex", gap: "1", p: "1", borderRadius: "md", bg: "bg.sunken" })}
      >
        <legend className={css({ srOnly: true })}>テーマ</legend>
        {THEMES.map((t) => {
          const on = t.value === theme;
          return (
            <label
              key={t.value}
              className={css({
                flex: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minH: "10",
                px: "1",
                borderRadius: "sm",
                fontSize: "sm",
                fontWeight: "bold",
                cursor: "pointer",
                color: on ? "fg" : "fg.muted",
                bg: on ? "bg.surface" : "transparent",
                boxShadow: on ? "sm" : "[none]",
                "&:has(:focus-visible)": {
                  outlineWidth: "[3px]",
                  outlineStyle: "solid",
                  outlineColor: "focus",
                },
              })}
            >
              <input
                type="radio"
                name="theme"
                value={t.value}
                checked={on}
                onChange={() => setThemeSetting(t.value)}
                className={css({ srOnly: true })}
              />
              {t.label}
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}

/** メニュー。案内・これまでのスキャン・テーマ・このアプリについて・すべて削除。 */
export function MenuPage() {
  const readings = useReadings();
  const [confirming, setConfirming] = useState(false);
  const serialCount = readings.reduce((n, r) => n + r.entries.length, 0);

  return (
    <AppShell
      header={
        <TopBar
          title="メニュー"
          actions={
            <>
              <HelpButton />
              <Button variant="plain" size="icon" aria-label="閉じる" onClick={goBack}>
                <Icon name="close" />
              </Button>
            </>
          }
        />
      }
      fill
    >
      <nav
        aria-label="メニュー"
        className={css({ mt: "3", borderTopWidth: "1px", borderColor: "border" })}
      >
        <MenuLink icon="help" to={{ name: "howto" }}>
          使い方
        </MenuLink>
        <MenuLink icon="bookmark" to={{ name: "addBookmarklet" }}>
          ブックマークレットの追加
        </MenuLink>
        <MenuLink icon="clipboard" to={{ name: "pasteGuide" }}>
          貼り付けの手順
        </MenuLink>
        <MenuLink icon="history" to={{ name: "history" }}>
          これまでのスキャン
        </MenuLink>
        <ThemePicker />
        <MenuLink icon="info" to={{ name: "about" }}>
          このアプリについて
        </MenuLink>
      </nav>
      <div className={css({ mt: "6", borderTopWidth: "1px", borderColor: "border" })}>
        <button
          type="button"
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "3",
            w: "full",
            minH: "14",
            px: "4",
            bg: "bg.surface",
            borderBottomWidth: "1px",
            borderColor: "border",
            fontWeight: "bold",
            color: "danger",
            _hoverable: { _enabled: { _hover: { bg: "danger.subtle" } } },
            _disabled: { color: "fg.muted", cursor: "not-allowed" },
          })}
          disabled={readings.length === 0}
          onClick={() => setConfirming(true)}
        >
          <Icon name="trash" />
          すべて削除
        </button>
      </div>
      <p
        className={css({
          mt: "auto",
          px: "4",
          pt: "6",
          fontSize: "xs",
          color: "fg.muted",
        })}
      >
        非公式の無料ツールです。
      </p>
      <DeleteDialog
        open={confirming}
        title="すべて削除しますか？"
        what={`スキャン${readings.length}回分(シリアルナンバー${serialCount}件)を、この端末から削除します。`}
        keep="ブックマークレットと、応募サイトに登録した内容は消えません。"
        action="すべて削除"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          removeAllReadings();
          setConfirming(false);
          showToast("すべて削除しました");
        }}
      />
    </AppShell>
  );
}
