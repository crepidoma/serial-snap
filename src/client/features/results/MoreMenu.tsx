import { useEffect, useRef, useState } from "react";
import { css, cx } from "styled-system/css";
import { Icon, type IconName } from "../../components/Icon.tsx";

/** 「⋯」のメニューの項目。`href` があれば別のタブで開くリンクにする。 */
export interface MoreMenuItem {
  label: string;
  icon: IconName;
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
}

const item = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  w: "full",
  minH: "14",
  px: "4",
  borderBottomWidth: "1px",
  borderColor: "border",
  fontWeight: "bold",
  textAlign: "left",
  textDecoration: "none",
  color: "fg",
  bg: "bg.surface",
  _last: { borderBottomWidth: "0" },
  _hoverable: { _hover: { bg: "bg.sunken" } },
});

/** ヘッダーの右の「⋯」と、押すと下に開くメニュー。外側を押すかEscキーで閉じる。 */
export function MoreMenu({ label, items }: { label: string; items: MoreMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    // 開いたら最初の項目へフォーカスを移し、キーボードでもそのまま選べるようにする
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={css({ position: "relative" })}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={css({
          w: "11",
          h: "11",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "md",
          color: "fg",
          _hoverable: { _hover: { bg: "bg.sunken" } },
        })}
      >
        <Icon name="more" />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          className={css({
            position: "absolute",
            top: "[calc(100% + 4px)]",
            right: "0",
            zIndex: "10",
            w: "[260px]",
            bg: "bg.surface",
            borderWidth: "1px",
            borderColor: "border",
            borderRadius: "md",
            boxShadow: "lg",
            overflow: "hidden",
            animation: "[fadeIn 0.12s ease-out]",
          })}
        >
          {items.map((it) => {
            const className = cx(item, it.danger && css({ color: "danger" }));
            const content = (
              <>
                <Icon name={it.icon} />
                <span>{it.label}</span>
              </>
            );
            return it.href ? (
              <a
                key={it.label}
                role="menuitem"
                href={it.href}
                target="_blank"
                rel="noreferrer"
                className={className}
                onClick={() => setOpen(false)}
              >
                {content}
              </a>
            ) : (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                className={className}
                onClick={() => {
                  setOpen(false);
                  it.onSelect?.();
                }}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
