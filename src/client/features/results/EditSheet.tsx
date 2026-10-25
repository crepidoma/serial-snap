import { useEffect, useRef, useState } from "react";
import { css, cx } from "styled-system/css";
import { BottomSheet } from "../../components/BottomSheet.tsx";
import { Button } from "../../components/Button.tsx";
import { Icon } from "../../components/Icon.tsx";
import { showToast } from "../../components/Toast.tsx";
import type { SerialIssue } from "../../lib/checks.ts";
import { removeSerial, type SerialEntry, updateSerial } from "../../lib/readings.ts";
import { Thumb } from "./Thumb.tsx";

/** 修正するシリアル。`index` は応募先の中での順番（0から）。 */
export interface EditTarget {
  entry: SerialEntry;
  index: number;
  /** 読み違いの疑い */
  issue?: SerialIssue;
  /** ほかの読み取りにもあることの知らせ */
  seen?: SerialIssue;
}

/** 注意の種類ごとの、修正のシートで添える説明。 */
const ISSUE_ADVICE: Record<SerialIssue["kind"], string> = {
  chars: "写真と見比べて、正しい文字に直してください。",
  length: "写真と見比べて、正しい文字に直してください。",
  seen: "すでに応募サイトへ登録していると、登録の失敗になります。登録済みなら削除してください。",
  lowConfidence: "写真と見比べてください。合っていれば、そのまま保存するとこの印は消えます。",
};

/** キーボードが開き終わるまでの待ち時間。iPhoneでは開く動きが0.3秒ほどかかる。 */
const KEYBOARD_SETTLE_MS = 350;

/** 間違えやすい文字。見本として並べ、読み方を添える。 */
const LOOKALIKES = [
  { char: "0", name: "ゼロ" },
  { char: "O", name: "オー" },
  { char: "1", name: "イチ" },
  { char: "I", name: "アイ" },
];

const notice = css({
  display: "flex",
  gap: "2",
  p: "3",
  borderRadius: "md",
  borderWidth: "1px",
  fontSize: "sm",
  // 印の高さを1行分にし、見出しの行の真ん中にそろえる
  "& > svg": { flex: "none", h: "[1lh]" },
});

/** シリアルの修正・削除を行う、下から出るシート。 */
export function EditSheet({
  readingId,
  target,
  groupLabel,
  length,
  onClose,
}: {
  readingId: string;
  target: EditTarget | undefined;
  /** 応募先の名前（バッジに出す） */
  groupLabel: string;
  /** 同じ応募先のシリアルの、最も多い文字数 */
  length: number | undefined;
  onClose: () => void;
}) {
  // 閉じるアニメーションの間も中身を出しておくため、最後に開いたものを覚えておく
  const [shown, setShown] = useState(target);
  if (target && target !== shown) setShown(target);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!target) return;
    setValue(target.entry.serial);
    setError("");
    setConfirmDelete(false);
  }, [target]);

  const save = () => {
    if (!shown) return;
    // 応募サイトのシリアルは大文字のため、入力した小文字をそろえる
    const serial = value.replace(/\s/g, "").toUpperCase();
    if (!serial) return setError("シリアルナンバーを入力してください。");
    if (updateSerial(readingId, shown.entry.id, serial) === "duplicate") {
      return setError("同じシリアルナンバーがこのスキャンにすでにあります。");
    }
    showToast("保存しました");
    onClose();
  };

  const remove = () => {
    if (!shown) return;
    removeSerial(readingId, shown.entry.id);
    showToast("削除しました");
    onClose();
  };

  const typed = value.replace(/\s/g, "").length;
  const title = shown ? `${shown.index + 1}件目の修正` : "";

  return (
    <BottomSheet
      open={!!target}
      title={title}
      onClose={onClose}
      aside={
        <span
          className={css({
            fontSize: "xs",
            fontWeight: "bold",
            px: "2.5",
            py: "0.5",
            borderRadius: "full",
            bg: "bg.sunken",
          })}
        >
          {groupLabel}
        </span>
      }
    >
      {shown && (
        <form
          method="dialog"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className={css({
            display: "grid",
            gap: "4",
            px: "4",
            pb: "[max(16px, env(safe-area-inset-bottom))]",
          })}
        >
          <div ref={photoRef} className={css({ display: "grid", gap: "1.5" })}>
            <span className={css({ fontSize: "sm", fontWeight: "bold" })}>写真</span>
            <Thumb blob={shown.entry.thumb} large />
          </div>

          <div className={css({ display: "grid", gap: "1.5" })}>
            <label htmlFor="serial-input" className={css({ fontSize: "sm", fontWeight: "bold" })}>
              読み取った文字
            </label>
            <input
              id="serial-input"
              value={value}
              onFocus={() => {
                // キーボードが開いて見える高さが縮んだあと、写真の切り抜きがシートの上端に来るようにする
                // （入力欄だけが見えて、見比べる写真が隠れないように）
                setTimeout(
                  () => photoRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }),
                  KEYBOARD_SETTLE_MS,
                );
              }}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className={css({
                minH: "[52px]",
                px: "3",
                fontFamily: "mono",
                fontSize: "xl",
                fontWeight: "medium",
                letterSpacing: "wider",
                bg: "bg.surface",
                color: "fg",
                borderWidth: "2px",
                borderColor: error ? "danger" : "border.strong",
                borderRadius: "md",
              })}
            />
            <div
              className={css({
                display: "flex",
                justifyContent: "space-between",
                fontSize: "sm",
                color: "fg.muted",
              })}
            >
              <span>{typed}文字</span>
              {length !== undefined && typed > 0 && (
                <span>
                  {typed === length
                    ? "ほかと同じ文字数"
                    : `ほかより${Math.abs(typed - length)}文字${typed < length ? "少ない" : "多い"}`}
                </span>
              )}
            </div>
            {error && (
              <p
                role="alert"
                className={css({ color: "danger", fontSize: "sm", fontWeight: "bold" })}
              >
                {error}
              </p>
            )}
          </div>

          {shown.issue && (
            <p
              className={cx(
                notice,
                css({ borderColor: "warn.border", bg: "warn.subtle", color: "warn" }),
              )}
            >
              <Icon name="warn" size={20} />
              <span>
                <b>{shown.issue.text}</b>
                <br />
                {ISSUE_ADVICE[shown.issue.kind]}
              </span>
            </p>
          )}
          {shown.seen && (
            <p
              className={cx(
                notice,
                css({ borderColor: "seen.border", bg: "seen.subtle", color: "seen" }),
              )}
            >
              <Icon name="history" size={20} />
              <span>
                <b>{shown.seen.text}</b>
                <br />
                {ISSUE_ADVICE.seen}
              </span>
            </p>
          )}

          <ul
            aria-label="間違えやすい文字"
            className={css({ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2" })}
          >
            {LOOKALIKES.map((l) => (
              <li
                key={l.char}
                className={css({
                  display: "grid",
                  justifyItems: "center",
                  py: "1",
                  borderWidth: "1px",
                  borderColor: "border",
                  borderRadius: "md",
                })}
              >
                <span className={css({ fontFamily: "mono", fontSize: "2xl", lineHeight: "tight" })}>
                  {l.char}
                </span>
                <span className={css({ fontSize: "xs", color: "fg.muted" })}>{l.name}</span>
              </li>
            ))}
          </ul>

          <div className={css({ display: "grid", gridTemplateColumns: "[auto 1fr]", gap: "2.5" })}>
            <Button onClick={onClose}>キャンセル</Button>
            <Button type="submit" variant="primary">
              保存
            </Button>
          </div>

          <div className={css({ borderTopWidth: "1px", borderColor: "border", pt: "2" })}>
            {confirmDelete ? (
              <div className={css({ display: "grid", gap: "2" })}>
                <p className={css({ fontSize: "sm", color: "danger" })}>
                  このシリアルナンバーを削除します。元に戻せません。
                </p>
                <div className={css({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2" })}>
                  <Button onClick={() => setConfirmDelete(false)}>キャンセル</Button>
                  <Button variant="danger" onClick={remove}>
                    削除
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghostDanger"
                className={css({ w: "full" })}
                onClick={() => setConfirmDelete(true)}
              >
                <Icon name="trash" size={20} />
                このシリアルナンバーを削除
              </Button>
            )}
          </div>
        </form>
      )}
    </BottomSheet>
  );
}
