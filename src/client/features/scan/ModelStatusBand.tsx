import { useEffect, useState } from "react";
import { css } from "styled-system/css";
import { Button } from "../../components/Button.tsx";
import { Icon } from "../../components/Icon.tsx";
import { useModelStatus } from "../../lib/ocr.ts";

const READY_KEY = "serial-snap:model-ready";

/** 前に一度でも準備が済んだか。済んでいれば、モデルはブラウザに保存されている。 */
function wasReadyBefore(): boolean {
  try {
    return localStorage.getItem(READY_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * 2回目以降も、保存済みのモデルの読み込みと初期化に1秒ほどかかる。その間に表示が一瞬出ないよう、
 * 2回目以降はこの時間を超えたときだけ出す。
 */
const SHOW_AFTER_MS_RETURNING = 3000;

/** 読み取りの仕組みの準備の進み具合。準備ができたら何も出さない。 */
export function ModelStatusBand() {
  const status = useModelStatus();
  const [returning] = useState(wasReadyBefore);
  const [visible, setVisible] = useState(!returning);
  useEffect(() => {
    if (!returning) return;
    const timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS_RETURNING);
    return () => clearTimeout(timer);
  }, [returning]);
  useEffect(() => {
    if (status.kind !== "ready") return;
    try {
      localStorage.setItem(READY_KEY, "1");
    } catch {
      // 記録できなくても、次回も初回と同じ表示になるだけ
    }
  }, [status.kind]);

  if (status.kind === "ready") return null;
  if (status.kind === "error") {
    return (
      <div
        role="alert"
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "2.5",
          p: "3",
          borderRadius: "md",
          borderWidth: "1px",
          borderColor: "danger",
          bg: "danger.subtle",
          color: "danger",
          fontSize: "sm",
        })}
      >
        <Icon name="offline" />
        <span className={css({ flex: "1", fontWeight: "bold" })}>スキャンの準備に失敗しました</span>
        <Button size="sm" onClick={() => location.reload()}>
          開き直す
        </Button>
      </div>
    );
  }
  if (!visible) return null;
  const percent = Math.round(status.progress * 100);
  return (
    <div role="status" className={css({ display: "grid", gap: "1.5" })}>
      <div
        className={css({ h: "1.5", bg: "bg.sunken", borderRadius: "full", overflow: "hidden" })}
        role="progressbar"
        aria-label="スキャンの準備"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className={css({ h: "full", bg: "accent", borderRadius: "full" })}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className={css({ fontSize: "xs", lineHeight: "snug" })}>
        <b>
          スキャンの準備中{returning ? "" : "(初回のみ)"} {percent}%
        </b>
        {!returning && (
          <>
            <br />
            <span className={css({ color: "fg.muted" })}>
              Wi-Fi接続を推奨します。準備中も撮影できます。
            </span>
          </>
        )}
      </p>
    </div>
  );
}
