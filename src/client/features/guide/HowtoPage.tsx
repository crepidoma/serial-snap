import { type ReactNode, useState } from "react";
import { css, cx } from "styled-system/css";
import { Button } from "../../components/Button.tsx";
import { Icon } from "../../components/Icon.tsx";
import { useBookmarkletInstalled } from "../../lib/bookmarklet.ts";
import { goBack, navigate } from "../../lib/router.ts";
import {
  BookmarkletAbout,
  CopyBarMock,
  FilledMock,
  Highlight,
  Lead,
  Mock,
  SAMPLE_SERIALS,
  Shot,
  StepTitle,
  tapMotion,
} from "./parts.tsx";
import { StepGuide } from "./StepGuide.tsx";

/** 撮る紙の図の、紙の位置と傾き。向きがバラバラでもよいことを見せる。 */
const PAPERS = [
  { left: "6%", top: "18%", rotate: "-8deg" },
  { left: "53%", top: "14%", rotate: "6deg" },
  { left: "8%", top: "58%", rotate: "5deg" },
  { left: "54%", top: "60%", rotate: "-10deg" },
];
const PAPER_SERIALS = [...SAMPLE_SERIALS, "T5RB6YJ9N4GE2WA"];

/** 撮影の枠の四隅。 */
const CORNERS = [
  css({ top: "0", left: "0", borderTopWidth: "[3px]", borderLeftWidth: "[3px]" }),
  css({ top: "0", right: "0", borderTopWidth: "[3px]", borderRightWidth: "[3px]" }),
  css({ bottom: "0", left: "0", borderBottomWidth: "[3px]", borderLeftWidth: "[3px]" }),
  css({ bottom: "0", right: "0", borderBottomWidth: "[3px]", borderRightWidth: "[3px]" }),
];

/** 紙を並べて撮るところの図。 */
function PapersShot() {
  return (
    <div
      aria-hidden="true"
      className={css({
        position: "relative",
        h: "[200px]",
        borderRadius: "md",
        bg: "bg.surface",
        borderWidth: "1px",
        borderColor: "border",
        overflow: "hidden",
      })}
    >
      {PAPERS.map((p, i) => (
        <span
          key={PAPER_SERIALS[i]}
          className={css({
            position: "absolute",
            px: "2",
            py: "3",
            bg: "bg.canvas",
            borderWidth: "1px",
            borderColor: "border.strong",
            borderRadius: "sm",
            boxShadow: "sm",
            fontFamily: "mono",
            // 図の中の小さな紙のため、本文の大きさの段階より小さくする
            fontSize: "[11px]",
          })}
          style={{ left: p.left, top: p.top, transform: `rotate(${p.rotate})` }}
        >
          {PAPER_SERIALS[i]}
        </span>
      ))}
      <span
        className={css({
          position: "absolute",
          inset: "3",
          animation: "[howtoFrame 3s ease-in-out infinite]",
          _motionReduce: { animation: "[none]" },
        })}
      >
        {CORNERS.map((c) => (
          <span
            key={c}
            className={cx(css({ position: "absolute", w: "6", h: "6", borderColor: "accent" }), c)}
          />
        ))}
      </span>
      <span
        className={css({
          position: "absolute",
          inset: "0",
          bg: "white",
          opacity: "0",
          animation: "[howtoFlash 3s ease-in-out infinite]",
          _motionReduce: { animation: "[none]" },
        })}
      />
    </div>
  );
}

/** 読み取り結果の、注意の付いた1行の図。「修正」を押すところを示す。 */
function FlaggedRowShot() {
  return (
    <Mock>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "3",
          p: "3",
          bg: "warn.subtle",
          borderRadius: "md",
        })}
      >
        <div className={css({ flex: "1", minW: "0", display: "grid", gap: "1" })}>
          <span
            className={css({
              px: "2",
              py: "1",
              bg: "bg.canvas",
              borderRadius: "sm",
              fontFamily: "mono",
              fontSize: "sm",
              color: "fg.muted",
              justifySelf: "start",
            })}
          >
            {/* 文字の幅に合わせた枠の中で、帯を1文字ずつ動かす（15文字なので15段） */}
            <span className={css({ position: "relative", display: "inline-block" })}>
              KM7O2PQ9XR4TN8W
              <span
                className={css({
                  position: "absolute",
                  top: "0",
                  bottom: "0",
                  w: "[1ch]",
                  bg: "warn.border",
                  opacity: "0.35",
                  animation: "[howtoScan 3s steps(15, end) infinite]",
                  _motionReduce: { display: "none" },
                })}
              />
            </span>
          </span>
          <span className={css({ fontFamily: "mono", fontSize: "md", fontWeight: "bold" })}>
            KM702PQ9XR4TN8W
          </span>
          <span
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "1",
              fontSize: "xs",
              color: "warn",
            })}
          >
            <Icon name="warn" size={14} />
            読み取りに自信なし(0とO)
          </span>
        </div>
        {/* 押す動き（大きさ）と「ここを押す」の枠（影）は、animation がぶつかるため別の要素に付ける */}
        <span className={cx(css({ display: "inline-flex" }), tapMotion)}>
          <Highlight>
            <span
              className={css({
                display: "inline-flex",
                alignItems: "center",
                gap: "1",
                minH: "9",
                px: "3",
                borderWidth: "1px",
                borderColor: "accent.text",
                borderRadius: "md",
                bg: "bg.surface",
                color: "accent.text",
                fontSize: "sm",
                fontWeight: "bold",
              })}
            >
              <Icon name="edit" size={16} />
              修正
            </span>
          </Highlight>
        </span>
      </div>
    </Mock>
  );
}

/** コピーの図の、押す前の表示。ボタンを押す動き（4秒の30%）まで出す。 */
const beforeTap = css({
  animation: "[howtoBeforeTap 4s linear infinite]",
  _motionReduce: { animation: "[none]" },
});
/** コピーの図の、押したあとの表示。ボタンを押す動きに合わせて出す。 */
const afterTap = css({
  opacity: "0",
  animation: "[howtoAfterTap 4s linear infinite]",
  _motionReduce: { animation: "[none]" },
});

/** 押す前と押したあとで入れ替わる表示。同じ場所に重ねて置く。 */
function Swap({ before, after }: { before: ReactNode; after: ReactNode }) {
  return (
    // 広いほうの幅に揃え、入れ替わっても行の並びが動かないようにする
    <span
      className={css({ display: "inline-grid", "& > *": { gridArea: "1 / 1", display: "grid" } })}
    >
      <span className={beforeTap}>{before}</span>
      <span className={afterTap}>{after}</span>
    </span>
  );
}

const rowChip = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1",
  minH: "7",
  px: "2",
  borderRadius: "sm",
  borderWidth: "1px",
  borderColor: "accent.text",
  color: "accent.text",
  fontSize: "xs",
  fontWeight: "bold",
  whiteSpace: "nowrap",
});

/**
 * 「1〜10件目をコピー」を押すと、表示中の10件がコピー済みになる図。
 * 実際の結果の画面と同じく、行の「コピー」が「コピー済み」に、ページのタブに印が付き、知らせが出る。
 */
function CopyShot() {
  return (
    <div className={css({ display: "grid", gap: "2.5" })}>
      <Mock>
        <div
          className={css({
            display: "flex",
            gap: "1.5",
            px: "3",
            pt: "3",
            pb: "2",
            fontSize: "sm",
            fontWeight: "bold",
          })}
        >
          <span
            className={css({
              display: "inline-flex",
              alignItems: "center",
              gap: "1",
              minH: "8",
              px: "2.5",
              borderRadius: "md",
              borderWidth: "1px",
              borderColor: "accent.text",
              bg: "accent.subtle",
              color: "accent.text",
            })}
          >
            <Swap before={null} after={<Icon name="check" size={14} />} />
            1〜10
          </span>
          <span
            className={css({
              display: "inline-flex",
              alignItems: "center",
              px: "2.5",
              color: "fg.muted",
            })}
          >
            11〜14
          </span>
        </div>
        <div className={css({ position: "relative" })}>
          {SAMPLE_SERIALS.map((serial, i) => (
            <div
              key={serial}
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "2",
                px: "3",
                py: "1.5",
                borderTopWidth: "1px",
                borderColor: "border",
              })}
            >
              <span className={css({ w: "4", fontSize: "xs", color: "fg.muted" })}>{i + 1}</span>
              <span className={css({ flex: "1", fontFamily: "mono", fontSize: "sm" })}>
                {serial}
              </span>
              <Swap
                before={
                  <span className={rowChip}>
                    <Icon name="copy" size={14} />
                    コピー
                  </span>
                }
                after={
                  <span className={rowChip}>
                    <Icon name="check" size={14} />
                    コピー済み
                  </span>
                }
              />
            </div>
          ))}
          <div
            className={css({
              px: "3",
              py: "1.5",
              borderTopWidth: "1px",
              borderColor: "border",
              fontSize: "xs",
              color: "fg.muted",
              textAlign: "center",
            })}
          >
            …10件目まで
          </div>
          {/* コピーしたときの知らせ（実際の画面のトーストと同じ文） */}
          <span
            className={cx(
              css({
                position: "absolute",
                left: "[50%]",
                bottom: "2",
                transform: "translateX(-50%)",
                display: "inline-flex",
                alignItems: "center",
                gap: "1.5",
                px: "3",
                py: "1.5",
                borderRadius: "full",
                bg: "fg",
                color: "bg.surface",
                fontSize: "xs",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                boxShadow: "md",
              }),
              afterTap,
            )}
          >
            <Icon name="check" size={14} />
            1〜10件目をコピーしました
          </span>
        </div>
      </Mock>
      <CopyBarMock tap />
    </div>
  );
}

function steps() {
  return [
    <>
      <StepTitle>紙を並べて撮る</StepTitle>
      <Shot>
        <PapersShot />
      </Shot>
      <Lead>
        シリアルナンバーの紙を並べて撮ります。向きがバラバラでも大丈夫です。続けて何枚でも撮れ、撮ってある写真も選べます。
      </Lead>
    </>,
    <>
      <StepTitle>写真と見比べる</StepTitle>
      <Shot>
        <FlaggedRowShot />
      </Shot>
      <Lead>
        切り抜きと読み取った文字を見比べ、違っていれば修正します。色の付いた行は、特によく確かめます。
      </Lead>
    </>,
    <>
      <StepTitle>10件ずつコピー</StepTitle>
      <Shot>
        <CopyShot />
      </Shot>
      <Lead>
        応募サイトの登録は、一度に10件までです。画面下のボタンで、表示中の10件をコピーします。
      </Lead>
    </>,
    <>
      <StepTitle>{["応募サイトで", "貼り付け"]}</StepTitle>
      <Shot>
        <FilledMock highlightSubmit={false} motion="fill" />
      </Shot>
      <Lead>
        応募サイトで、追加したブックマークレットを開き「クリップボードから入力」を押すと、入力欄にシリアルナンバーが入ります。
      </Lead>
      <BookmarkletAbout />
    </>,
    <>
      <StepTitle>確認して登録</StepTitle>
      <Shot>
        <FilledMock motion="check" />
      </Shot>
      <Lead>内容を確かめて、登録ボタンを自分で押します。このアプリは登録ボタンを押しません。</Lead>
    </>,
  ];
}

/** 使い方。撮るところから応募サイトで登録するまでの5ステップを、全画面のダイアログで見せる。 */
export function HowtoPage() {
  const [step, setStep] = useState(0);
  const installed = useBookmarkletInstalled();
  const list = steps();
  return (
    <StepGuide
      title="使い方"
      steps={list}
      step={step}
      onStep={setStep}
      onBack={goBack}
      onDone={goBack}
      doneLabel="閉じる"
      closeButton
      lastFooter={
        installed ? undefined : (
          <div className={css({ display: "flex", gap: "2.5" })}>
            <Button onClick={goBack}>閉じる</Button>
            <Button
              variant="primary"
              className={css({ flex: "1" })}
              onClick={() => navigate({ name: "addBookmarklet" }, { replace: true })}
            >
              ブックマークレットを追加する
            </Button>
          </div>
        )
      }
    />
  );
}
