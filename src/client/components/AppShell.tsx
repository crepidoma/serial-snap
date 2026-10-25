import type { ReactNode } from "react";
import { css, cx } from "styled-system/css";

/**
 * 中身を置く列。スマホが中心のため、PCでも同じ1列の画面を中央に出す（最大560px）。
 * ヘッダーや帯は端から端まで色を敷き、中身だけをこの列に揃える。
 */
export const column = css({ w: "full", maxW: "[560px]", mx: "auto" });

/**
 * 画面の骨組み。ヘッダーを上、操作の帯を下端に固定し、その間だけをスクロールさせる。
 * ホーム画面に追加して開くと、上部がスクロールする領域だと、iPhoneでは時計などの部分にぼかしがかかるため。
 * ノッチとホームバーの分の余白は safe-area で取る（index.html の viewport-fit=cover と組み合わせる）。
 */
export function AppShell({
  header,
  footer,
  fill = false,
  children,
}: {
  header: ReactNode;
  /** 下端に固定する操作の帯。ない画面では、本文の下にホームバーの分の余白を取る */
  footer?: ReactNode;
  /** 本文を画面の高さいっぱいに広げる。ボタンを本文の下端に置く画面（読み取り中・まとめ）で使う */
  fill?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={css({
        h: "dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bg: "bg.canvas",
      })}
    >
      <header
        className={css({
          flex: "none",
          position: "relative",
          zIndex: "3",
          bg: "bg.surface",
          pt: "[env(safe-area-inset-top)]",
          boxShadow: "[0 1px 0 {colors.border}]",
        })}
      >
        {header}
      </header>
      <main
        className={css({
          flex: "1",
          minH: "0",
          overflowY: "auto",
          position: "relative",
          pb: footer ? "0" : "[max(12px, env(safe-area-inset-bottom))]",
          display: fill ? "flex" : "block",
          flexDirection: "column",
        })}
      >
        <div
          className={cx(
            column,
            fill && css({ flex: "1", display: "flex", flexDirection: "column" }),
          )}
        >
          {children}
        </div>
      </main>
      {footer && (
        <footer
          className={css({
            flex: "none",
            position: "relative",
            zIndex: "3",
            bg: "bg.surface",
            borderTopWidth: "1px",
            borderColor: "border",
            px: "4",
            pt: "2.5",
            pb: "[max(12px, env(safe-area-inset-bottom))]",
          })}
        >
          <div className={column}>{footer}</div>
        </footer>
      )}
    </div>
  );
}
