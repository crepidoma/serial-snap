import { Fragment } from "react";
import { css } from "styled-system/css";

const phrases = css({
  // 指定した区切り（<wbr>）以外では折り返さない。1つの文節が幅に収まらないときだけ途中で折り返す
  wordBreak: "keep-all",
  overflowWrap: "anywhere",
});

/**
 * 文節ごとに区切った文。見出しなど短い文を、狭い画面でも文節の区切りで折り返す。
 * CSS の `word-break: auto-phrase` は iPhone の Safari が対応しておらず、語の途中で折り返すため、区切りを書いて渡す。
 */
export function Phrases({ children }: { children: string[] }) {
  return (
    <span className={phrases}>
      {children.map((part, i) => (
        // 区切りの順は変わらない
        // biome-ignore lint/suspicious/noArrayIndexKey: 文節の並びは固定
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {part}
        </Fragment>
      ))}
    </span>
  );
}
