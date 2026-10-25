import { useEffect, useRef } from "react";
import { css } from "styled-system/css";
import { Button } from "./Button.tsx";

/**
 * 削除の確認。画面の中央に出し、何が消えるかと「元に戻せません。」、消えないものを書く。
 * ネイティブの <dialog> を使い、フォーカスの移動とEscキーをブラウザに任せる。
 */
export function DeleteDialog({
  open,
  title,
  what,
  keep,
  action,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  /** 何を削除するか（「〜を削除します。」まで）。後ろに「元に戻せません。」を続ける */
  what: string;
  /** 消えないもの（「ほかの読み取りは消えません。」など） */
  keep: string;
  /** 削除のボタンの文字 */
  action: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-text"
      onClose={onCancel}
      className={css({
        m: "auto",
        w: "[calc(100% - 32px)]",
        maxW: "[400px]",
        p: "0",
        bg: "bg.surface",
        color: "fg",
        borderRadius: "lg",
        boxShadow: "lg",
        animation: "[fadeIn 0.15s ease-out]",
        "&::backdrop": { bg: "scrim", animation: "[fadeIn 0.15s ease-out]" },
        _motionReduce: { animation: "[none]", "&::backdrop": { animation: "[none]" } },
      })}
    >
      <div className={css({ display: "grid", gap: "3", px: "6", pt: "6" })}>
        <h2
          id="delete-dialog-title"
          className={css({ fontSize: "xl", fontWeight: "bold", lineHeight: "snug" })}
        >
          {title}
        </h2>
        <p id="delete-dialog-text" className={css({ lineHeight: "normal" })}>
          {what}
          {/* 「元に戻せません。」の途中で折り返さず、入りきらなければ次の行へまとめて送る */}
          <b className={css({ display: "inline-block" })}>元に戻せません。</b>
        </p>
        <p className={css({ fontSize: "sm", color: "fg.muted" })}>{keep}</p>
      </div>
      <div className={css({ display: "flex", gap: "2.5", px: "6", pt: "7", pb: "6" })}>
        <Button className={css({ flex: "1" })} onClick={onCancel}>
          キャンセル
        </Button>
        <Button variant="danger" className={css({ flex: "1" })} onClick={onConfirm}>
          {action}
        </Button>
      </div>
    </dialog>
  );
}
