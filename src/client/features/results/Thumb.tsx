import { useEffect, useState } from "react";
import { css, cx } from "styled-system/css";

/**
 * 写真のシリアル部分の切り抜き。object URL は表示している間だけ作る。
 * @param large 修正のシートなど、大きく見せる場所
 */
export function Thumb({ blob, large = false }: { blob?: Blob; large?: boolean }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  if (!url) return null;
  return (
    <img
      src={url}
      alt="写真のシリアルナンバー部分"
      className={cx(
        css({
          display: "block",
          w: "auto",
          maxW: "full",
          objectFit: "contain",
          objectPosition: "left",
          borderRadius: "sm",
          borderWidth: "1px",
          borderColor: "border",
          // 縦横比が合わず余白ができたとき、余白を切り抜きと見分けられるようにする
          bg: "bg.sunken",
        }),
        css({ h: large ? "16" : "10" }),
      )}
    />
  );
}
