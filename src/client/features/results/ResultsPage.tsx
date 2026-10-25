import { type ReactNode, useEffect, useState } from "react";
import { css, cx } from "styled-system/css";
import { applyUrl } from "../../../shared/scan.ts";
import { AppShell, column } from "../../components/AppShell.tsx";
import { Button, ButtonLink } from "../../components/Button.tsx";
import { DeleteDialog } from "../../components/DeleteDialog.tsx";
import { Icon } from "../../components/Icon.tsx";
import { showToast } from "../../components/Toast.tsx";
import { HelpButton, PrivacyBand, TopBar } from "../../components/TopBar.tsx";
import { useBookmarkletInstalled } from "../../lib/bookmarklet.ts";
import {
  commonLength,
  issueOf,
  type SerialIssue,
  seenNotice,
  sightings,
} from "../../lib/checks.ts";
import { copySerials } from "../../lib/clipboard.ts";
import { formatDateTime } from "../../lib/format.ts";
import { type Group, groupEntries } from "../../lib/groups.ts";
import {
  daysLeft,
  markCopied,
  removeReading,
  type SerialEntry,
  useReading,
  useReadings,
  useReadingsLoaded,
} from "../../lib/readings.ts";
import { navigate } from "../../lib/router.ts";
import { BookmarkletPrompt } from "./BookmarkletPrompt.tsx";
import { EditSheet, type EditTarget } from "./EditSheet.tsx";
import { MoreMenu, type MoreMenuItem } from "./MoreMenu.tsx";
import { SerialRow } from "./SerialRow.tsx";

/** 応募サイトが一度に受け付けるシリアルの数。コピーもこの単位で分ける。 */
const PAGE_SIZE = 10;
/** 何件目から何件目か。1件だけなら「11」のように1つの番号にする。 */
function range(first: number, last: number): string {
  return first === last ? `${first}` : `${first}〜${last}`;
}

/** 読み取り結果。応募先ごと・10件ずつのページで、シリアルを確かめてコピーする。 */
export function ResultsPage({ readingId }: { readingId: string }) {
  const reading = useReading(readingId);
  const readings = useReadings();
  const loaded = useReadingsLoaded();
  const [groupKey, setGroupKey] = useState<string>();
  const [page, setPage] = useState(0);
  const [cautionClosed, setCautionClosed] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const installed = useBookmarkletInstalled();
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    // 端末に保存した読み取りを読み込む前は、まだないだけなので戻さない（結果の画面での再読み込みなど）
    if (loaded && !reading) navigate({ name: "top" }, { replace: true });
  }, [loaded, reading]);
  if (!reading) return null;

  const groups = groupEntries(reading.entries);
  const group = groups.find((g) => (g.artist ?? "") === groupKey) ?? groups[0];
  if (!group) return null;
  const pages = Math.max(1, Math.ceil(group.entries.length / PAGE_SIZE));
  const pageIndex = Math.min(page, pages - 1);
  const start = pageIndex * PAGE_SIZE;
  const rows = group.entries.slice(start, start + PAGE_SIZE);
  const length = commonLength(group.entries);
  const seen = sightings(readings, readingId);
  const issueFor = (e: SerialEntry) => issueOf(e, length);
  const seenFor = (e: SerialEntry) => seenNotice(seen.get(e.serial));
  const warnCount = rows.filter((e) => issueFor(e)).length;
  const seenCount = rows.filter((e) => seenFor(e)).length;
  const pageCopied = rows.length > 0 && rows.every((e) => e.copied);
  const rangeLabel = `${range(start + 1, start + rows.length)}件目`;

  const menuItems: MoreMenuItem[] = [
    ...(group.artist
      ? [{ label: "応募サイトを開く", icon: "external" as const, href: applyUrl(group.artist) }]
      : []),
    {
      label: "このスキャンを削除",
      icon: "trash",
      danger: true,
      onSelect: () => setDeleteOpen(true),
    },
  ];

  const removeThis = () => {
    setDeleteOpen(false);
    navigate({ name: "top" }, { replace: true });
    removeReading(readingId);
    showToast("削除しました");
  };

  const selectGroup = (g: Group) => {
    setGroupKey(g.artist ?? "");
    setPage(0);
  };

  /** コピーのあと。ブックマークレットをまだ追加していなければ案内を出し、知らせは出さない（重なるため）。 */
  const afterCopy = (message: string) => {
    if (installed) showToast(message);
    else setPromptOpen(true);
  };

  const copyPage = async () => {
    const ok = await copySerials(
      rows.map((e) => e.serial),
      {
        artist: group.artist,
        from: start + 1,
        to: start + rows.length,
        total: group.entries.length,
      },
    );
    if (!ok) return showToast("コピーできませんでした");
    markCopied(
      readingId,
      rows.map((e) => e.id),
    );
    afterCopy(`${rangeLabel}をコピーしました`);
  };

  const copyOne = async (entry: SerialEntry, index: number) => {
    const ok = await copySerials([entry.serial], {
      artist: group.artist,
      from: index + 1,
      to: index + 1,
      total: group.entries.length,
    });
    if (!ok) return showToast("コピーできませんでした");
    markCopied(readingId, [entry.id]);
    afterCopy(`${index + 1}件目をコピーしました`);
  };

  return (
    <AppShell
      header={
        <>
          <TopBar
            title={formatDateTime(reading.createdAt)}
            sub={`あと${daysLeft(reading)}日で削除`}
            compact
            actions={
              <>
                <HelpButton />
                <MoreMenu label="このスキャンのメニュー" items={menuItems} />
              </>
            }
            back={{ label: "トップへ戻る", onClick: () => navigate({ name: "top" }) }}
          />
          <PrivacyBand />
          {groups.length > 1 && (
            <GroupSwitch groups={groups} current={group} onSelect={selectGroup} />
          )}
          <PageTabs
            entries={group.entries}
            issueFor={issueFor}
            seenFor={seenFor}
            current={pageIndex}
            onSelect={setPage}
          />
        </>
      }
      footer={
        <div className={css({ display: "flex", alignItems: "center", gap: "2.5" })}>
          {/* 件数はコピー前の見直しを促すもの。コピー後は応募サイトへのボタンに幅を譲る */}
          {warnCount > 0 && !pageCopied && (
            <Badge tone="warn" icon="warn">
              注意 {warnCount}件
            </Badge>
          )}
          {seenCount > 0 && !pageCopied && (
            <Badge tone="seen" icon="history">
              重複 {seenCount}件
            </Badge>
          )}
          {pageCopied ? (
            <>
              <Button className={css({ flex: group.artist ? "none" : "1" })} onClick={copyPage}>
                <Icon name="copy" size={20} />
                再コピー
              </Button>
              {group.artist && (
                <ButtonLink
                  variant="primary"
                  className={css({ flex: "1" })}
                  href={applyUrl(group.artist)}
                  target="_blank"
                  rel="noreferrer"
                >
                  応募サイトを開く
                  <Icon name="external" size={18} />
                </ButtonLink>
              )}
            </>
          ) : (
            <Button variant="primary" className={css({ flex: "1" })} onClick={copyPage}>
              <Icon name="copy" size={20} />
              {rangeLabel}をコピー
            </Button>
          )}
        </div>
      }
    >
      {!cautionClosed && (
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "2",
            mx: "4",
            mt: "3",
            py: "2",
            pl: "3",
            pr: "1",
            borderRadius: "md",
            borderWidth: "1px",
            borderColor: "warn.border",
            bg: "warn.subtle",
            color: "warn",
            fontSize: "xs",
            lineHeight: "snug",
          })}
        >
          <Icon name="warn" size={18} />
          <span className={css({ flex: "1" })}>
            登録の失敗が続くと、応募サイトのアカウントが一時停止されます。
            <br />
            色の付いた行は、注意を確かめてください。
          </span>
          <Button
            size="icon"
            variant="ghost"
            aria-label="閉じる"
            onClick={() => setCautionClosed(true)}
          >
            <Icon name="close" size={18} />
          </Button>
        </div>
      )}
      <ol className={css({ mt: "3", borderTopWidth: "1px", borderColor: "border" })}>
        {rows.map((entry, i) => {
          const issue = issueFor(entry);
          const seenIssue = seenFor(entry);
          return (
            <SerialRow
              key={entry.id}
              entry={entry}
              index={start + i}
              issue={issue}
              seen={seenIssue}
              onCopy={() => copyOne(entry, start + i)}
              onEdit={() => setEditTarget({ entry, index: start + i, issue, seen: seenIssue })}
            />
          );
        })}
      </ol>
      <EditSheet
        readingId={readingId}
        target={editTarget}
        groupLabel={group.label}
        length={length}
        onClose={() => setEditTarget(undefined)}
      />
      {promptOpen && !installed && <BookmarkletPrompt onClose={() => setPromptOpen(false)} />}
      <DeleteDialog
        open={deleteOpen}
        title="このスキャンを削除しますか？"
        what={`${formatDateTime(reading.createdAt)} のスキャン(${reading.entries.length}件)を削除します。`}
        keep="ほかのスキャンは消えません。"
        action="削除"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={removeThis}
      />
    </AppShell>
  );
}

const switchButton = css({
  flex: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  minH: "11",
  px: "3.5",
  borderRadius: "full",
  borderWidth: "1px",
  fontSize: "sm",
  fontWeight: "bold",
  whiteSpace: "nowrap",
});

const switchOn = css({ bg: "accent", color: "accent.fg", borderColor: "accent" });
const switchOff = css({ bg: "bg.surface", color: "fg", borderColor: "border.strong" });

/** 応募先の切り替え。応募先が2つ以上あるときだけ出す。 */
function GroupSwitch({
  groups,
  current,
  onSelect,
}: {
  groups: Group[];
  current: Group;
  onSelect: (g: Group) => void;
}) {
  return (
    <nav
      aria-label="応募先の切り替え"
      className={cx(
        column,
        css({ display: "flex", gap: "2", px: "4", py: "2", overflowX: "auto" }),
      )}
    >
      {groups.map((g) => {
        const on = g === current;
        return (
          <button
            key={g.label}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(g)}
            className={cx(switchButton, on ? switchOn : switchOff)}
          >
            {g.label}
            <small className={css({ fontWeight: "normal" })}>{g.entries.length}件</small>
          </button>
        );
      })}
    </nav>
  );
}

const badge = css({
  flex: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  px: "2.5",
  py: "1",
  borderRadius: "full",
  fontSize: "xs",
  fontWeight: "bold",
});

/** 下端の帯に出す、ページの中の注意の件数。 */
function Badge({
  tone,
  icon,
  children,
}: {
  tone: "warn" | "seen";
  icon: "warn" | "history";
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        badge,
        tone === "warn"
          ? css({ bg: "warn.subtle", color: "warn" })
          : css({ bg: "seen.subtle", color: "seen" }),
      )}
    >
      <Icon name={icon} size={16} />
      {children}
    </span>
  );
}

/**
 * 10件ずつのページのタブ。コピー済みのページには印、読み違いの疑いのあるページには橙の点、
 * ほかの読み取りにもあるシリアルを含むページには灰色の点を付ける。
 */
function PageTabs({
  entries,
  issueFor,
  seenFor,
  current,
  onSelect,
}: {
  entries: SerialEntry[];
  issueFor: (entry: SerialEntry) => SerialIssue | undefined;
  seenFor: (entry: SerialEntry) => SerialIssue | undefined;
  current: number;
  onSelect: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  return (
    <div
      role="tablist"
      aria-label="10件ずつのページ"
      className={cx(
        column,
        css({ display: "flex", gap: "1.5", px: "4", pb: "2", pt: "1", overflowX: "auto" }),
      )}
    >
      {Array.from({ length: pages }, (_, p) => {
        const slice = entries.slice(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE);
        const copied = slice.length > 0 && slice.every((e) => e.copied);
        const warn = slice.some((e) => issueFor(e));
        const seen = slice.some((e) => seenFor(e));
        const on = p === current;
        return (
          <button
            // ページは番号で決まり、並び替えはない
            // biome-ignore lint/suspicious/noArrayIndexKey: ページは番号で決まる
            key={p}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(p)}
            className={css({
              flex: "none",
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: "1",
              minH: "10",
              px: "3",
              borderRadius: "md",
              fontSize: "sm",
              fontWeight: "bold",
              whiteSpace: "nowrap",
              bg: on ? "accent.subtle" : "transparent",
              color: on ? "accent.text" : "fg.muted",
              borderWidth: "1px",
              borderColor: on ? "accent.text" : "transparent",
            })}
          >
            {copied && <Icon name="check" size={16} />}
            {range(p * PAGE_SIZE + 1, p * PAGE_SIZE + slice.length)}
            {warn && (
              <span
                role="img"
                aria-label="注意あり"
                className={css({ w: "2", h: "2", borderRadius: "full", bg: "warn.border" })}
              />
            )}
            {seen && (
              <span
                role="img"
                aria-label="重複あり"
                className={css({ w: "2", h: "2", borderRadius: "full", bg: "seen.border" })}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
