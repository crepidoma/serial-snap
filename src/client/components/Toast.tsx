import { useSyncExternalStore } from "react";
import { css } from "styled-system/css";
import { Icon } from "./Icon.tsx";

/** 画面の下に短く出す知らせ（「1〜10件目をコピーしました」など）。 */
let message: { id: number; text: string } | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

/** 知らせを出す。2秒ほどで消える。 */
export function showToast(text: string) {
  message = { id: (message?.id ?? 0) + 1, text };
  emit();
  clearTimeout(timer);
  timer = setTimeout(() => {
    message = undefined;
    emit();
  }, 2200);
}

/** 知らせを表示する場所。アプリに1つだけ置く。下端の操作の帯に重ならない高さに出す。 */
export function ToastHost() {
  const current = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => message,
  );
  return (
    <div
      role="status"
      aria-live="polite"
      className={css({
        position: "fixed",
        left: "0",
        right: "0",
        bottom: "[calc(max(12px, env(safe-area-inset-bottom)) + 88px)]",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: "10",
      })}
    >
      {current && (
        <span
          key={current.id}
          className={css({
            display: "inline-flex",
            alignItems: "center",
            gap: "2",
            px: "4",
            py: "2.5",
            borderRadius: "full",
            bg: "fg",
            color: "bg.surface",
            fontSize: "sm",
            fontWeight: "bold",
            boxShadow: "md",
            animation: "[fadeIn 0.15s ease-out]",
          })}
        >
          <Icon name="check" size={18} />
          {current.text}
        </span>
      )}
    </div>
  );
}
