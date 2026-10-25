import { css, cx } from "styled-system/css";
import { Icon } from "../../components/Icon.tsx";
import { formatDateTime } from "../../lib/format.ts";
import { groupEntries } from "../../lib/groups.ts";
import { daysLeft, type Reading } from "../../lib/readings.ts";
import { navigate } from "../../lib/router.ts";

const card = css({
  display: "grid",
  gap: "1.5",
  w: "full",
  py: "3",
  px: "3.5",
  textAlign: "left",
  bg: "bg.surface",
  color: "fg",
  borderWidth: "1px",
  borderColor: "border",
  borderRadius: "lg",
});

/** すべてコピーし終えた読み取りは、まだ途中のものより目立たせない。 */
const cardDone = css({ bg: "bg.sunken", color: "fg.muted", borderColor: "transparent" });

/**
 * 読み取り1回分のカード。日時・消えるまでの日数・応募先ごとの件数・コピーの進み具合を出し、押すと結果へ移る。
 * トップと、これまでのスキャンの画面で使う。
 */
export function ReadingCard({ reading }: { reading: Reading }) {
  const total = reading.entries.length;
  const copied = reading.entries.filter((e) => e.copied).length;
  const done = total > 0 && copied === total;
  return (
    <li>
      <button
        type="button"
        onClick={() => navigate({ name: "results", readingId: reading.id })}
        className={cx(card, done && cardDone)}
      >
        <span
          className={css({
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "2",
          })}
        >
          <b className={css({ fontSize: "md" })}>{formatDateTime(reading.createdAt)}</b>
          <span className={css({ flex: "none", fontSize: "xs", color: "fg.muted" })}>
            あと{daysLeft(reading)}日で削除
          </span>
        </span>
        <span className={css({ fontSize: "sm", overflowWrap: "anywhere" })}>
          {groupEntries(reading.entries)
            .map((g) => `${g.label} ${g.entries.length}件`)
            .join("・")}
        </span>
        <span className={css({ display: "flex", alignItems: "center", gap: "2.5" })}>
          <span
            aria-hidden="true"
            className={css({
              flex: "1",
              h: "1.5",
              borderRadius: "full",
              bg: done ? "bg.surface" : "bg.sunken",
              overflow: "hidden",
            })}
          >
            <span
              className={css({ display: "block", h: "full", borderRadius: "full", bg: "accent" })}
              style={{ width: `${total ? Math.round((copied / total) * 100) : 0}%` }}
            />
          </span>
          <span
            className={css({
              display: "inline-flex",
              alignItems: "center",
              gap: "1",
              fontSize: "xs",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            })}
          >
            {done && (
              <span className={css({ color: "accent.text", display: "inline-flex" })}>
                <Icon name="check" size={16} />
              </span>
            )}
            {done ? "すべてコピー済み" : `${total}件中${copied}件コピー済み`}
          </span>
        </span>
      </button>
    </li>
  );
}
