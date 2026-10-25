import { css, cx } from "styled-system/css";
import { Icon } from "../../components/Icon.tsx";
import type { SerialIssue } from "../../lib/checks.ts";
import type { SerialEntry } from "../../lib/readings.ts";
import { Thumb } from "./Thumb.tsx";

const rowButton = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1",
  minH: "11",
  px: "2",
  borderRadius: "md",
  borderWidth: "1px",
  fontSize: "sm",
  fontWeight: "bold",
  whiteSpace: "nowrap",
});

const noteLine = css({
  display: "flex",
  // 2行に折り返したとき、印を1行目の横に置く
  alignItems: "flex-start",
  gap: "1",
  fontSize: "xs",
  fontWeight: "bold",
  // 印の高さを1行分にし、文字の1行目の真ん中にそろえる（上端そろえだと文字より上にずれて見える）
  "& > svg": { flex: "none", h: "[1lh]" },
  // 「日時 にもスキャンされました」を語の途中で折り返さず、空白で折り返す。空白のない一言は端で折り返す
  wordBreak: "keep-all",
  overflowWrap: "anywhere",
});

/**
 * シリアル1件の行。左に写真の切り抜き（上）と読み取った文字（下）を並べて、1文字ずつ見比べられるようにする。
 * 右に「コピー」「修正」を置く。読み違いの疑いは橙、ほかの読み取りにもあることは灰色の地と一言で知らせ、
 * 両方あれば橙の地に両方の一言を出す（直す必要がある方を優先して目立たせる）。
 */
export function SerialRow({
  entry,
  index,
  issue,
  seen,
  onCopy,
  onEdit,
}: {
  entry: SerialEntry;
  index: number;
  /** 読み違いの疑い */
  issue?: SerialIssue;
  /** ほかの読み取りにもあることの知らせ */
  seen?: SerialIssue;
  onCopy: () => void;
  onEdit: () => void;
}) {
  return (
    <li
      className={css({
        display: "grid",
        // ボタンの列は「コピー済み」に合わせた固定幅にする。コピーで幅が変わり、シリアルの折り返しがずれないように
        gridTemplateColumns: "[auto 1fr 108px]",
        alignItems: "center",
        columnGap: "3",
        px: "4",
        py: "3",
        borderBottomWidth: "1px",
        borderColor: "border",
        bg: issue ? "warn.subtle" : seen ? "seen.subtle" : "bg.surface",
      })}
    >
      <span
        className={css({
          minW: "6",
          textAlign: "right",
          fontSize: "sm",
          fontWeight: "bold",
          color: "fg.muted",
        })}
      >
        {index + 1}
      </span>
      <div className={css({ minW: "0", display: "grid", gap: "1" })}>
        <Thumb blob={entry.thumb} />
        <span
          className={css({
            fontFamily: "mono",
            // 15文字のシリアルが、幅390pxの画面で1行に収まる大きさ
            fontSize: "lg",
            fontWeight: "medium",
            letterSpacing: "wide",
            lineHeight: "tight",
            overflowWrap: "anywhere",
          })}
        >
          {entry.serial}
        </span>
        {issue && (
          <span className={cx(noteLine, css({ color: "warn" }))}>
            <Icon name="warn" size={16} />
            {issue.text}
          </span>
        )}
        {seen && (
          <span className={cx(noteLine, css({ color: "seen" }))}>
            <Icon name="history" size={16} />
            {seen.text}
          </span>
        )}
      </div>
      <div className={css({ display: "grid", gap: "1.5" })}>
        <button
          type="button"
          onClick={onCopy}
          aria-label={
            entry.copied
              ? `${index + 1}件目はコピー済み。もう一度コピー`
              : `${index + 1}件目をコピー`
          }
          className={cx(
            rowButton,
            entry.copied
              ? css({ color: "accent.text", borderColor: "accent.subtle", bg: "accent.subtle" })
              : css({ color: "accent.text", borderColor: "accent.text", bg: "bg.surface" }),
          )}
        >
          <Icon name={entry.copied ? "check" : "copy"} size={18} />
          {entry.copied ? "コピー済み" : "コピー"}
        </button>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`${index + 1}件目を修正`}
          className={cx(
            rowButton,
            css({ color: "fg", borderColor: "border.strong", bg: "bg.surface" }),
          )}
        >
          <Icon name="edit" size={18} />
          修正
        </button>
      </div>
    </li>
  );
}
