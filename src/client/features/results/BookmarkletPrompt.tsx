import { css } from "styled-system/css";
import { Button } from "../../components/Button.tsx";
import { Icon } from "../../components/Icon.tsx";
import { Phrases } from "../../components/Phrases.tsx";
import { markBookmarkletInstalled } from "../../lib/bookmarklet.ts";
import { navigate } from "../../lib/router.ts";

/**
 * 初めてコピーしたときの「貼り付けにはブックマークレットを使います」。下端の帯のすぐ上に出す。
 * 「追加済み」を押すか、ブックマークレットがアプリの画面で動いたら、以後は出さない。
 */
export function BookmarkletPrompt({ onClose }: { onClose: () => void }) {
  return (
    <section
      aria-label="ブックマークレットの案内"
      className={css({
        position: "fixed",
        left: "3",
        right: "3",
        bottom: "[calc(max(12px, env(safe-area-inset-bottom)) + 76px)]",
        zIndex: "10",
        maxW: "[536px]",
        mx: "auto",
        display: "grid",
        gap: "3",
        p: "4",
        bg: "bg.surface",
        borderWidth: "1px",
        borderColor: "border",
        borderRadius: "lg",
        boxShadow: "lg",
        animation: "[fadeIn 0.15s ease-out]",
      })}
    >
      <div
        className={css({
          display: "flex",
          gap: "2.5",
          alignItems: "flex-start",
          "& > svg": { flex: "none", color: "accent.text" },
        })}
      >
        <Icon name="bookmark" />
        <div className={css({ display: "grid", gap: "0.5" })}>
          <b>
            <Phrases>{["貼り付けには", "ブックマークレットを", "使います"]}</Phrases>
          </b>
          <span className={css({ fontSize: "sm", color: "fg.muted" })}>
            最初に一度のみ追加が必要です。
          </span>
        </div>
      </div>
      <div className={css({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2" })}>
        <Button
          onClick={() => {
            markBookmarkletInstalled();
            onClose();
          }}
        >
          追加済み
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            onClose();
            navigate({ name: "addBookmarklet" });
          }}
        >
          追加方法を見る
        </Button>
      </div>
      <p className={css({ fontSize: "xs", color: "fg.muted" })}>
        「追加済み」を押すと、次回から表示しません。
      </p>
    </section>
  );
}
