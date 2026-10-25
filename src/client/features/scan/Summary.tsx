import { type ReactNode, useEffect, useState } from "react";
import { css, cx } from "styled-system/css";
import { AppShell } from "../../components/AppShell.tsx";
import { Button } from "../../components/Button.tsx";
import { Icon, type IconName } from "../../components/Icon.tsx";
import { Phrases } from "../../components/Phrases.tsx";
import { AppBar, HeaderActions } from "../../components/TopBar.tsx";
import { navigate } from "../../lib/router.ts";

/** 本文。上から順に並べ、`bottom` は画面の下端に置く。 */
export function Body({ children, bottom }: { children: ReactNode; bottom?: ReactNode }) {
  return (
    <div
      className={css({
        flex: "1",
        display: "flex",
        flexDirection: "column",
        gap: "5",
        px: "4",
        pt: "6",
        pb: "4",
      })}
    >
      {children}
      {bottom && (
        <div className={css({ mt: "auto", display: "grid", gap: "3", pt: "2" })}>{bottom}</div>
      )}
    </div>
  );
}

/** まとめの画面の見出し。 */
export const h1 = css({
  fontSize: "2xl",
  fontWeight: "bold",
  lineHeight: "snug",
});

/** 補足の小さな文字。 */
export const muted = css({ fontSize: "sm", color: "fg.muted" });

/** まとめの画面の共通の形。上に印・見出し・説明、下端にボタンを置く。 */
export function Summary({
  icon,
  tone = "warn",
  title,
  lead,
  children,
  bottom,
  backToTop = true,
}: {
  icon: IconName;
  tone?: "warn" | "danger";
  /** 見出し。狭い画面でも文節の区切りで折り返すよう、文節ごとの配列で渡す */
  title: string[];
  lead: string;
  children?: ReactNode;
  bottom: ReactNode;
  /** 下端に「トップへ戻る」を置くか */
  backToTop?: boolean;
}) {
  return (
    <AppShell header={<AppBar actions={<HeaderActions />} />} fill>
      <Body
        bottom={
          <>
            {bottom}
            {/* ヘッダーに戻るボタンを置かない画面のため、トップへの道をここに残す */}
            {backToTop && (
              <Button variant="ghost" onClick={() => navigate({ name: "top" }, { replace: true })}>
                トップへ戻る
              </Button>
            )}
          </>
        }
      >
        <div className={css({ display: "grid", gap: "3", justifyItems: "start" })}>
          <span
            className={css({
              w: "[72px]",
              h: "[72px]",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "full",
              bg: tone === "warn" ? "warn.subtle" : "danger.subtle",
              color: tone === "warn" ? "warn" : "danger",
            })}
          >
            <Icon name={icon} size={32} />
          </span>
          <h1 className={h1}>
            <Phrases>{title}</Phrases>
          </h1>
          <p className={css({ color: "fg.muted" })}>{lead}</p>
        </div>
        {children}
      </Body>
    </AppShell>
  );
}

/** まとめの画面の、枠で囲んだ一覧。 */
export const card = css({
  display: "grid",
  gap: "3",
  p: "4",
  bg: "bg.surface",
  borderWidth: "1px",
  borderColor: "border",
  borderRadius: "lg",
});

/**
 * 写真の一覧の小さな見本（見つからなかった写真・撮影した写真）。「何枚目」だけでは、どの写真か思い出しにくいため。
 * 開けなかった写真には見本がないため、写真の印を出す。
 */
export function PhotoPreview({
  blob,
  label,
  onOpen,
}: {
  blob?: Blob;
  label: string;
  /** 押したときに写真を大きく見せる。開けなかった写真では渡さない */
  onOpen?: () => void;
}) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  const box = css({
    flex: "none",
    position: "relative",
    w: "16",
    h: "16",
    borderRadius: "md",
    borderWidth: "1px",
    borderColor: "border",
    bg: "bg.sunken",
    overflow: "hidden",
  });
  if (!blob || !url || !onOpen) {
    return (
      <span
        aria-hidden="true"
        className={cx(
          box,
          css({
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "fg.muted",
          }),
        )}
      >
        <Icon name="image" />
      </span>
    );
  }
  return (
    <button type="button" aria-label={`${label}を大きく見る`} onClick={onOpen} className={box}>
      <img src={url} alt="" className={css({ w: "full", h: "full", objectFit: "cover" })} />
      {/* 押すと大きく見られることを示す印 */}
      <span
        aria-hidden="true"
        className={css({
          position: "absolute",
          right: "0.5",
          bottom: "0.5",
          display: "inline-flex",
          p: "0.5",
          borderRadius: "sm",
          bg: "bg.surface",
          color: "fg",
        })}
      >
        <Icon name="zoom" size={14} />
      </span>
    </button>
  );
}
