import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";

/** 離したときに閉じる、シートの高さに対する引き下げた距離の割合。 */
const CLOSE_RATIO = 0.25;
/** 距離が足りなくても閉じる、払う速さ（px/ms）。cast-calendarのスワイプと同じ値。 */
const FLICK_VELOCITY = 0.4;
/** 払うときに最低限動かす距離（px）。軽く触れただけで閉じないように */
const FLICK_MIN_DISTANCE = 24;

interface Drag {
  pointerId: number;
  startY: number;
  lastY: number;
  lastTime: number;
  velocity: number;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 下から出るシート。開くときも閉じるときも下からスライドし、上端のハンドルをつかんで引き下げると閉じる。
 * ネイティブの <dialog> を使い、フォーカスの移動とEscキーをブラウザに任せる。
 * 閉じたいとき（背景・Escキー・引き下げ）は `onClose` を呼ぶので、親が `open` を false にする。
 */
export function BottomSheet({
  open,
  title,
  aside,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  /** 見出しの右に添えるもの（応募先のバッジなど） */
  aside?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      setClosing(false);
      setOffset(0);
      if (!dialog.open) {
        dialog.showModal();
        // <dialog> は開くと最初の入力欄へフォーカスを移し、スマホではキーボードが開いて上の内容が
        // 画面の外へ押し出される。見出しへフォーカスを移し、入力欄は押したときだけ使うようにする
        headRef.current?.focus({ preventScroll: true });
      }
    } else if (dialog.open) {
      // 動きを減らす設定では transition が起きず終わりを検知できないため、その場で閉じる
      if (prefersReducedMotion()) dialog.close();
      else setClosing(true);
    }
  }, [open]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!open || !vv) return;
    // スマホのキーボードが開いている間は、シートをキーボードのすぐ上に置き、見える高さに収める。
    // 画面の下端に置いたままだと、キーボードに隠れた分だけ画面全体が上へずれ、シートの上側が見えなくなる
    const update = () => {
      const dialog = ref.current;
      if (!dialog) return;
      const keyboard = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      dialog.style.setProperty("--keyboard", `${keyboard}px`);
      dialog.style.setProperty("--visible-height", `${vv.height}px`);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [open]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (closing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      lastY: e.clientY,
      lastTime: e.timeStamp,
      velocity: 0,
    };
    setDragging(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dt = e.timeStamp - d.lastTime;
    if (dt > 0) d.velocity = (e.clientY - d.lastY) / dt;
    d.lastY = e.clientY;
    d.lastTime = e.timeStamp;
    // 上へは動かさない。シートの上に隙間ができないように
    setOffset(Math.max(0, e.clientY - d.startY));
  };

  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
    const dy = Math.max(0, e.clientY - d.startY);
    const height = ref.current?.offsetHeight ?? 1;
    const far = dy > height * CLOSE_RATIO;
    const flick = d.velocity > FLICK_VELOCITY && dy > FLICK_MIN_DISTANCE;
    // 指を離した位置から、閉じる位置か元の位置へ transition で動かす。
    // 閉じるときは親が open を変えるのを待たずに動かし始め、一瞬元の位置へ戻って見えないようにする
    setOffset(0);
    if (e.type === "pointerup" && (far || flick)) {
      if (prefersReducedMotion()) ref.current?.close();
      else setClosing(true);
      onClose();
    }
  };

  return (
    // 背景（シートの外側）を押したら閉じる。キーボードでは <dialog> の標準の動きでEscキーで閉じられる
    // biome-ignore lint/a11y/useKeyWithClickEvents: キーボードはEscキーで閉じられる
    <dialog
      ref={ref}
      aria-label={title}
      data-closing={closing || undefined}
      data-dragging={dragging || undefined}
      onCancel={(e) => {
        // Escキーでも、すぐに消さずに下へスライドして閉じる
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && e.propertyName === "transform" && closing) {
          ref.current?.close();
          setClosing(false);
        }
      }}
      style={offset ? { transform: `translateY(${offset}px)` } : undefined}
      className={css({
        m: "0",
        mt: "auto",
        mx: "auto",
        w: "full",
        maxW: "[560px]",
        mb: "[var(--keyboard, 0px)]",
        maxH: "[calc(var(--visible-height, 100dvh) * 0.9)]",
        p: "0",
        bg: "bg.surface",
        color: "fg",
        borderTopRadius: "[20px]",
        boxShadow: "lg",
        animation: "[sheetIn 0.24s cubic-bezier(.2,.8,.2,1)]",
        transition: "[transform 0.24s cubic-bezier(.2,.8,.2,1)]",
        "&[data-dragging]": { transition: "[none]" },
        // 閉じるときは加速しながら下へ抜ける
        "&[data-closing]": {
          transform: "translateY(100%)",
          transition: "[transform 0.2s cubic-bezier(.4,0,1,1)]",
        },
        "&::backdrop": {
          bg: "scrim",
          animation: "[fadeIn 0.24s]",
          transition: "[opacity 0.2s]",
        },
        "&[data-closing]::backdrop": { opacity: "0" },
        _motionReduce: {
          animation: "[none]",
          transition: "[none]",
          "&::backdrop": { animation: "[none]" },
        },
      })}
    >
      <div
        ref={headRef}
        // 開いたときのフォーカスの置き場所（見た目の枠は出さない）
        tabIndex={-1}
        // ハンドルだけでは小さくつかみにくいため、見出しまでをつかめる範囲にする
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className={css({
          display: "grid",
          gap: "3",
          px: "4",
          pt: "3",
          pb: "4",
          touchAction: "none",
          outline: "none",
          cursor: "grab",
          userSelect: "none",
          "[data-dragging] &": { cursor: "grabbing" },
        })}
      >
        <div
          aria-hidden="true"
          className={css({
            justifySelf: "center",
            w: "10",
            h: "1",
            borderRadius: "full",
            bg: "border.strong",
          })}
        />
        <div className={css({ display: "flex", alignItems: "center", gap: "2" })}>
          <h2 className={css({ flex: "1", fontSize: "lg", fontWeight: "bold" })}>{title}</h2>
          {aside}
        </div>
      </div>
      {children}
    </dialog>
  );
}
