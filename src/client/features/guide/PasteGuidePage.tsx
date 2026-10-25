import { useState } from "react";
import { css } from "styled-system/css";
import { Icon } from "../../components/Icon.tsx";
import { goBack, navigate } from "../../lib/router.ts";
import {
  CopyBarMock,
  Example,
  FilledMock,
  fakeInput,
  Highlight,
  Lead,
  Mock,
  MockRow,
  Note,
  Shot,
  ShotCaption,
  StepTitle,
} from "./parts.tsx";
import { StepGuide } from "./StepGuide.tsx";

/** 案内で例に出す、ブックマークレットの名前（追加方法の案内と同じ）。 */
const EXAMPLE_NAME = "シリアルスナップ";
/** 繰り返しの手順の1行。 */
function LoopItem({ n, children }: { n: number; children: string }) {
  return (
    <li
      className={css({
        display: "flex",
        alignItems: "center",
        gap: "2.5",
        minH: "[52px]",
        px: "3",
        py: "2",
        bg: "bg.surface",
        borderWidth: "1px",
        borderColor: "border",
        borderRadius: "md",
        fontWeight: "bold",
      })}
    >
      <span
        className={css({
          flex: "none",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          w: "6",
          h: "6",
          borderRadius: "full",
          bg: "accent.subtle",
          color: "accent.text",
          fontSize: "sm",
        })}
      >
        {n}
      </span>
      {children}
    </li>
  );
}

function LoopArrow() {
  return (
    <li
      aria-hidden="true"
      className={css({ display: "flex", justifyContent: "center", color: "fg.muted" })}
    >
      <Icon name="arrowDown" />
    </li>
  );
}

function steps() {
  return [
    <>
      <StepTitle>{["「1〜10件目をコピー」を", "押す"]}</StepTitle>
      <Lead>応募サイトの登録は、一度に10件までです。10件ずつコピーします。</Lead>
      <Shot>
        <ShotCaption>スキャン結果の画面の、いちばん下</ShotCaption>
        <CopyBarMock />
      </Shot>
      <Note>
        <span>色の付いた行は、注意を確かめてください。ページは上のタブで切り替えます。</span>
      </Note>
    </>,
    <>
      <StepTitle>{["応募サイトにログインし", "シリアルナンバー登録の", "画面を開く"]}</StepTitle>
      <Shot>
        <ShotCaption>シリアルナンバーの入力欄が並んだ画面</ShotCaption>
        <Mock>
          <div className={css({ display: "grid", gap: "2", p: "3.5" })}>
            <span className={css({ fontWeight: "bold", fontSize: "sm" })}>
              シリアルナンバー登録
            </span>
            <span className={fakeInput} />
            <span className={fakeInput} />
            <span className={fakeInput} />
            <span className={css({ fontSize: "xs", color: "fg.muted", textAlign: "center" })}>
              …入力欄は10個まで増やせます
            </span>
          </div>
        </Mock>
      </Shot>
      <Lead>
        コピーしたあと、スキャン結果の画面の「応募サイトを開く」から開けます。ログインはご自身で行います。
      </Lead>
    </>,
    <>
      <StepTitle>{["ブックマークから", "追加したブックマークレットを", "開く"]}</StepTitle>
      <Shot>
        <ShotCaption>iPhone：ブックマークの一覧から選ぶ</ShotCaption>
        <Mock>
          <MockRow>
            <Highlight block>
              <b className={css({ px: "1.5", py: "1", borderRadius: "md" })}>{EXAMPLE_NAME}</b>
            </Highlight>
          </MockRow>
        </Mock>
        <ShotCaption>Android：アドレスバーに、付けた名前を入力して、候補を押す</ShotCaption>
        <Mock>
          <MockRow>
            <Highlight block>
              <span
                className={css({
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2",
                  px: "1.5",
                  py: "1",
                  borderRadius: "md",
                })}
              >
                <Icon name="star" size={20} />
                <b>{EXAMPLE_NAME}</b>
              </span>
            </Highlight>
          </MockRow>
        </Mock>
      </Shot>
      <Lead>
        <Example name={EXAMPLE_NAME} />
        シリアルナンバー登録の画面のまま操作します。パソコンは、ブックマークバーから開きます。
      </Lead>
      <Lead>
        開いたパネルの「クリップボードから入力」を押します。iPhoneは、続けて出る「ペースト」を押します。
      </Lead>
    </>,
    <>
      <StepTitle>{["内容を確認し", "登録ボタンを", "自分で押す"]}</StepTitle>
      <Shot>
        <FilledMock />
      </Shot>
      <Note icon="warn" tone="warn">
        <span>登録ボタンは自動では押しません。紙と見比べてから押します。</span>
      </Note>
    </>,
    <>
      <StepTitle>{["11件以上ある場合は", "繰り返す"]}</StepTitle>
      <Lead>登録が終わったら、アプリで次の10件をコピーします。</Lead>
      <Shot>
        <ol className={css({ display: "grid", gap: "2" })}>
          <LoopItem n={1}>応募サイトで登録</LoopItem>
          <LoopArrow />
          <LoopItem n={2}>アプリで「11〜20」のタブを選び「11〜20件目をコピー」</LoopItem>
          <LoopArrow />
          <LoopItem n={3}>再び、追加したブックマークレットを開く</LoopItem>
        </ol>
        <ShotCaption>
          <Icon name="reload" size={16} />
          シリアルナンバーがなくなるまで繰り返します
        </ShotCaption>
      </Shot>
      <Lead muted>コピーしたページのタブには、印が付きます。</Lead>
    </>,
  ];
}

/** 貼り付けの手順。コピーから、応募サイトで自分で登録するまで。 */
export function PasteGuidePage() {
  const [step, setStep] = useState(0);
  const list = steps();
  return (
    <StepGuide
      title="貼り付けの手順"
      steps={list}
      step={step}
      onStep={setStep}
      onBack={goBack}
      onDone={() => navigate({ name: "top" }, { replace: true })}
      doneLabel="トップに戻る"
    />
  );
}
