import { useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";
import { Icon } from "../../components/Icon.tsx";

/**
 * 写真を画面いっぱいに見せる。見つからなかった写真がどれかを確かめるために使う。
 * 写真は選んだファイルをそのまま出す（見本は小さく、拡大すると粗いため）。大きな写真を展開するのは
 * 表示している1枚だけにする。ネイティブの <dialog> を使い、Escキーで閉じられる。
 */
export function PhotoViewer({
  file,
  label,
  onClose,
}: {
  /** 見せる写真。undefined なら閉じる */
  file: File | undefined;
  label: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!file) {
      if (dialog.open) dialog.close();
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    if (!dialog.open) dialog.showModal();
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    // 写真の外側（薄暗い部分）を押したら閉じる。キーボードでは <dialog> の標準の動きでEscキーで閉じられる
    // biome-ignore lint/a11y/useKeyWithClickEvents: キーボードはEscキーで閉じられる
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={css({
        m: "0",
        w: "full",
        h: "dvh",
        maxW: "[none]",
        maxH: "[none]",
        p: "0",
        // 後ろの画面を薄く透かし、写真が浮いて見えるようにする
        bg: "transparent",
        animation: "[fadeIn 0.15s ease-out]",
        "&::backdrop": { bg: "scrim" },
        _motionReduce: { animation: "[none]" },
        "&[open]": { display: "flex", flexDirection: "column" },
      })}
    >
      <div
        className={css({
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: "2",
          pt: "[max(8px, env(safe-area-inset-top))]",
          px: "3",
        })}
      >
        {/* 後ろの画面が透けるため、文字が重ならないよう地を敷く */}
        <span className={css({ flex: "1" })}>
          <b
            className={css({
              display: "inline-block",
              px: "3",
              py: "1",
              borderRadius: "full",
              bg: "bg.surface",
              color: "fg",
              fontSize: "sm",
              boxShadow: "sm",
            })}
          >
            {label}
          </b>
        </span>
        <button
          type="button"
          aria-label="閉じる"
          onClick={onClose}
          className={css({
            w: "11",
            h: "11",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "full",
            bg: "bg.surface",
            color: "fg",
            boxShadow: "sm",
          })}
        >
          <Icon name="close" />
        </button>
      </div>
      {url && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: キーボードはEscキーで閉じられる
        // biome-ignore lint/a11y/noStaticElementInteractions: 写真の周りを押して閉じるための余白
        <div
          onClick={(e) => e.target === e.currentTarget && onClose()}
          className={css({
            flex: "1",
            minH: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: "4",
            pt: "2",
            pb: "[max(16px, env(safe-area-inset-bottom))]",
          })}
        >
          <img
            src={url}
            alt={label}
            className={css({
              maxW: "full",
              maxH: "full",
              objectFit: "contain",
              borderRadius: "md",
              boxShadow: "lg",
            })}
          />
        </div>
      )}
    </dialog>
  );
}
