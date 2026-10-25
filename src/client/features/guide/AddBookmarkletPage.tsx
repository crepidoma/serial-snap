import { href as bookmarkletHref } from "virtual:bookmarklet";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { css, cx } from "styled-system/css";
import { Button } from "../../components/Button.tsx";
import { Icon } from "../../components/Icon.tsx";
import { useBookmarkletInstalled } from "../../lib/bookmarklet.ts";
import { copyText } from "../../lib/clipboard.ts";
import { goBack } from "../../lib/router.ts";
import {
  BookmarkletAbout,
  CodeSample,
  Example,
  Highlight,
  Lead,
  Mark,
  Mock,
  MockRow,
  MockToolbar,
  Note,
  PanelPreview,
  Shot,
  ShotCaption,
  StepTitle,
  Tag,
} from "./parts.tsx";
import { StepGuide } from "./StepGuide.tsx";

// 案内の図は、実際の画面（.local/references に集めた資料と実機での確認）に合わせる。
// iPhone は iOS 26 の Safari、Android は Chrome ヘルプの手順を元にする。

type Device = "ios" | "android" | "pc";

const TABS: { value: Device; label: string }[] = [
  { value: "ios", label: "iPhone" },
  { value: "android", label: "Android" },
  { value: "pc", label: "パソコン" },
];

/** 開いている端末に合うタブ。iPadOS は Macintosh と名乗るため、触れる画面かどうかで見分ける。 */
function detectDevice(): Device {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1)) {
    return "ios";
  }
  return /Android/.test(ua) ? "android" : "pc";
}

/** コピーしてから次のステップへ進むまでの時間。「コピーしました」を読めるだけの間を置く。 */
const AUTO_NEXT_MS = 1200;

/** 案内で例に出す、ブックマークレットの名前。アプリのページのタイトルと同じで、追加するときに自動で入る。 */
const EXAMPLE_NAME = "シリアルスナップ";

/** 図の中で押す場所。対象の要素に「ここを押す」の枠を付けるため、角を丸めて少し余白を取る。 */
const tapTarget = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  px: "1.5",
  py: "1",
  borderRadius: "md",
  fontWeight: "bold",
});

/** ステップ1。プログラム（ブックマークレットのURL）をコピーし、少し待って次へ進む。 */
function CopyStep({ onNext }: { onNext: () => void }) {
  const [copied, setCopied] = useState(false);
  // 描き直しで関数が変わっても待ち時間をやり直さないよう、最新の関数を ref で呼ぶ
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => onNextRef.current(), AUTO_NEXT_MS);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <>
      <StepTitle>プログラムをコピー</StepTitle>
      <Lead>ブックマークレットの元になる短いプログラムをコピーします。</Lead>
      <Shot>
        {copied ? (
          <div role="status" className={css({ display: "grid", gap: "2.5" })}>
            <span
              className={css({
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "2",
                minH: "16",
                borderRadius: "lg",
                bg: "accent.subtle",
                fontSize: "lg",
                fontWeight: "bold",
                "& > svg": { color: "accent.text" },
              })}
            >
              <Icon name="check" />
              コピーしました
            </span>
            <span
              aria-hidden="true"
              className={css({
                h: "1",
                borderRadius: "full",
                bg: "bg.surface",
                overflow: "hidden",
              })}
            >
              <span
                className={css({
                  display: "block",
                  h: "full",
                  bg: "accent",
                  animation: "[autoNext 1.2s linear forwards]",
                })}
              />
            </span>
            <span className={css({ fontSize: "xs", color: "fg.muted", textAlign: "center" })}>
              次のステップへ進みます
            </span>
          </div>
        ) : (
          <Highlight>
            <Button
              variant="primary"
              size="lg"
              className={css({ w: "full" })}
              onClick={async () => {
                if (await copyText(bookmarkletHref)) setCopied(true);
              }}
            >
              <Icon name="copy" />
              プログラムをコピー
            </Button>
          </Highlight>
        )}
      </Shot>
      <BookmarkletAbout />
    </>
  );
}

/** 最後のステップの補足。アプリの画面でブックマークレットが動いたら、確認できたと出す。 */
function VerifyResult({ fallback }: { fallback: string }) {
  const installed = useBookmarkletInstalled();
  return installed ? (
    <Note icon="check">
      <b>動作を確認できました</b>
      <span>応募サイトのシリアルナンバー登録の画面で使えます。</span>
    </Note>
  ) : (
    <Note>
      <span>{fallback}</span>
    </Note>
  );
}

/** 図の中のアドレスバー。 */
function AddressPill({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <span
      className={css({
        flex: "1",
        minW: "0",
        display: "flex",
        alignItems: "center",
        gap: "2",
        h: "9",
        px: "3",
        borderRadius: "full",
        bg: "bg.sunken",
        fontSize: "sm",
        color: strong ? "fg" : "fg.muted",
        whiteSpace: "nowrap",
        overflow: "hidden",
      })}
    >
      {children}
    </span>
  );
}

// ---- iPhone（Safari） ----

/** 「編集」の画面の、タイトルとアドレスの欄。 */
function IosBookmarkCard({ address }: { address: ReactNode }) {
  return (
    <Mock>
      <MockRow>
        <Mark n={1} />
        <b>{EXAMPLE_NAME}</b>
      </MockRow>
      <MockRow>{address}</MockRow>
    </Mock>
  );
}

// ブックマークへの追加や一覧の開き方は人や iOS の版で違い、多くの人ができるため図解せず、
// 追加したブックマークの長押しから図で示す
function iosSteps(next: () => void) {
  return [
    <CopyStep key="1" onNext={next} />,
    <>
      <StepTitle>{["追加したブックマークを", "長押しして「編集」"]}</StepTitle>
      <Lead>
        このページを、いつもの方法でブックマークに追加します。名前は自由です。追加したら、ブックマークの一覧で長押しします。
      </Lead>
      <Shot>
        <ShotCaption>
          <Mark n={1} />
          追加したブックマークを長押し
        </ShotCaption>
        <Mock>
          <MockRow>
            <Icon name="folder" size={20} />
            お気に入り
          </MockRow>
          <MockRow>
            <Highlight block>
              <span className={tapTarget}>
                <Icon name="book" size={20} />
                {EXAMPLE_NAME}
                <Tag>長押し</Tag>
              </span>
            </Highlight>
          </MockRow>
        </Mock>
        <ShotCaption>
          <Mark n={2} />
          出てきたメニューの「編集」
        </ShotCaption>
        <Mock>
          <MockRow>
            <Highlight block>
              <span className={tapTarget}>編集</span>
            </Highlight>
          </MockRow>
        </Mock>
      </Shot>
    </>,
    <>
      <StepTitle>{["アドレスを消して", "プログラムを貼り付け"]}</StepTitle>
      <Shot>
        <IosBookmarkCard
          address={
            <Highlight block>
              <span className={tapTarget}>
                <Mark n={2} />
                <CodeSample />
              </span>
            </Highlight>
          }
        />
        <div className={css({ display: "flex", alignItems: "center", gap: "2" })}>
          <Mark n={3} />
          <Mock dark>
            <span
              className={css({
                display: "block",
                px: "3.5",
                py: "1.5",
                fontSize: "sm",
                fontWeight: "bold",
              })}
            >
              ペースト
            </span>
          </Mock>
          <ShotCaption>空の欄を長押しで表示</ShotCaption>
        </div>
      </Shot>
      <ol className={css({ display: "grid", gap: "1" })}>
        <li>1. 名前はそのままか、自由に変える</li>
        <li>2. アドレスの欄の文字をすべて消す</li>
        <li>3. 空の欄を長押しして「ペースト」</li>
        <li>4. 画面右上のボタンで保存して閉じる</li>
      </ol>
    </>,
    <>
      <StepTitle>動作の確認</StepTitle>
      <Lead>
        このページのまま、ブックマークの一覧から、追加したブックマークを押します。
        <Example name={EXAMPLE_NAME} />
      </Lead>
      <Shot>
        <ShotCaption>この表示が出れば完了です</ShotCaption>
        <PanelPreview />
      </Shot>
      <VerifyResult fallback="表示が出ない場合は、ステップ3でアドレスがプログラムのみか確認します。" />
    </>,
  ];
}

// ---- Android（Chrome） ----

/** Chrome の画面上の帯（アドレス欄と「︙」）。 */
function AndroidTopBar({ highlightMore = false }: { highlightMore?: boolean }) {
  const more = (
    <span className={cx(tapTarget, css({ p: "1.5" }))}>
      <Icon name="moreVertical" />
    </span>
  );
  return (
    <div className={css({ display: "flex", alignItems: "center", gap: "2", p: "2" })}>
      <AddressPill>このアプリのアドレス</AddressPill>
      {highlightMore ? <Highlight>{more}</Highlight> : more}
    </div>
  );
}

function androidSteps(next: () => void) {
  return [
    <CopyStep key="1" onNext={next} />,
    <>
      <StepTitle>{["右上の「︙」から", "☆を押す"]}</StepTitle>
      <Shot>
        <ShotCaption>
          <Mark n={1} />
          Chrome右上の「︙」
        </ShotCaption>
        <Mock>
          <AndroidTopBar highlightMore />
        </Mock>
        <ShotCaption>
          <Mark n={2} />
          メニューのいちばん上の☆
        </ShotCaption>
        <Mock>
          <MockToolbar icons={["arrowRight", "star", "download", "info", "reload"]} highlight={1} />
          <MockRow>
            <span className={css({ color: "fg.muted" })}>新しいタブ</span>
          </MockRow>
        </Mock>
      </Shot>
      <Lead>このページを開いたまま操作します。☆で、このページがブックマークに入ります。</Lead>
    </>,
    <>
      <StepTitle>{["ブックマークの一覧から", "「編集」"]}</StepTitle>
      <Shot>
        <ShotCaption>
          <Mark n={1} />
          「︙」→「ブックマーク」
        </ShotCaption>
        <Mock>
          <MockRow>
            <span className={css({ color: "fg.muted" })}>履歴</span>
          </MockRow>
          <MockRow>
            <Highlight block>
              <span className={tapTarget}>ブックマーク</span>
            </Highlight>
          </MockRow>
        </Mock>
        <ShotCaption>
          <Mark n={2} />
          フォルダを開き、追加したブックマークの右の「︙」
        </ShotCaption>
        <Mock>
          <MockRow>
            <Icon name="star" size={20} />
            <b className={css({ flex: "1" })}>{EXAMPLE_NAME}</b>
            <Highlight>
              <span className={cx(tapTarget, css({ p: "1.5" }))}>
                <Icon name="moreVertical" />
              </span>
            </Highlight>
          </MockRow>
        </Mock>
        <ShotCaption>
          <Mark n={3} />
          「編集」
        </ShotCaption>
        <Mock>
          <MockRow>
            <Highlight block>
              <span className={tapTarget}>編集</span>
            </Highlight>
          </MockRow>
        </Mock>
      </Shot>
      <Lead muted>☆を押した直後に画面下に出る表示に「編集」があれば、そこからも開けます。</Lead>
    </>,
    <>
      <StepTitle>{["名前とURLを", "書き換える"]}</StepTitle>
      <Shot>
        <Mock>
          <MockRow>
            <Mark n={1} />
            <span className={css({ w: "9", fontSize: "xs", color: "fg.muted" })}>名前</span>
            <b>{EXAMPLE_NAME}</b>
          </MockRow>
          <MockRow>
            <Highlight block>
              <span className={tapTarget}>
                <Mark n={2} />
                <span
                  className={css({
                    w: "9",
                    fontSize: "xs",
                    color: "fg.muted",
                    fontWeight: "normal",
                  })}
                >
                  URL
                </span>
                <CodeSample />
              </span>
            </Highlight>
          </MockRow>
        </Mock>
      </Shot>
      <ol className={css({ display: "grid", gap: "1" })}>
        <li>
          1. 名前はそのままか、自由に変える
          <Example name={EXAMPLE_NAME} />
        </li>
        <li>2. URLをすべて消し、長押しで「貼り付け」</li>
        <li>3. 左上の矢印で戻る</li>
      </ol>
    </>,
    <>
      <StepTitle>動作の確認</StepTitle>
      <Lead>
        このページのまま、アドレスバーに付けた名前を入力し、候補に出たブックマークを押します。
      </Lead>
      <Shot>
        <Mock>
          <div className={css({ p: "2" })}>
            <AddressPill strong>{EXAMPLE_NAME.slice(0, 4)}</AddressPill>
          </div>
          <MockRow>
            <Highlight block>
              <span className={tapTarget}>
                <Icon name="star" size={20} />
                <span className={css({ display: "grid" })}>
                  {EXAMPLE_NAME}
                  <CodeSample />
                </span>
              </span>
            </Highlight>
          </MockRow>
        </Mock>
        <ShotCaption>この表示が出れば完了です</ShotCaption>
        <PanelPreview />
      </Shot>
      <Note icon="warn" tone="warn">
        <span>ブックマークの一覧から開くと動きません。アドレスバーから開きます。</span>
      </Note>
      <VerifyResult fallback="表示が出ない場合は、ステップ4でURLがプログラムのみか確認します。" />
    </>,
  ];
}

// ---- パソコン ----

/** キーボードのキー。 */
function Key({ children }: { children: string }) {
  return (
    <kbd
      className={css({
        px: "2",
        py: "0.5",
        borderRadius: "sm",
        borderWidth: "1px",
        borderColor: "border.strong",
        bg: "bg.surface",
        fontFamily: "body",
        fontSize: "sm",
        fontWeight: "bold",
        boxShadow: "sm",
      })}
    >
      {children}
    </kbd>
  );
}

/** ブックマークバーに並ぶ、ほかのブックマークの見本。 */
function BarChip({ width }: { width: string }) {
  return (
    <span
      aria-hidden="true"
      className={css({ h: "4", borderRadius: "sm", bg: "border" })}
      style={{ width }}
    />
  );
}

/** ブックマークバーに並ぶブックマークの形。色は使う所で付ける（同じ指定を2つのクラスに書くと、どちらが効くか決まらないため）。 */
const chip = css({
  display: "inline-flex",
  alignItems: "center",
  h: "7",
  px: "2.5",
  borderRadius: "full",
  fontSize: "xs",
  fontWeight: "bold",
  whiteSpace: "nowrap",
});

/** ブックマークバーに入った、追加したブックマークレット。 */
const addedChip = cx(chip, css({ bg: "bg.sunken" }));

// ドラッグの図の位置と大きさ。
// ブックマークバーの点線は、左の余白12px＋見本44px＋8px＋見本56px＋8px＝左から128pxの所、帯（高さ36px）の上から2px。
// アプリの画面のボタンは、帯36px＋余白12px＋見出し18px＋8px＝上から74pxの所。
// 動くボタンは、画面のボタンの位置から72px上へ動かし、帯の点線に重ねる（panda.config.ts の dragToBar）。
const DRAG_LEFT = "[128px]";
const DRAG_TOP = "[74px]";

/**
 * 下の実物のドラッグするボタン（DraggableBookmarklet）を、約3分の2に縮めた見た目。
 * 実物（高さ48px・左12px・右20px・印20px・間4px・16px）に比率を合わせる。
 */
const dragButtonLook = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5",
  h: "8",
  pl: "2",
  pr: "3.5",
  borderRadius: "full",
  bg: "accent",
  color: "accent.fg",
  fontSize: "xs",
  fontWeight: "bold",
  whiteSpace: "nowrap",
});

function DragButtonLook({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cx(dragButtonLook, className)}>
      <Icon name="grip" size={14} />
      {EXAMPLE_NAME}
    </span>
  );
}

/**
 * パソコンのブラウザの図。アドレスバーの下にブックマークバー、その下にアプリの画面。
 * `bar` はブックマークバーの見せ方（`highlight`: 帯を示す、`drop`: ドラッグの動き、`added`: 追加済み）。
 */
function BrowserMock({ bar }: { bar: "highlight" | "drop" | "added" }) {
  const barRow = (
    <div
      className={cx(
        css({ display: "flex", alignItems: "center", gap: "2", h: "9", px: "3" }),
        // 強調するときは、枠が図の端で切れないよう左右と上下に少し間を空ける
        bar === "highlight"
          ? css({
              mx: "1.5",
              my: "1",
              borderWidth: "1px",
              borderColor: "border",
              borderRadius: "sm",
            })
          : css({ borderTopWidth: "1px", borderBottomWidth: "1px", borderColor: "border" }),
      )}
    >
      <BarChip width="44px" />
      <BarChip width="56px" />
      {bar === "drop" && (
        // 離す場所の点線。動くボタンと同じ大きさにするため、見えないボタンを置いて外側に線を引く
        // （枠線だと大きさが変わるため、大きさに影響しない outline を使う）
        <span
          className={css({
            display: "inline-flex",
            borderRadius: "full",
            outlineWidth: "[1.5px]",
            outlineStyle: "dashed",
            outlineColor: "highlight",
          })}
        >
          <DragButtonLook className={css({ visibility: "hidden" })} />
        </span>
      )}
      {bar === "added" && (
        <Highlight>
          <span className={addedChip}>{EXAMPLE_NAME}</span>
        </Highlight>
      )}
    </div>
  );
  return (
    <Mock>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "2",
          px: "2",
          py: "1.5",
          color: "fg.muted",
        })}
      >
        <Icon name="arrowLeft" size={18} />
        <Icon name="arrowRight" size={18} />
        <Icon name="reload" size={18} />
        <AddressPill>このアプリのアドレス</AddressPill>
        <Icon name="star" size={18} />
      </div>
      <div className={css({ position: "relative" })}>
        {bar === "highlight" ? <Highlight>{barRow}</Highlight> : barRow}
        <div
          className={css({
            minH: "[96px]",
            p: "3",
            display: "grid",
            gap: "2",
            alignContent: "start",
          })}
        >
          <span
            className={css({
              fontSize: "xs",
              fontWeight: "bold",
              color: "fg.muted",
              lineHeight: "[18px]",
            })}
          >
            シリアルスナップ
          </span>
          {bar === "added" && <PanelPreview bare />}
          {bar === "drop" && (
            <DragButtonLook className={css({ justifySelf: "start", ml: "[116px]" })} />
          )}
        </div>
        {bar === "drop" && (
          // 画面のボタンをつかんだ指（ポインター）ごと、ブックマークバーの点線まで上へ動かす
          <span
            aria-hidden="true"
            className={css({
              position: "absolute",
              left: DRAG_LEFT,
              top: DRAG_TOP,
              animation: "[dragToBar 2.4s ease-in-out infinite]",
              _motionReduce: { animation: "[none]" },
            })}
          >
            <DragButtonLook className={css({ opacity: "0.9", boxShadow: "md" })} />
            <span
              className={css({
                position: "absolute",
                right: "[18px]",
                bottom: "[-10px]",
                color: "fg",
                "& svg": { fill: "bg.surface" },
              })}
            >
              <Icon name="cursor" size={20} />
            </span>
          </span>
        )}
      </div>
    </Mock>
  );
}

/**
 * ブックマークバーへドラッグするリンク。React 19 は href の `javascript:` を無効にするため、DOMに直接設定する。
 * このページで押すとブックマークレットが動いてしまうため、押したときの動きは止める（ドラッグはできる）。
 */
function DraggableBookmarklet() {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    ref.current?.setAttribute("href", bookmarkletHref);
  }, []);
  return (
    <div className={css({ display: "flex", justifyContent: "center", py: "1" })}>
      <Highlight>
        {/* biome-ignore lint/a11y/useValidAnchor: ブックマークバーへドラッグするにはリンクである必要がある */}
        <a
          ref={ref}
          // 実際のURLは描画のあとで差し替える（上の説明のとおり）
          href="#bookmarklet"
          onClick={(e) => e.preventDefault()}
          className={css({
            display: "inline-flex",
            alignItems: "center",
            gap: "1",
            minH: "12",
            // つまむ印は四角の真ん中にしか点がなく、左に約8pxの空きがある。その分だけ左の余白を減らし、
            // 見た目の左右の余白をそろえる
            pl: "3",
            pr: "5",
            borderRadius: "full",
            bg: "accent",
            color: "accent.fg",
            fontWeight: "bold",
            textDecoration: "none",
            cursor: "grab",
          })}
        >
          <Icon name="grip" size={20} />
          {EXAMPLE_NAME}
        </a>
      </Highlight>
    </div>
  );
}

function pcSteps() {
  const keyRow = css({ display: "flex", alignItems: "center", gap: "1.5", flexWrap: "wrap" });
  const keyLabel = css({ w: "20", fontSize: "sm", fontWeight: "bold" });
  return [
    <>
      <StepTitle>{["ブックマークバーを", "表示"]}</StepTitle>
      <Lead>
        アドレスバーのすぐ下に、ブックマークを並べる帯(ブックマークバー)を表示します。表示済みなら、次へ進みます。
      </Lead>
      <BookmarkletAbout />
      <Shot>
        <BrowserMock bar="highlight" />
        <ShotCaption>↑ アドレスバーの下の帯がブックマークバーです</ShotCaption>
        <div className={keyRow}>
          <span className={keyLabel}>Windows</span>
          <Key>Ctrl</Key>+<Key>Shift</Key>+<Key>B</Key>
        </div>
        <div className={keyRow}>
          <span className={keyLabel}>Mac</span>
          <Key>command</Key>+<Key>shift</Key>+<Key>B</Key>
        </div>
      </Shot>
      <Lead muted>
        ChromeとEdgeは上のキーで表示します。Safariは、メニューの「表示」→「お気に入りバーを表示」です。
      </Lead>
    </>,
    <>
      <StepTitle>{["下のボタンを", "ブックマークバーへ", "ドラッグ"]}</StepTitle>
      <Lead>
        ボタンを押したまま、画面上部のブックマークバーまで動かして離します。名前は、あとで自由に変えられます。
      </Lead>
      <Shot>
        <ShotCaption>動かし方</ShotCaption>
        <BrowserMock bar="drop" />
      </Shot>
      <DraggableBookmarklet />
    </>,
    <>
      <StepTitle>動作の確認</StepTitle>
      <Lead>
        このページのまま、ブックマークバーに追加したブックマークを押します。
        <Example name={EXAMPLE_NAME} />
      </Lead>
      <Shot>
        <ShotCaption>この表示が出れば完了です</ShotCaption>
        <BrowserMock bar="added" />
      </Shot>
      <VerifyResult fallback="表示が出ない場合は、バーのブックマークを削除し、ステップ2からやり直します。" />
    </>,
  ];
}

/** ブックマークレットの追加方法。端末ごとのタブで、1画面1ステップの図解を出す。 */
export function AddBookmarkletPage() {
  const [device, setDevice] = useState<Device>(detectDevice);
  const [step, setStep] = useState(0);
  const next = () => setStep(1);
  const steps =
    device === "ios" ? iosSteps(next) : device === "android" ? androidSteps(next) : pcSteps();
  return (
    <StepGuide
      title="ブックマークレットの追加"
      steps={steps}
      step={Math.min(step, steps.length - 1)}
      onStep={setStep}
      onBack={goBack}
      onDone={goBack}
      tabs={TABS}
      tab={device}
      onTab={(d) => {
        setDevice(d);
        setStep(0);
      }}
    />
  );
}
